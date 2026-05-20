import { Hono } from "hono"
import { cors } from "hono/cors"
import { authMiddleware, getUser } from "./middleware/auth"
import {
  handleDeleteImage,
  handleGenerate,
  handleGetFavorites,
  getModels,
  handleSetImageFavorite,
} from "./routes/image"
import { getAiToolkitShowcase } from "./routes/showcase"
import { handleGoogleCallback, handleLogout } from "./routes/auth"
import {
  handleGetProducts,
  handleCreateCheckoutSession,
  handleStripeWebhook,
  handleGetSubscription,
  handleCreateCustomerPortal,
} from "./routes/stripe"
import { handleGetCredits } from "./routes/credits"
import { handleGetTransactions } from "./routes/transactions"
import {
  handleGetSessions,
  handleCreateSession,
  handleGetSession,
  handleDeleteSession,
  handleUpdateSession,
  handleCreateMessage,
} from "./routes/sessions"
import { handleCreateReferenceImageUpload } from "./routes/uploads"
import type { AppVariables, Env } from "./types"

const app = new Hono<{ Bindings: Env }>()

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Type", "Authorization", "Content-Length"],
    credentials: true,
  })
)

// public routes
app.post("/api/auth/google/callback", handleGoogleCallback)

app.get("/api/models", c => {
  return c.json({ models: getModels() })
})

app.get("/api/ai-toolkit/showcase", c => {
  return c.json({ items: getAiToolkitShowcase() })
})

app.post("/api/stripe/webhook", handleStripeWebhook)

// authenticated routes

const protectedRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>()
protectedRoutes.use("*", authMiddleware)

protectedRoutes.post("/api/auth/logout", handleLogout)
protectedRoutes.get("/api/auth/me", c => {
  const user = getUser(c)
  return c.json({ user })
})

protectedRoutes.post("/api/generate", handleGenerate)
protectedRoutes.post("/api/uploads/reference-image/presign", handleCreateReferenceImageUpload)
protectedRoutes.get("/api/credits", handleGetCredits)
protectedRoutes.get("/api/transactions", handleGetTransactions)
protectedRoutes.get("/api/favorites", handleGetFavorites)
protectedRoutes.patch("/api/images/:id/favorite", handleSetImageFavorite)
protectedRoutes.delete("/api/images/:id", handleDeleteImage)
protectedRoutes.get("/api/sessions", handleGetSessions)
protectedRoutes.post("/api/sessions", handleCreateSession)
protectedRoutes.get("/api/sessions/:id", handleGetSession)
protectedRoutes.delete("/api/sessions/:id", handleDeleteSession)
protectedRoutes.patch("/api/sessions/:id", handleUpdateSession)
protectedRoutes.post("/api/sessions/:id/messages", handleCreateMessage)
protectedRoutes.get("/api/stripe/products", handleGetProducts)
protectedRoutes.post("/api/stripe/checkout", handleCreateCheckoutSession)
protectedRoutes.get("/api/stripe/subscription", handleGetSubscription)
protectedRoutes.post("/api/stripe/portal", handleCreateCustomerPortal)

app.route("/", protectedRoutes)

export default app
