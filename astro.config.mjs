import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://tuziyo.com",
  srcDir: "./blog/src",
  publicDir: "./blog/public",
  outDir: "./build/blog",
  trailingSlash: "always",
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
