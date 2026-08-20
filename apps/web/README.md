# Example Shopify app

This Next.js application demonstrates the local `shopify-app-react` package with App Bridge, Polaris web components, and App Router navigation.

## Prerequisites

- Node.js 22 or newer
- pnpm
- Shopify CLI
- Access to a Shopify app and development store

Install the workspace dependencies from the repository root:

```bash
pnpm install
```

## Shopify configuration

Shopify CLI configuration files are intentionally ignored because they contain app-specific values. From this directory, link or create a configuration before starting development:

```bash
cd apps/web
shopify app config link
```

The linked configuration supplies the application client ID used as `SHOPIFY_API_KEY` by `src/app/(embedded)/layout.tsx`.

## Development

Run the example through Shopify CLI so it can manage the development URL and embedded app preview:

```bash
pnpm dev
```

To run Next.js without the Shopify CLI tunnel, use:

```bash
pnpm exec next dev
```

The standalone Next.js command still requires `SHOPIFY_API_KEY` in the environment to configure App Bridge.

## Relevant files

- `src/app/(embedded)/layout.tsx` is the root layout for the embedded `/app` route. It owns its own `<html>`/`<head>`, preconnects to Shopify's CDN, and renders `ShopifyHead` in the document head.
- `src/app/(embedded)/providers.tsx` is a Client Component that passes the Next.js router's `push` function to `AppProvider`.
- `src/app/(embedded)/app/page.tsx` demonstrates Polaris web components.
- `src/app/(marketing)/layout.tsx` is the root layout for the non-embedded landing route and does not load App Bridge.
- `src/app/(marketing)/page.tsx` is the non-embedded landing route.
- `next.config.ts` allows Shopify CLI's Cloudflare development origin.
