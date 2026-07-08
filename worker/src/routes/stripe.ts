import { Stripe } from "stripe"
import type { Context } from "hono"
import type { AuthenticatedContext, Env } from "../types"
import { addOneMonth, grantSubscriptionCredits, resetSubscriptionCredits } from "./credits"
import { UserTypeMap } from "../const"

const PAYMENT_GRACE_PERIOD_SECONDS = 7 * 24 * 60 * 60

function getStripe(c: { env: Env }): Stripe {
  return new Stripe(c.env.STRIPE_SECRET_KEY)
}

function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const legacySubscription = subscription as Stripe.Subscription & {
    current_period_start?: number
    current_period_end?: number
  }
  const firstItem = subscription.items.data[0]

  return {
    currentPeriodStart:
      legacySubscription.current_period_start ?? firstItem?.current_period_start ?? 0,
    currentPeriodEnd: legacySubscription.current_period_end ?? firstItem?.current_period_end ?? 0,
  }
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null
    parent?: {
      subscription_details?: {
        subscription?: string | null
      } | null
    } | null
  }
  const subscription = invoiceWithSubscription.subscription

  if (typeof subscription === "string") return subscription
  if (subscription?.id) return subscription.id

  return invoiceWithSubscription.parent?.subscription_details?.subscription ?? null
}

function isDuplicateInvoiceTransactionError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("idx_credit_transactions_invoice_id") ||
      error.message.includes("credit_transactions.invoice_id") ||
      error.message.includes("idx_credit_transactions_subscription_period") ||
      error.message.includes(
        "credit_transactions.user_id, credit_transactions.credit_period_start, credit_transactions.credit_period_end"
      ))
  )
}

function getCreditGrantSchedule(
  interval: "month" | "year",
  periodStart: number,
  subscriptionPeriodEnd: number
) {
  if (interval === "year") {
    const firstGrantPeriodEnd = Math.min(addOneMonth(periodStart), subscriptionPeriodEnd)
    return {
      creditPeriodStart: periodStart,
      creditPeriodEnd: firstGrantPeriodEnd,
      lastCreditGrantAt: periodStart,
      nextCreditGrantAt: firstGrantPeriodEnd >= subscriptionPeriodEnd ? null : firstGrantPeriodEnd,
    }
  }

  return {
    creditPeriodStart: periodStart,
    creditPeriodEnd: subscriptionPeriodEnd,
    lastCreditGrantAt: periodStart,
    nextCreditGrantAt: null,
  }
}

export async function handleGetProducts(c: Context<{ Bindings: Env }>) {
  const stripe = getStripe(c)

  try {
    // 1. 获取所有激活的商品
    const activeProducts = await stripe.products.list({
      active: true,
    })

    // 2. 获取所有激活的价格
    const activePrices = await stripe.prices.list({
      active: true,
    })

    // 将价格按 product_id 进行归类
    const pricesMap: Record<string, Stripe.Price[]> = {}
    for (const price of activePrices.data) {
      const prodId = typeof price.product === "string" ? price.product : price.product.id
      if (!pricesMap[prodId]) {
        pricesMap[prodId] = []
      }
      pricesMap[prodId].push(price)
    }

    // 3. 组合成产品列表，每个产品包含它的价格信息
    const products = activeProducts.data
      .map(product => {
        const prodsPrices = pricesMap[product.id] || []
        const features = product.metadata?.features ? product.metadata.features.split("|") : []

        // 寻找月付和年付价格
        const monthlyPrice = prodsPrices.find(
          p =>
            p.recurring?.interval === "month" &&
            (!p.recurring.interval_count || p.recurring.interval_count === 1)
        )
        const yearlyPrice = prodsPrices.find(p => p.recurring?.interval === "year")

        if (!monthlyPrice && !yearlyPrice) return null // 过滤掉没有有效价格的产品

        return {
          product_id: product.id,
          product_name: product.name,
          product_description: product.description || "",
          features,
          credits: parseInt(product.metadata?.credits || "0", 10),
          images: parseInt(product.metadata?.images || "0", 10),
          sort: parseInt(product.metadata?.sort || "99", 10),
          recommend: product.metadata?.recommend === "true",
          prices: {
            monthly: monthlyPrice
              ? {
                  id: monthlyPrice.id,
                  unit_amount: monthlyPrice.unit_amount,
                  currency: monthlyPrice.currency,
                }
              : null,
            yearly: yearlyPrice
              ? {
                  id: yearlyPrice.id,
                  unit_amount: yearlyPrice.unit_amount,
                  currency: yearlyPrice.currency,
                }
              : null,
          },
        }
      })
      .filter(Boolean)
      .sort((a, b) => a!.sort - b!.sort)

    return c.json({ products })
  } catch (error) {
    console.error("Failed to fetch products in handleGetProducts:", error)
    return c.json({ error: "Failed to fetch products" }, 500)
  }
}

export async function handleCreateCheckoutSession(c: AuthenticatedContext) {
  const stripe = getStripe(c)
  const { priceId } = await c.req.json<{ priceId: string }>()

  if (!priceId) {
    return c.json({ error: "Invalid plan ID" }, 400)
  }

  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const appOrigin = c.env.FRONTEND_URL

  try {
    const price = await stripe.prices.retrieve(priceId, {
      expand: ["product"],
    })
    const product = price.product as Stripe.Product
    const planName = product.name

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appOrigin}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appOrigin}/pricing?canceled=true`,
      metadata: {
        userId: user.userId,
        priceId: priceId,
        plan: planName,
      },
      customer_email: user.email,
    })

    return c.json({ url: session.url, sessionId: session.id })
  } catch {
    return c.json({ error: "Failed to create checkout session" }, 500)
  }
}

export async function handleStripeWebhook(c: Context<{ Bindings: Env }>) {
  const stripe = getStripe(c)
  const signature = c.req.header("stripe-signature")
  const body = await c.req.text()

  if (!signature || !body) {
    return c.json({ error: "Missing signature or body" }, 400)
  }

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, c.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.log("Webhook verification failed:", error)
    return c.json({ error: "Webhook verification failed" }, 400)
  }

  const timestamp = Math.floor(Date.now() / 1000)

  console.log("handleStripeWebhook event type:", event.type)

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      console.log("checkout.session.completed")

      const userId = session.metadata?.userId
      const plan = session.metadata?.plan
      const priceId = session.metadata?.priceId
      const invoiceId =
        typeof session.invoice === "string" ? session.invoice : session.invoice?.id || null

      if (userId && plan) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(subscription)

        // 1. 通过 Stripe Product metadata 获取动态额度和用户组类型，支持在控制台动态增改套餐
        let creditsAmount = 0
        let userType = "free"
        let creditGrantInterval: "month" | "year" = "month"
        const activePriceId = priceId || subscription.items.data[0]?.price.id

        if (activePriceId) {
          try {
            const price = await stripe.prices.retrieve(activePriceId, {
              expand: ["product"],
            })
            const product = price.product as Stripe.Product
            creditsAmount = parseInt(product.metadata?.credits || String(creditsAmount), 10)
            userType = product.metadata?.user_type || ""
            creditGrantInterval = price.recurring?.interval === "year" ? "year" : "month"
          } catch (err) {
            console.error(
              "Failed to retrieve Stripe Product metadata in checkout.session.completed:",
              err
            )
          }
        }

        // 兜底逻辑：如果 Stripe metadata 中未配置 user_type，使用硬编码的映射
        if (!userType) {
          userType = UserTypeMap[plan] || "starter"
        }

        // 幂等性校验：检查该订阅是否已在数据库中存在，避免因 Stripe 重试事件导致重复赠送初始额度
        const existingSub = await c.env.DB.prepare(
          "SELECT stripe_subscription_id FROM subscriptions WHERE stripe_subscription_id = ?"
        )
          .bind(subscription.id)
          .first()

        const subscriptionId = crypto.randomUUID()
        const grantSchedule = getCreditGrantSchedule(
          creditGrantInterval,
          currentPeriodStart,
          currentPeriodEnd
        )

        await c.env.DB.prepare(
          `
            INSERT INTO subscriptions (
              id,
              user_id,
              stripe_subscription_id,
              stripe_customer_id,
              price_id,
              plan,
              status,
              current_period_start,
              current_period_end,
              credit_grant_interval,
              monthly_credit_amount,
              last_credit_grant_at,
              next_credit_grant_at,
              created_at,
              updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              stripe_subscription_id = excluded.stripe_subscription_id,
              stripe_customer_id = excluded.stripe_customer_id,
              price_id = excluded.price_id,
              plan = excluded.plan,
              status = excluded.status,
              current_period_start = excluded.current_period_start,
              current_period_end = excluded.current_period_end,
              credit_grant_interval = excluded.credit_grant_interval,
              monthly_credit_amount = excluded.monthly_credit_amount,
              last_credit_grant_at = excluded.last_credit_grant_at,
              next_credit_grant_at = excluded.next_credit_grant_at,
              payment_failed_at = NULL,
              grace_period_ends_at = NULL,
              updated_at = excluded.updated_at
          `
        )
          .bind(
            subscriptionId,
            userId,
            subscription.id,
            subscription.customer as string,
            activePriceId || "",
            plan.toLowerCase(),
            subscription.status,
            currentPeriodStart,
            currentPeriodEnd,
            creditGrantInterval,
            creditsAmount,
            grantSchedule.lastCreditGrantAt,
            grantSchedule.nextCreditGrantAt,
            timestamp,
            timestamp
          )
          .run()

        if (!existingSub) {
          if (creditsAmount > 0) {
            try {
              await grantSubscriptionCredits(
                c.env.DB,
                userId,
                creditsAmount,
                grantSchedule.creditPeriodStart,
                grantSchedule.creditPeriodEnd,
                invoiceId
                  ? `Subscription: ${plan} (Invoice: ${invoiceId})`
                  : `Subscription: ${plan}`,
                invoiceId
              )
            } catch (error) {
              if (!isDuplicateInvoiceTransactionError(error)) {
                throw error
              }
              console.log(
                `Invoice ${invoiceId} already processed, skipping initial credit addition`
              )
            }
          }
        } else {
          console.log(
            `Subscription ${subscription.id} already exists, skipping initial credit addition`
          )
        }

        if (userType && userType !== "free") {
          await c.env.DB.prepare("UPDATE users SET user_type = ?, updated_at = ? WHERE id = ?")
            .bind(userType, timestamp, userId)
            .run()
        }
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(subscription)
      console.log("customer.subscription.updated:", subscription)

      const priceId = subscription.items.data[0]?.price.id
      let planName = ""
      let newUserType = "free"
      let metadataUserType = ""
      let creditGrantInterval: "month" | "year" = "month"
      let monthlyCreditAmount = 0

      if (priceId) {
        try {
          const price = await stripe.prices.retrieve(priceId, {
            expand: ["product"],
          })
          const product = price.product as Stripe.Product
          planName = product.name
          metadataUserType = product.metadata?.user_type || ""
          creditGrantInterval = price.recurring?.interval === "year" ? "year" : "month"
          monthlyCreditAmount = parseInt(product.metadata?.credits || "0", 10)
        } catch (err) {
          console.error("Failed to retrieve price/product details in subscription.updated:", err)
        }
      }

      const isActive = subscription.status === "active" || subscription.status === "trialing"

      if (isActive && planName) {
        if (metadataUserType) {
          newUserType = metadataUserType
        } else {
          newUserType = UserTypeMap[planName] || "starter"
        }
      }

      // 1. 获取订阅关联的 user_id
      const localSub = await c.env.DB.prepare(
        "SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?"
      )
        .bind(subscription.id)
        .first<{ user_id: string }>()

      if (localSub) {
        const userId = localSub.user_id

        // 2. 更新本地订阅表
        await c.env.DB.prepare(
          `
            UPDATE subscriptions SET
              status = ?,
              price_id = ?,
              plan = ?,
              current_period_start = ?,
              current_period_end = ?,
              credit_grant_interval = ?,
              monthly_credit_amount = ?,
              payment_failed_at = ?,
              grace_period_ends_at = ?,
              updated_at = ?
            WHERE stripe_subscription_id = ?
          `
        )
          .bind(
            subscription.status,
            priceId || "",
            planName ? planName.toLowerCase() : "starter",
            currentPeriodStart,
            currentPeriodEnd,
            creditGrantInterval,
            monthlyCreditAmount,
            isActive ? null : timestamp,
            isActive ? null : timestamp + PAYMENT_GRACE_PERIOD_SECONDS,
            timestamp,
            subscription.id
          )
          .run()

        // 3. 同步更新用户表的 user_type
        await c.env.DB.prepare("UPDATE users SET user_type = ?, updated_at = ? WHERE id = ?")
          .bind(newUserType, timestamp, userId)
          .run()

        console.log(
          `Updated user ${userId} type to ${newUserType} due to subscription status: ${subscription.status}`
        )
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      console.log("customer.subscription.deleted:", subscription.id)

      // 1. 获取订阅关联的 user_id
      const localSub = await c.env.DB.prepare(
        "SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?"
      )
        .bind(subscription.id)
        .first<{ user_id: string }>()

      // 2. 将订阅状态标为 canceled
      await c.env.DB.prepare(
        `
          UPDATE subscriptions SET
            status = 'canceled',
            updated_at = ?
          WHERE stripe_subscription_id = ?
        `
      )
        .bind(timestamp, subscription.id)
        .run()

      // 3. 将用户的用户组降级为 free
      if (localSub) {
        await resetSubscriptionCredits(c.env.DB, localSub.user_id, timestamp)
        await c.env.DB.prepare("UPDATE users SET user_type = 'free', updated_at = ? WHERE id = ?")
          .bind(timestamp, localSub.user_id)
          .run()
        console.log(
          `Downgraded user ${localSub.user_id} to free because subscription was deleted/canceled`
        )
      }
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      console.log("invoice.payment_failed:", invoice.id)

      await c.env.DB.prepare(
        `
          UPDATE subscriptions SET
            status = 'past_due',
            payment_failed_at = COALESCE(payment_failed_at, ?),
            grace_period_ends_at = COALESCE(grace_period_ends_at, ?),
            updated_at = ?
          WHERE stripe_customer_id = ?
        `
      )
        .bind(
          timestamp,
          timestamp + PAYMENT_GRACE_PERIOD_SECONDS,
          timestamp,
          invoice.customer as string
        )
        .run()
      break
    }

    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription
      console.log("customer.subscription.created")
      break
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice
      console.log("invoice.paid:", invoice)

      // 只处理订阅周期的续费（billing_reason 为 subscription_cycle）
      // 避免与 initial purchase (subscription_create) 重复赠送额度
      if (invoice.billing_reason === "subscription_cycle") {
        const subscriptionId = getInvoiceSubscriptionId(invoice)
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(subscription)
          let creditsAmount = 0
          let creditGrantInterval: "month" | "year" = "month"

          try {
            const priceId = subscription.items.data[0]?.price.id
            if (priceId) {
              const price = await stripe.prices.retrieve(priceId, {
                expand: ["product"],
              })
              const product = price.product as Stripe.Product
              creditsAmount = parseInt(product.metadata?.credits || "0", 10)
              creditGrantInterval = price.recurring?.interval === "year" ? "year" : "month"
            }
          } catch (err) {
            console.error(
              "Failed to read credits from product metadata during renewal, using fallback:",
              err
            )
          }

          const grantSchedule = getCreditGrantSchedule(
            creditGrantInterval,
            currentPeriodStart,
            currentPeriodEnd
          )

          // 1. 查找本地订阅记录以获取 userId 和 plan
          const localSub = await c.env.DB.prepare(
            "SELECT user_id, plan FROM subscriptions WHERE stripe_subscription_id = ?"
          )
            .bind(subscriptionId)
            .first<{ user_id: string; plan: string }>()

          if (localSub) {
            const { user_id: userId, plan } = localSub

            // 2. 更新本地订阅状态与有效期
            await c.env.DB.prepare(
              `
                UPDATE subscriptions SET
                  status = ?,
                  current_period_start = ?,
                  current_period_end = ?,
                  credit_grant_interval = ?,
                  monthly_credit_amount = ?,
                  last_credit_grant_at = ?,
                  next_credit_grant_at = ?,
                  payment_failed_at = NULL,
                  grace_period_ends_at = NULL,
                  updated_at = ?
                WHERE stripe_subscription_id = ?
              `
            )
              .bind(
                subscription.status,
                currentPeriodStart,
                currentPeriodEnd,
                creditGrantInterval,
                creditsAmount,
                grantSchedule.lastCreditGrantAt,
                grantSchedule.nextCreditGrantAt,
                timestamp,
                subscriptionId
              )
              .run()

            // 3. 幂等性校验：检查是否已经针对此 Invoice 赠送过 Credits
            const hasCredited = await c.env.DB.prepare(
              "SELECT id FROM credit_transactions WHERE invoice_id = ?"
            )
              .bind(invoice.id)
              .first()

            if (!hasCredited) {
              if (creditsAmount > 0) {
                const planDisplayName = plan.charAt(0).toUpperCase() + plan.slice(1)
                try {
                  await grantSubscriptionCredits(
                    c.env.DB,
                    userId,
                    creditsAmount,
                    grantSchedule.creditPeriodStart,
                    grantSchedule.creditPeriodEnd,
                    `Subscription Renewal: ${planDisplayName} (Invoice: ${invoice.id})`,
                    invoice.id
                  )
                  console.log(
                    `Successfully renewed credits for user ${userId}: ${creditsAmount} credits`
                  )
                } catch (error) {
                  if (!isDuplicateInvoiceTransactionError(error)) {
                    throw error
                  }
                  console.log(`Invoice ${invoice.id} already processed, skipping credit addition`)
                }
              }
            } else {
              console.log(`Invoice ${invoice.id} already processed, skipping credit addition`)
            }
          }
        }
      }
      break
    }
  }

  return c.json({ received: true })
}

export async function handleGetSubscription(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const subscription = await c.env.DB.prepare("SELECT * FROM subscriptions WHERE user_id = ?")
    .bind(user.userId)
    .first()

  if (!subscription) {
    return c.json({ subscription: null })
  }

  return c.json({ subscription })
}

export async function handleCreateCustomerPortal(c: AuthenticatedContext) {
  const stripe = getStripe(c)
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const subscription = (await c.env.DB.prepare(
    "SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?"
  )
    .bind(user.userId)
    .first()) as { stripe_customer_id: string } | undefined

  if (!subscription?.stripe_customer_id) {
    return c.json({ error: "No subscription found" }, 404)
  }

  const appOrigin = c.env.FRONTEND_URL

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appOrigin}/pricing`,
    })

    return c.json({ url: session.url })
  } catch {
    return c.json({ error: "Failed to create portal session" }, 500)
  }
}
