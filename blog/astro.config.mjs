import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

export default {
  site: "https://tuziyo.com",
  base: "/blog",
  outDir: "../public/blog",
  trailingSlash: "always",
  integrations: [react(), sitemap()],
};
