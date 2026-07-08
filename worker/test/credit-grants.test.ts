import { Database } from "bun:sqlite"
import { afterEach, describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  addCredits,
  addOneMonth,
  deductCredits,
  expireEndedSubscriptionCredits,
  expirePastDueSubscriptions,
  grantDueAnnualSubscriptionCredits,
  grantSubscriptionCredits,
  getUserCredits,
} from "../src/routes/credits"

class FakeD1PreparedStatement {
  private values: unknown[] = []

  constructor(
    private readonly db: Database,
    private readonly sql: string
  ) {}

  bind(...values: unknown[]) {
    this.values = values
    return this
  }

  async run() {
    const result = this.db.query(this.sql).run(...this.values)
    return { success: true, meta: { changes: result.changes ?? 0 } }
  }

  async first<T>() {
    return (this.db.query(this.sql).get(...this.values) ?? null) as T | null
  }

  async all<T>() {
    return { results: this.db.query(this.sql).all(...this.values) as T[] }
  }
}

class FakeD1Database {
  constructor(private readonly db: Database) {}

  prepare(sql: string) {
    return new FakeD1PreparedStatement(this.db, sql)
  }

  async batch(statements: FakeD1PreparedStatement[]) {
    this.db.run("BEGIN")
    try {
      const results = []
      for (const statement of statements) {
        results.push(await statement.run())
      }
      this.db.run("COMMIT")
      return results
    } catch (error) {
      this.db.run("ROLLBACK")
      throw error
    }
  }
}

const now = 1782973642
const day = 86400
const databases: Database[] = []

function setup() {
  const sqlite = new Database(":memory:")
  databases.push(sqlite)
  sqlite.run("PRAGMA foreign_keys = ON")
  sqlite.exec(readFileSync(join(import.meta.dir, "../../db/schema.sql"), "utf8"))

  return {
    sqlite,
    d1: new FakeD1Database(sqlite) as unknown as D1Database,
  }
}

function insertUser(db: Database, id: string, userType = "starter") {
  db.query("INSERT INTO users (id, email, name, user_type) VALUES (?, ?, ?, ?)").run(
    id,
    `${id}@example.com`,
    id,
    userType
  )
}

function insertSubscription(
  db: Database,
  opts: {
    id: string
    userId: string
    interval: "month" | "year"
    amount: number
    status?: string
    currentStart: number
    currentEnd: number
    lastGrant?: number | null
    nextGrant?: number | null
  }
) {
  db.query(
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
        next_credit_grant_at
      )
      VALUES (?, ?, ?, ?, ?, 'creator', ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    opts.id,
    opts.userId,
    opts.id,
    `cus_${opts.id}`,
    `price_${opts.id}`,
    opts.status ?? "active",
    opts.currentStart,
    opts.currentEnd,
    opts.interval,
    opts.amount,
    opts.lastGrant ?? null,
    opts.nextGrant ?? null
  )
}

function scalar<T>(db: Database, sql: string, ...params: unknown[]): T {
  const row = db.query(sql).get(...params) as Record<string, T>
  return Object.values(row)[0]
}

afterEach(() => {
  for (const db of databases.splice(0)) {
    db.close()
  }
})

describe("credit grants", () => {
  test("monthly subscription renewal grants subscription credits for the whole billing period", async () => {
    const { sqlite, d1 } = setup()
    insertUser(sqlite, "monthly_renewal", "professional")
    insertSubscription(sqlite, {
      id: "sub_monthly_renewal",
      userId: "monthly_renewal",
      interval: "month",
      amount: 500,
      currentStart: now,
      currentEnd: now + 30 * day,
      lastGrant: now,
      nextGrant: null,
    })

    await grantSubscriptionCredits(
      d1,
      "monthly_renewal",
      500,
      now,
      now + 30 * day,
      "Monthly renewal",
      "in_month_1"
    )

    const credits = await getUserCredits(d1, "monthly_renewal")
    expect(credits.balance).toBe(500)
    expect(credits.subscription_balance).toBe(500)
    expect(credits.purchased_balance).toBe(0)
    expect(
      scalar<number>(sqlite, "SELECT COUNT(*) FROM credit_transactions WHERE user_id = ?", "monthly_renewal")
    ).toBe(1)
  })

  test("annual subscription invoice grants only the first monthly credit period", async () => {
    const { sqlite, d1 } = setup()
    const periodEnd = addOneMonth(now)
    insertUser(sqlite, "annual_first_month", "creator")
    insertSubscription(sqlite, {
      id: "sub_annual_first",
      userId: "annual_first_month",
      interval: "year",
      amount: 1200,
      currentStart: now,
      currentEnd: now + 365 * day,
      lastGrant: now,
      nextGrant: periodEnd,
    })

    await grantSubscriptionCredits(
      d1,
      "annual_first_month",
      1200,
      now,
      periodEnd,
      "Annual first month",
      "in_year_1"
    )

    const credits = await getUserCredits(d1, "annual_first_month")
    expect(credits.balance).toBe(1200)
    expect(credits.subscription_period_start).toBe(now)
    expect(credits.subscription_period_end).toBe(periodEnd)
  })

  test("annual grant cron grants due monthly credits and advances the next grant", async () => {
    const { sqlite, d1 } = setup()
    const due = now - day
    insertUser(sqlite, "annual_due", "creator")
    insertSubscription(sqlite, {
      id: "sub_annual_due",
      userId: "annual_due",
      interval: "year",
      amount: 900,
      currentStart: now - 40 * day,
      currentEnd: now + 300 * day,
      lastGrant: now - 40 * day,
      nextGrant: due,
    })

    const result = await grantDueAnnualSubscriptionCredits(d1, now)
    const credits = await getUserCredits(d1, "annual_due")

    expect(result).toEqual({ due: 1, granted: 1, skippedDuplicate: 0 })
    expect(credits.subscription_balance).toBe(900)
    expect(
      scalar<number>(sqlite, "SELECT next_credit_grant_at FROM subscriptions WHERE user_id = ?", "annual_due")
    ).toBe(addOneMonth(due))
  })

  test("annual grant cron skips subscriptions that are not due yet", async () => {
    const { sqlite, d1 } = setup()
    insertUser(sqlite, "annual_not_due", "creator")
    insertSubscription(sqlite, {
      id: "sub_annual_not_due",
      userId: "annual_not_due",
      interval: "year",
      amount: 900,
      currentStart: now - 40 * day,
      currentEnd: now + 300 * day,
      lastGrant: now - 40 * day,
      nextGrant: now + day,
    })

    const result = await grantDueAnnualSubscriptionCredits(d1, now)

    expect(result.due).toBe(0)
    expect(scalar<number>(sqlite, "SELECT COUNT(*) FROM credit_transactions")).toBe(0)
  })

  test("annual grant cron skips duplicate credit periods without writing another transaction", async () => {
    const { sqlite, d1 } = setup()
    const start = now - 7 * day
    const end = addOneMonth(start)
    insertUser(sqlite, "annual_duplicate", "creator")
    insertSubscription(sqlite, {
      id: "sub_annual_duplicate",
      userId: "annual_duplicate",
      interval: "year",
      amount: 700,
      currentStart: now - 40 * day,
      currentEnd: now + 300 * day,
      lastGrant: now - 40 * day,
      nextGrant: start,
    })
    sqlite
      .query(
        `
          INSERT INTO credit_transactions (
            id,
            user_id,
            amount,
            type,
            description,
            credit_period_start,
            credit_period_end
          )
          VALUES ('existing', 'annual_duplicate', 700, 'subscription', 'existing', ?, ?)
        `
      )
      .run(start, end)

    const result = await grantDueAnnualSubscriptionCredits(d1, now)

    expect(result.skippedDuplicate).toBe(1)
    expect(
      scalar<number>(sqlite, "SELECT COUNT(*) FROM credit_transactions WHERE user_id = ?", "annual_duplicate")
    ).toBe(1)
  })

  test("annual grant cron ignores monthly subscriptions", async () => {
    const { sqlite, d1 } = setup()
    insertUser(sqlite, "monthly_not_cron", "professional")
    insertSubscription(sqlite, {
      id: "sub_monthly_not_cron",
      userId: "monthly_not_cron",
      interval: "month",
      amount: 500,
      currentStart: now - 40 * day,
      currentEnd: now + 300 * day,
      lastGrant: now - 40 * day,
      nextGrant: now - day,
    })

    const result = await grantDueAnnualSubscriptionCredits(d1, now)

    expect(result.due).toBe(0)
    expect(scalar<number>(sqlite, "SELECT COUNT(*) FROM credit_transactions")).toBe(0)
  })

  test("credit consumption uses subscription credits before purchased credits", async () => {
    const { sqlite, d1 } = setup()
    insertUser(sqlite, "paid_and_deduct", "creator")
    await addCredits(d1, "paid_and_deduct", 200, "purchase", "Purchased credits")
    await grantSubscriptionCredits(d1, "paid_and_deduct", 5, now, now + 30 * day, "Subscription grant")

    const result = await deductCredits(d1, "paid_and_deduct", 0, "openai/gpt-image-1.5")
    const credits = await getUserCredits(d1, "paid_and_deduct")

    expect(result.success).toBe(true)
    expect(credits.subscription_balance).toBe(0)
    expect(credits.purchased_balance).toBe(200)
    expect(credits.balance).toBe(200)
    expect(scalar<number>(sqlite, "SELECT COUNT(*) FROM credit_transactions WHERE type = 'generation'")).toBe(1)
  })

  test("zero credit operations do not write balance or transaction records", async () => {
    const { sqlite, d1 } = setup()
    insertUser(sqlite, "zero_guard", "starter")

    await addCredits(d1, "zero_guard", 0, "purchase", "Zero purchase")
    await grantSubscriptionCredits(d1, "zero_guard", 0, now, now + 30 * day, "Zero grant")

    expect(scalar<number>(sqlite, "SELECT COUNT(*) FROM user_credits")).toBe(0)
    expect(scalar<number>(sqlite, "SELECT COUNT(*) FROM credit_transactions")).toBe(0)
    expect(() =>
      sqlite
        .query("INSERT INTO credit_transactions (id, user_id, amount, type) VALUES ('bad_zero', 'zero_guard', 0, 'purchase')")
        .run()
    ).toThrow()
  })

  test("past due grace expiry clears subscription credits and keeps purchased credits", async () => {
    const { sqlite, d1 } = setup()
    insertUser(sqlite, "past_due_expired", "creator")
    await addCredits(d1, "past_due_expired", 30, "purchase", "Purchased credits")
    await grantSubscriptionCredits(
      d1,
      "past_due_expired",
      1000,
      now - 40 * day,
      now - 10 * day,
      "Subscription grant"
    )
    insertSubscription(sqlite, {
      id: "sub_past_due_expired",
      userId: "past_due_expired",
      interval: "year",
      amount: 1000,
      status: "past_due",
      currentStart: now - 400 * day,
      currentEnd: now + 10 * day,
      lastGrant: now - 40 * day,
      nextGrant: now - day,
    })
    sqlite.query("UPDATE subscriptions SET grace_period_ends_at = ? WHERE user_id = ?").run(
      now - day,
      "past_due_expired"
    )

    const expired = await expirePastDueSubscriptions(d1, now)
    const credits = await getUserCredits(d1, "past_due_expired")

    expect(expired).toBe(1)
    expect(credits.balance).toBe(30)
    expect(credits.subscription_balance).toBe(0)
    expect(scalar<string>(sqlite, "SELECT status FROM subscriptions WHERE user_id = ?", "past_due_expired")).toBe(
      "canceled"
    )
    expect(scalar<string>(sqlite, "SELECT user_type FROM users WHERE id = ?", "past_due_expired")).toBe("free")
  })

  test("ended subscription maintenance clears only expired subscription credits", async () => {
    const { sqlite, d1 } = setup()
    insertUser(sqlite, "ended_subscription", "professional")
    await addCredits(d1, "ended_subscription", 45, "purchase", "Purchased credits")
    await grantSubscriptionCredits(
      d1,
      "ended_subscription",
      500,
      now - 40 * day,
      now - day,
      "Subscription grant"
    )

    const expired = await expireEndedSubscriptionCredits(d1, now)
    const credits = await getUserCredits(d1, "ended_subscription")

    expect(expired).toBe(1)
    expect(credits.balance).toBe(45)
    expect(credits.subscription_balance).toBe(0)
    expect(credits.purchased_balance).toBe(45)
  })
})
