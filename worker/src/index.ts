import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware, getUser } from "./middleware/auth";
import { handleGenerate, getModels } from "./routes/image";
import { handleGoogleCallback, handleLogout } from "./routes/auth";
import {
  handleGetProducts,
  handleCreateCheckoutSession,
  handleStripeWebhook,
  handleGetSubscription,
  handleCreateCustomerPortal,
} from "./routes/stripe";
import { handleGetCredits } from "./routes/credits";
import { handleGetTransactions } from "./routes/transactions";
import {
  handleGetSessions,
  handleCreateSession,
  handleGetSession,
  handleDeleteSession,
  handleUpdateSessionTitle,
  handleCreateMessage,
} from "./routes/sessions";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Type", "Authorization", "Content-Length"],
    credentials: true,
  }),
);

// public routes
app.post("/api/auth/google/callback", handleGoogleCallback);

app.get("/api/models", (c) => {
  return c.json({ models: getModels() });
});

// authenticated routes

const protectedRoutes = new Hono();
protectedRoutes.use("*", authMiddleware);

protectedRoutes.post("/api/auth/logout", handleLogout);
protectedRoutes.get("/api/auth/me", (c) => {
  const user = getUser(c);
  return c.json({ user });
});

protectedRoutes.post("/api/generate", handleGenerate);
protectedRoutes.get("/api/credits", handleGetCredits);
protectedRoutes.get("/api/transactions", handleGetTransactions);
protectedRoutes.get("/api/sessions", handleGetSessions);
protectedRoutes.post("/api/sessions", handleCreateSession);
protectedRoutes.get("/api/sessions/:id", handleGetSession);
protectedRoutes.delete("/api/sessions/:id", handleDeleteSession);
protectedRoutes.put("/api/sessions/:id", handleUpdateSessionTitle);
protectedRoutes.post("/api/sessions/:id/messages", handleCreateMessage);
protectedRoutes.get("/api/stripe/products", handleGetProducts);
protectedRoutes.post("/api/stripe/checkout", handleCreateCheckoutSession);
protectedRoutes.post("/api/stripe/webhook", handleStripeWebhook);
protectedRoutes.get("/api/stripe/subscription", handleGetSubscription);
protectedRoutes.post("/api/stripe/portal", handleCreateCustomerPortal);

app.route("/", protectedRoutes);

export default app;
