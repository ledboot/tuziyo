import { Hono } from "hono"
import { cors } from "hono/cors"
import { authMiddleware, getUser } from "./middleware/auth"
import {
  handleDeleteImage,
  handleGenerate,
  handleGetTaskStatus,
  handleGetFavorites,
  getModels,
  handleSetImageFavorite,
  handleEvoLinkCallback,
  handleEvoLinkTaskCheck,
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
import {
  handleAnnualSubscriptionCreditGrants,
  handleCreditMaintenance,
  handleGetCredits,
} from "./routes/credits"
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
import { PLAN_MODELS_CONFIG } from "./imageModels"
import type { AppVariables, Env } from "./types"

export const app = new Hono<{ Bindings: Env }>()

const ANNUAL_SUBSCRIPTION_GRANT_CRON = "0 0 * * *"
const CREDIT_MAINTENANCE_CRON = "10 0 * * *"
const EVOLINK_TASK_CHECK_CRON = "* * * * *"

app.use(
  "*",
  cors({
    origin: origin => origin,
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Type", "Authorization", "Content-Length"],
    credentials: true,
  })
)

// public routes
app.post("/api/auth/google/callback", handleGoogleCallback)

app.get("/api/models", c => {
  return c.json({
    models: getModels(),
    plan_models_config: PLAN_MODELS_CONFIG,
  })
})

app.get("/api/ai-toolkit/showcase", async c => {
  const items = await getAiToolkitShowcase(c.env)
  return c.json({ items })
})

app.post("/api/stripe/webhook", handleStripeWebhook)
app.get("/api/stripe/products", handleGetProducts)
app.post("/api/evolink/callback", handleEvoLinkCallback)

// authenticated routes

const protectedRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>()
protectedRoutes.use("*", authMiddleware)

protectedRoutes.post("/api/auth/logout", handleLogout)
protectedRoutes.get("/api/auth/me", c => {
  const user = getUser(c)
  return c.json({ user })
})

protectedRoutes.post("/api/generate", handleGenerate)
protectedRoutes.get("/api/generate/task/:id", handleGetTaskStatus)
protectedRoutes.post("/api/evolink/tasks/check", async c => {
  try {
    const result = await handleEvoLinkTaskCheck(c.env)
    return c.json({ success: true, result })
  } catch (error) {
    console.error("Manual EvoLink task check failed:", error)
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "EvoLink task check failed",
      },
      500
    )
  }
})
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
protectedRoutes.post("/api/stripe/checkout", handleCreateCheckoutSession)
protectedRoutes.get("/api/stripe/subscription", handleGetSubscription)
protectedRoutes.post("/api/stripe/portal", handleCreateCustomerPortal)

app.route("/", protectedRoutes)

export default {
  fetch: app.fetch,
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    if (controller.cron === ANNUAL_SUBSCRIPTION_GRANT_CRON) {
      ctx.waitUntil(
        handleAnnualSubscriptionCreditGrants(env.DB).then(result => {
          console.log("annual subscription credit grants completed:", result)
        })
      )
      return
    }

    if (controller.cron === CREDIT_MAINTENANCE_CRON) {
      ctx.waitUntil(
        handleCreditMaintenance(env.DB).then(result => {
          console.log("credit maintenance completed:", result)
        })
      )
      return
    }

    if (controller.cron === EVOLINK_TASK_CHECK_CRON) {
      ctx.waitUntil(
        handleEvoLinkTaskCheck(env).then(result => {
          console.log("EvoLink task check completed:", result)
        })
      )
      return
    }

    console.warn(`Unhandled cron trigger: ${controller.cron}`)
  },
}
