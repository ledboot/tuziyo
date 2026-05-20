import { v4 as uuidv4 } from "uuid";
import type { AuthenticatedContext } from "../types";
import { MODEL_CREDITS as CREDIT_MAP } from "../types";

export async function getUserCredits(
  db: D1Database,
  userId: string,
): Promise<{ balance: number; total_purchased: number; total_used: number }> {
  const result = await db
    .prepare(
      "SELECT balance, total_purchased, total_used FROM user_credits WHERE user_id = ?",
    )
    .bind(userId)
    .first<{ balance: number; total_purchased: number; total_used: number }>();

  if (!result) {
    return { balance: 0, total_purchased: 0, total_used: 0 };
  }
  return result;
}

export async function addCredits(
  db: D1Database,
  userId: string,
  amount: number,
  type: string,
  description: string,
  model?: string,
  creditsPerImage?: number,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const id = uuidv4();

  await db
    .prepare(
      `
      INSERT INTO user_credits (id, user_id, balance, total_purchased, total_used, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        balance = balance + excluded.balance,
        total_purchased = total_purchased + excluded.total_purchased,
        total_used = total_used + excluded.total_used,
        updated_at = excluded.updated_at
    `,
    )
    .bind(
      id,
      userId,
      amount,
      type === "subscription" || type === "purchase" ? amount : 0,
      type === "generation" ? amount : 0,
      now,
    )
    .run();

  await db
    .prepare(
      `
      INSERT INTO credit_transactions (id, user_id, amount, type, description, model, credits_per_image, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .bind(
      uuidv4(),
      userId,
      amount,
      type,
      description,
      model || null,
      creditsPerImage || null,
      now,
    )
    .run();
}

export async function deductCredits(
  db: D1Database,
  userId: string,
  amount: number,
  model: string,
): Promise<{ success: boolean; error?: string }> {
  const creditsPerImage = CREDIT_MAP[model];
  if (!creditsPerImage) {
    return { success: false, error: `Unknown model: ${model}` };
  }

  const userCredits = await getUserCredits(db, userId);
  if (userCredits.balance < creditsPerImage) {
    return { success: false, error: "Insufficient credits" };
  }

  await addCredits(
    db,
    userId,
    -creditsPerImage,
    "generation",
    `Image generation with ${model}`,
    model,
    creditsPerImage,
  );
  return { success: true };
}

export async function handleGetCredits(c: AuthenticatedContext) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const credits = await getUserCredits(c.env.DB, user.userId);
  return c.json({ credits });
}
