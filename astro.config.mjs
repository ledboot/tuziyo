import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://tuziyo.com",
  base: "/blog",
  srcDir: "./blog/src",
  publicDir: "./blog/public",
  outDir: "./public/blog",
  trailingSlash: "always",
  integrations: [react(), sitemap()],
});
