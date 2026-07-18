import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/_index.tsx"),
  route("ai/models", "routes/ai.models._index.tsx"),
  route("ai/models/:model", "routes/ai.models.$model.tsx"),
  route("ai-toolkit", "routes/ai-toolkit.tsx"),
  route("session/:id", "routes/session.$id.tsx"),
  route("library", "routes/library.tsx"),
  route("studio", "routes/studio.tsx"),
  route("studio/:id", "routes/studio.$id.tsx"),
  route("inpainting", "routes/inpainting.tsx"),
  route("resize", "routes/resize.tsx"),
  route("crop", "routes/crop.tsx"),
  route("convert", "routes/convert.tsx"),
  route("pricing", "routes/pricing.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("profile", "routes/profile.tsx"),
  route("login", "routes/login.tsx"),
  route("auth/callback", "routes/auth/callback.tsx"),

  route("sitemap.xml", "routes/sitemap[.]xml.ts"),
  route("robots.txt", "routes/robots[.]txt.ts"),
] satisfies RouteConfig
