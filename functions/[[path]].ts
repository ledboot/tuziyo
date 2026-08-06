import { createPagesFunctionHandler } from "@react-router/cloudflare"

// @ts-ignore - implementation details, the build file will be generated at build time
import * as build from "../build/server/index.js"
import { getCanonicalRedirect } from "./canonicalRedirect"

const reactRouterHandler = createPagesFunctionHandler({
  build,
  getLoadContext: context => ({ cloudflare: context }),
})

export const onRequest: PagesFunction<Env> = context =>
  getCanonicalRedirect(context.request) ?? reactRouterHandler(context)
