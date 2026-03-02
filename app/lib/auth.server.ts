import { SignJWT, jwtVerify } from "jose";
import { type Cookie, createCookie } from "react-router";
import type { AppLoadContext } from "react-router";
import { getUserById, type User } from "./db";

// Use an environment variable for the secret in production
// For local testing, we fallback to a hardcoded string if not provided
const getJwtSecret = (context: AppLoadContext) => {
  const env = (context as any).cloudflare?.env;
  const secret = env?.JWT_SECRET || "fallback_secret_for_local_dev_only";
  return new TextEncoder().encode(secret);
};

export const authCookie: Cookie = createCookie("session", {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 1 week
});

export async function createSessionCookie(
  userId: string,
  context: AppLoadContext,
): Promise<string> {
  const secret = getJwtSecret(context);
  const jwt = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return await authCookie.serialize(jwt);
}

export async function getUserId(
  request: Request,
  context: AppLoadContext,
): Promise<string | null> {
  const cookieString = request.headers.get("Cookie");
  if (!cookieString) return null;

  const jwt = await authCookie.parse(cookieString);
  if (!jwt) return null;

  try {
    const secret = getJwtSecret(context);
    const { payload } = await jwtVerify(jwt, secret);
    return payload.userId as string;
  } catch (error) {
    return null;
  }
}

export async function getUser(
  request: Request,
  context: AppLoadContext,
): Promise<User | null> {
  const userId = await getUserId(request, context);
  if (!userId) return null;

  const env = (context as any).cloudflare?.env;
  const user = await getUserById(env.DB, userId);
  return user;
}

export async function requireUser(
  request: Request,
  context: AppLoadContext,
): Promise<User> {
  const user = await getUser(request, context);
  if (!user) {
    const url = new URL(request.url);
    throw new Response("Unauthorized", {
      status: 302,
      headers: {
        Location: `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`,
      },
    });
  }
  return user;
}

export async function destroySessionCookie(): Promise<string> {
  return await authCookie.serialize("", { maxAge: 0 });
}
