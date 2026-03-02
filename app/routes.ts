import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("inpainting", "routes/inpainting.tsx"),
  route("resize", "routes/resize.tsx"),
  route("crop", "routes/crop.tsx"),
  route("convert", "routes/convert.tsx"),

  // Auth Routes
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.ts"),
  route("auth/google", "routes/auth.google.ts"),
  route("auth/google/callback", "routes/auth.google.callback.ts"),

  // Nano Banana Routes
  route("nano-banana", "routes/nano-banana.tsx", [
    route(":sessionId", "routes/nano-banana.$sessionId.tsx"),
  ]),
  route("api/chat", "routes/api.chat.ts"),

  route("sitemap.xml", "routes/sitemap[.]xml.ts"),
  route("robots.txt", "routes/robots[.]txt.ts"),
] satisfies RouteConfig;
