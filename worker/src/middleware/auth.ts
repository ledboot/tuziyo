import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import type { UserPayload, Env } from "../types";

export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: { user: UserPayload | null };
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = await verify(token, c.env.JWT_SECRET, "HS256") as unknown as UserPayload;

      const user = await c.env.DB
        .prepare("SELECT id FROM users WHERE id = ?")
        .bind(payload.userId)
        .first();

      if (user) {
        c.set("user", payload);
        await next();
        return;
      }
    } catch (err) {
      console.error("JWT verify error:", err);
    }
  }

  return c.json({ error: "Unauthorized" }, 401);
});

export function getUser(c: {
  get: (key: "user") => UserPayload | null;
}): UserPayload | null {
  return c.get("user");
}
