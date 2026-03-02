import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { v4 as uuidv4 } from "uuid";
import { upsertUser } from "../lib/db";
import { createSessionCookie } from "../lib/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const env = (context as any).cloudflare?.env;

  if (!code) {
    return redirect("/login?error=missing_code");
  }

  const clientId = env?.GOOGLE_CLIENT_ID;
  const clientSecret = env?.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${url.origin}/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth credentials in environment.");
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed", await tokenResponse.text());
      return redirect("/login?error=token_exchange_failed");
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string };

    // 2. Fetch user profile information using the access token
    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
    );

    if (!profileResponse.ok) {
      console.error("Profile fetch failed", await profileResponse.text());
      return redirect("/login?error=profile_fetch_failed");
    }

    const profileData = (await profileResponse.json()) as {
      id: string;
      email: string;
      name: string;
      picture: string;
    };

    const env = (context as any).cloudflare?.env;
    const db = env?.DB;
    if (!db) {
      throw new Error("D1 Database not bound to environment");
    }
    const user = await upsertUser(db, {
      id: uuidv4(),
      google_id: profileData.id,
      email: profileData.email,
      name: profileData.name,
      avatar_url: profileData.picture,
    });

    // 4. Create local session (JWT Cookie)
    const cookieHeader = await createSessionCookie(user.id, context);

    // 5. Redirect to main app
    return redirect("/nano-banana", {
      headers: {
        "Set-Cookie": cookieHeader,
      },
    });
  } catch (error) {
    console.error("OAuth callback error", error);
    return redirect("/login?error=internal_server_error");
  }
}
