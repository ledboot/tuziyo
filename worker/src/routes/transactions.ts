import type { AuthenticatedContext } from "../types"

export async function handleGetTransactions(c: AuthenticatedContext) {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const limit = parseInt(c.req.query("limit") || "20", 10)
  const offset = parseInt(c.req.query("offset") || "0", 10)

  const transactions = await c.env.DB.prepare(
    `
      SELECT id, amount, type, description, model, credits_per_image, invoice_id, credit_period_start, credit_period_end, created_at
      FROM credit_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
  )
    .bind(user.userId, limit, offset)
    .all()

  const total = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM credit_transactions WHERE user_id = ?"
  )
    .bind(user.userId)
    .first<{ count: number }>()

  return c.json({
    transactions: transactions.results,
    total: total?.count || 0,
    limit,
    offset,
  })
}
