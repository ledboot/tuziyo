import { Stripe } from "stripe"
import type { Context } from "hono"
import type { Env } from "../types"
import { addCredits } from "./credits"

function getStripe(c: Context<{ Bindings: Env }>): Stripe {
  return new Stripe(c.env.STRIPE_SECRET_KEY)
}

const PLAN_CREDITS: Record<string, number> = {
  "AI Starter": 500,
  "AI Professional": 2000,
  "Enterprise": 5000,
}

export async function handleGetProducts(c: Context<{ Bindings: Env }>) {
  const stripe = getStripe(c)

  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
  })

  const products = prices.data.map(price => {
    const product = price.product as Stripe.Product
    const features = product.metadata?.features ? product.metadata.features.split("|") : []

    return {
      id: price.id,
      product_id: product.id,
      product_name: product.name,
      product_description: product.description,
      unit_amount: price.unit_amount,
      currency: price.currency,
      recurring: price.recurring,
      interval: price.recurring?.interval || null,
      features,
      credits: parseInt(product.metadata?.credits || "0", 10),
      images: parseInt(product.metadata?.images || "0", 10),
      sort: parseInt(product.metadata?.sort || "99", 10),
      recommend: product.metadata?.recommend === "true",
    }
  })

  return c.json({ products })
}

export async function handleCreateCheckoutSession(c: Context<{ Bindings: Env }>) {
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

      if (userId && plan) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

        await c.env.DB.prepare(
          `
            INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_customer_id, price_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              stripe_subscription_id = excluded.stripe_subscription_id,
              stripe_customer_id = excluded.stripe_customer_id,
              price_id = excluded.price_id,
              plan = excluded.plan,
              status = excluded.status,
              current_period_start = excluded.current_period_start,
              current_period_end = excluded.current_period_end,
              updated_at = excluded.updated_at
          `
        )
          .bind(
            userId,
            subscription.id,
            subscription.customer as string,
            priceId || "",
            plan.toLowerCase(),
            subscription.status,
            subscription.current_period_start,
            subscription.current_period_end,
            timestamp,
            timestamp
          )
          .run()

        const creditsAmount = PLAN_CREDITS[plan] || 0
        if (creditsAmount > 0) {
          await addCredits(c.env.DB, userId, creditsAmount, "subscription", `Subscription: ${plan}`)
        }

        const userTypeMap: Record<string, string> = {
          "AI Starter": "starter",
          "AI Professional": "professional",
          Enterprise: "enterprise",
        }
        const newUserType = userTypeMap[plan]
        if (newUserType) {
          await c.env.DB.prepare("UPDATE users SET user_type = ?, updated_at = ? WHERE id = ?")
            .bind(newUserType, timestamp, userId)
            .run()
        }
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      console.log("customer.subscription.updated")

      await c.env.DB.prepare(
        `
          UPDATE subscriptions SET
            status = ?,
            current_period_start = ?,
            current_period_end = ?,
            updated_at = ?
          WHERE stripe_subscription_id = ?
        `
      )
        .bind(
          subscription.status,
          subscription.current_period_start,
          subscription.current_period_end,
          timestamp,
          subscription.id
        )
        .run()
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      console.log("customer.subscription.deleted", subscription)

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
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      console.log("invoice.payment_failed")

      await c.env.DB.prepare(
        `
          UPDATE subscriptions SET
            status = 'past_due',
            updated_at = ?
          WHERE stripe_customer_id = ?
        `
      )
        .bind(timestamp, invoice.customer as string)
        .run()
      break
    }

    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription
      console.log("customer.subscription.created")
      break
    }

    case "invoice.paid": {
      // 用于续费处理
      const invoice = event.data.object as Stripe.Invoice
      console.log("invoice.paid")
      break
    }
  }

  return c.json({ received: true })
}

export async function handleGetSubscription(c: Context<{ Bindings: Env }>) {
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

export async function handleCreateCustomerPortal(c: Context<{ Bindings: Env }>) {
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
