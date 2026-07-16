import { v4 as uuidv4 } from "uuid"
import type { AuthenticatedContext } from "../types"
import { MODEL_CREDITS as CREDIT_MAP, MODEL_OPTIONS_CONFIG } from "../imageModels"

export interface CreditInfo {
  balance: number
  subscription_balance: number
  purchased_balance: number
  subscription_period_start: number | null
  subscription_period_end: number | null
  total_purchased: number
  total_used: number
}

export function addOneMonth(timestamp: number): number {
  const date = new Date(timestamp * 1000)
  const sourceDay = date.getUTCDate()
  const sourceMonth = date.getUTCMonth()
  const targetMonthIndex = sourceMonth + 1
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonthIndex / 12)
  const targetMonth = targetMonthIndex % 12
  const lastTargetDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  const targetDay = Math.min(sourceDay, lastTargetDay)

  return Math.floor(
    Date.UTC(
      targetYear,
      targetMonth,
      targetDay,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    ) / 1000
  )
}

function isDuplicateCreditPeriodError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("idx_credit_transactions_subscription_period") ||
      error.message.includes(
        "credit_transactions.user_id, credit_transactions.credit_period_start, credit_transactions.credit_period_end"
      ))
  )
}

export async function getUserCredits(db: D1Database, userId: string): Promise<CreditInfo> {
  const result = await db
    .prepare(
      `
      SELECT
        balance,
        subscription_balance,
        purchased_balance,
        subscription_period_start,
        subscription_period_end,
        total_purchased,
        total_used
      FROM user_credits
      WHERE user_id = ?
    `
    )
    .bind(userId)
    .first<CreditInfo>()

  if (!result) {
    return {
      balance: 0,
      subscription_balance: 0,
      purchased_balance: 0,
      subscription_period_start: null,
      subscription_period_end: null,
      total_purchased: 0,
      total_used: 0,
    }
  }
  return result
}

export async function addCredits(
  db: D1Database,
  userId: string,
  amount: number,
  type: string,
  description: string,
  model?: string,
  creditsPerImage?: number,
  invoiceId?: string | null
): Promise<void> {
  if (amount === 0) return

  const now = Math.floor(Date.now() / 1000)
  const id = uuidv4()

  const updateCredits = db
    .prepare(
      `
      INSERT INTO user_credits (id, user_id, balance, subscription_balance, purchased_balance, total_purchased, total_used, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        balance = balance + excluded.balance,
        purchased_balance = purchased_balance + excluded.purchased_balance,
        total_purchased = total_purchased + excluded.total_purchased,
        total_used = total_used + excluded.total_used,
        updated_at = excluded.updated_at
    `
    )
    .bind(
      id,
      userId,
      amount,
      0,
      amount,
      type === "purchase" || type === "onboarding" ? amount : 0,
      0,
      now
    )

  const insertTransaction = db
    .prepare(
      `
      INSERT INTO credit_transactions (id, user_id, amount, type, description, model, credits_per_image, invoice_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      uuidv4(),
      userId,
      amount,
      type,
      description,
      model || null,
      creditsPerImage || null,
      invoiceId || null,
      now
    )

  await db.batch([insertTransaction, updateCredits])
}

export async function grantSubscriptionCredits(
  db: D1Database,
  userId: string,
  amount: number,
  periodStart: number,
  periodEnd: number,
  description: string,
  invoiceId?: string | null
): Promise<void> {
  if (amount <= 0 || periodEnd <= periodStart) return

  const now = Math.floor(Date.now() / 1000)
  const id = uuidv4()

  const updateCredits = db
    .prepare(
      `
      INSERT INTO user_credits (
        id,
        user_id,
        balance,
        subscription_balance,
        purchased_balance,
        subscription_period_start,
        subscription_period_end,
        total_purchased,
        total_used,
        updated_at
      )
      VALUES (?, ?, ?, ?, 0, ?, ?, ?, 0, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        subscription_balance = excluded.subscription_balance,
        subscription_period_start = excluded.subscription_period_start,
        subscription_period_end = excluded.subscription_period_end,
        balance = purchased_balance + excluded.subscription_balance,
        total_purchased = total_purchased + excluded.total_purchased,
        updated_at = excluded.updated_at
    `
    )
    .bind(id, userId, amount, amount, periodStart, periodEnd, amount, now)

  const insertTransaction = db
    .prepare(
      `
      INSERT INTO credit_transactions (
        id,
        user_id,
        amount,
        type,
        description,
        model,
        credits_per_image,
        invoice_id,
        credit_period_start,
        credit_period_end,
        created_at
      )
      VALUES (?, ?, ?, 'subscription', ?, NULL, NULL, ?, ?, ?, ?)
    `
    )
    .bind(uuidv4(), userId, amount, description, invoiceId || null, periodStart, periodEnd, now)

  await db.batch([insertTransaction, updateCredits])
}

export function calculateRequiredCredits(model: string, input: any): number {
  const baseCredits = CREDIT_MAP[model] || 0
  if (!baseCredits) return 0

  let singleImageCredits = baseCredits

  // 1. Dynamic premium additions based on selected option valueCredits from MODEL_OPTIONS_CONFIG
  const optionsConfig = MODEL_OPTIONS_CONFIG[model]
  if (optionsConfig) {
    for (const [key, option] of Object.entries(optionsConfig)) {
      const selectedValue = input[key]
      if (selectedValue && option.valueCredits) {
        const premium = option.valueCredits[String(selectedValue)]
        if (typeof premium === "number") {
          singleImageCredits += premium
        }
      }
    }
  }

  // 2. Calculate total for all images
  const numImages = Math.max(1, Number(input.num_images) || 1)
  let totalCredits = singleImageCredits * numImages

  // 4. Add reference images premium
  // "一张参考图需要credit=5，添加2张参考图 credit=5*2"
  const referenceImageCount = input.reference_images?.length || 0
  totalCredits += referenceImageCount * 5

  return totalCredits
}

export async function deductCredits(
  db: D1Database,
  userId: string,
  model: string,
  creditsPerImage: number
): Promise<{ success: boolean; error?: string }> {
  const userCredits = await getUserCredits(db, userId)
  if (userCredits.balance < creditsPerImage) {
    return { success: false, error: "Insufficient credits" }
  }

  const subscriptionDeduction = Math.min(userCredits.subscription_balance, creditsPerImage)
  const purchasedDeduction = creditsPerImage - subscriptionDeduction
  const nextSubscriptionBalance = userCredits.subscription_balance - subscriptionDeduction
  const nextPurchasedBalance = userCredits.purchased_balance - purchasedDeduction
  const now = Math.floor(Date.now() / 1000)

  const updateCredits = db
    .prepare(
      `
      UPDATE user_credits
      SET
        subscription_balance = ?,
        purchased_balance = ?,
        balance = ?,
        total_used = total_used + ?,
        updated_at = ?
      WHERE user_id = ?
    `
    )
    .bind(
      nextSubscriptionBalance,
      nextPurchasedBalance,
      nextSubscriptionBalance + nextPurchasedBalance,
      creditsPerImage,
      now,
      userId
    )

  const insertTransaction = db
    .prepare(
      `
      INSERT INTO credit_transactions (id, user_id, amount, type, description, model, credits_per_image, invoice_id, created_at)
      VALUES (?, ?, ?, 'generation', ?, ?, ?, NULL, ?)
    `
    )
    .bind(
      uuidv4(),
      userId,
      -creditsPerImage,
      `Image generation with ${model}`,
      model,
      creditsPerImage,
      now
    )

  await db.batch([insertTransaction, updateCredits])
  return { success: true }
}

export async function expirePastDueSubscriptions(
  db: D1Database,
  now = Math.floor(Date.now() / 1000)
) {
  const expiredSubscriptions = await db
    .prepare(
      `
      SELECT user_id
      FROM subscriptions
      WHERE status = 'past_due'
        AND grace_period_ends_at IS NOT NULL
        AND grace_period_ends_at <= ?
    `
    )
    .bind(now)
    .all<{ user_id: string }>()

  const statements: D1PreparedStatement[] = []

  for (const subscription of expiredSubscriptions.results || []) {
    statements.push(
      db
        .prepare(
          `
          UPDATE user_credits
          SET
            subscription_balance = 0,
            subscription_period_start = NULL,
            subscription_period_end = NULL,
            balance = purchased_balance,
            updated_at = ?
          WHERE user_id = ?
        `
        )
        .bind(now, subscription.user_id)
    )

    statements.push(
      db
        .prepare("UPDATE users SET user_type = 'free', updated_at = ? WHERE id = ?")
        .bind(now, subscription.user_id)
    )

    statements.push(
      db
        .prepare(
          `
          UPDATE subscriptions
          SET status = 'canceled', updated_at = ?
          WHERE user_id = ? AND status = 'past_due'
        `
        )
        .bind(now, subscription.user_id)
    )
  }

  if (statements.length > 0) {
    await db.batch(statements)
  }

  return expiredSubscriptions.results?.length || 0
}

export async function expireEndedSubscriptionCredits(
  db: D1Database,
  now = Math.floor(Date.now() / 1000)
) {
  const result = await db
    .prepare(
      `
      UPDATE user_credits
      SET
        subscription_balance = 0,
        subscription_period_start = NULL,
        subscription_period_end = NULL,
        balance = purchased_balance,
        updated_at = ?
      WHERE subscription_period_end IS NOT NULL
        AND subscription_period_end <= ?
        AND NOT EXISTS (
          SELECT 1
          FROM subscriptions
          WHERE subscriptions.user_id = user_credits.user_id
            AND (
              (subscriptions.status IN ('active', 'trialing') AND subscriptions.current_period_end > ?)
              OR (subscriptions.status = 'past_due' AND subscriptions.grace_period_ends_at > ?)
            )
        )
    `
    )
    .bind(now, now, now, now)
    .run()

  return result.meta.changes || 0
}

export async function grantDueAnnualSubscriptionCredits(
  db: D1Database,
  now = Math.floor(Date.now() / 1000)
) {
  const dueSubscriptions = await db
    .prepare(
      `
      SELECT
        user_id,
        plan,
        monthly_credit_amount,
        next_credit_grant_at,
        current_period_end
      FROM subscriptions
      WHERE status IN ('active', 'trialing')
        AND credit_grant_interval = 'year'
        AND monthly_credit_amount > 0
        AND next_credit_grant_at IS NOT NULL
        AND next_credit_grant_at <= ?
        AND current_period_end > ?
    `
    )
    .bind(now, now)
    .all<{
      user_id: string
      plan: string
      monthly_credit_amount: number
      next_credit_grant_at: number
      current_period_end: number
    }>()

  let granted = 0
  let skippedDuplicate = 0

  for (const subscription of dueSubscriptions.results || []) {
    let periodStart = subscription.next_credit_grant_at
    let nextMonth = addOneMonth(periodStart)

    while (nextMonth <= now && nextMonth < subscription.current_period_end) {
      periodStart = nextMonth
      nextMonth = addOneMonth(periodStart)
    }

    const periodEnd = Math.min(nextMonth, subscription.current_period_end)
    if (periodEnd <= periodStart) continue

    const planDisplayName = subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)

    try {
      await grantSubscriptionCredits(
        db,
        subscription.user_id,
        subscription.monthly_credit_amount,
        periodStart,
        periodEnd,
        `Annual Subscription Monthly Grant: ${planDisplayName}`
      )
      granted += 1
    } catch (error) {
      if (!isDuplicateCreditPeriodError(error)) {
        throw error
      }
      skippedDuplicate += 1
    }

    const nextCreditGrantAt = periodEnd >= subscription.current_period_end ? null : periodEnd

    await db
      .prepare(
        `
        UPDATE subscriptions
        SET
          last_credit_grant_at = ?,
          next_credit_grant_at = ?,
          updated_at = ?
        WHERE user_id = ?
      `
      )
      .bind(periodStart, nextCreditGrantAt, now, subscription.user_id)
      .run()
  }

  return {
    due: dueSubscriptions.results?.length || 0,
    granted,
    skippedDuplicate,
  }
}

export async function handleAnnualSubscriptionCreditGrants(db: D1Database) {
  const now = Math.floor(Date.now() / 1000)
  return grantDueAnnualSubscriptionCredits(db, now)
}

export async function handleCreditMaintenance(db: D1Database) {
  const now = Math.floor(Date.now() / 1000)
  const pastDueExpired = await expirePastDueSubscriptions(db, now)
  const subscriptionCreditsExpired = await expireEndedSubscriptionCredits(db, now)

  return {
    pastDueExpired,
    subscriptionCreditsExpired,
  }
}

export async function resetSubscriptionCredits(
  db: D1Database,
  userId: string,
  now = Math.floor(Date.now() / 1000)
) {
  await db
    .prepare(
      `
      UPDATE user_credits
      SET
        subscription_balance = 0,
        subscription_period_start = NULL,
        subscription_period_end = NULL,
        balance = purchased_balance,
        updated_at = ?
      WHERE user_id = ?
    `
    )
    .bind(now, userId)
    .run()
}

export async function handleRunCreditMaintenance(c: AuthenticatedContext) {
  const result = await handleCreditMaintenance(c.env.DB)
  return c.json(result)
}

export async function handleGetCredits(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const credits = await getUserCredits(c.env.DB, user.userId)
  return c.json({ credits })
}
