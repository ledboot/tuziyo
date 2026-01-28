import { createPagesFunctionHandler } from "@react-router/cloudflare";

// @ts-ignore - implementation details, the build file will be generated at build time
import * as build from "../build/server/index.js";

export const onRequest = createPagesFunctionHandler({
  build,
  getLoadContext: (context) => ({ cloudflare: context }),
});
