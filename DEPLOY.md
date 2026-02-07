# Deploying Tuziyo to Cloudflare Pages

This project is a monorepo-style application combining a React Router v7 SSR app and an Astro static blog.

## Prerequisites

- Cloudflare account
- GitHub repository connected to Cloudflare

## Deployment Steps (Cloudflare Dashboard)

1.  **Log in to Cloudflare Dashboard** and navigate to **Workers & Pages**.
2.  Click **Create application** -> **Pages** -> **Connect to Git**.
3.  Select your repository (`tuziyo`).
4.  **Configure Build settings**:
    *   **Framework preset**: `None`
    *   **Build command**: `bun run build:all`
        *   This command builds both the blog (to `public/blog`) and the main app (to `build/`).
    *   **Build output directory**: `build/client`
        *   Cloudflare Pages serves static assets from here.
        *   The SSR server code (Functions) will be automatically detected in the `functions/` directory.
5.  **Environment Variables**:
    *   Add variable: `NODE_VERSION` with value `20` (or `22`).
    *   Add variable: `BUN_VERSION` with value `latest` (to enable Bun support).
    *   Add other variables if needed (e.g., `MAIN_ORIGIN`).
6.  Click **Save and Deploy**.

## Manual Deployment (CLI)

If you prefer to deploy from your local machine:

1.  Install dependencies:
    ```bash
    bun install
    ```
2.  Build the project:
    ```bash
    bun run build:all
    ```
3.  Deploy using Wrangler:
    ```bash
    npx wrangler pages deploy ./build/client --project-name tuziyo
    ```
    *   Wrangler will automatically detect the `functions` directory in the root and upload it alongside the static assets.

## Project Structure Notes

-   **`functions/[[path]].ts`**: This is the Cloudflare Pages Function entry point. It handles SSR requests by importing the server build.
-   **`wrangler.toml`**: Configures the Pages project settings.
