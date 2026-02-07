import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://tuziyo.com",
  srcDir: "./blog/src",
  publicDir: "./blog/public",
  outDir: "./public",
  trailingSlash: "always",
  integrations: [react(), sitemap()],
});
