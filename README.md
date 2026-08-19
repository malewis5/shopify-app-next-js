# Shopify App for Next.js

[![npm version](https://img.shields.io/npm/v/shopify-app-nextjs)](https://www.npmjs.com/package/shopify-app-nextjs)
[![npm downloads](https://img.shields.io/npm/dm/shopify-app-nextjs?label=downloads)](https://www.npmjs.com/package/shopify-app-nextjs)

`shopify-app-nextjs` is a TypeScript package for building embedded Shopify apps with the Next.js App Router.

The goal is to provide the Shopify-specific server primitives that a Next.js application needs while preserving the conventions developers expect from Next.js: route handlers, React Server Components, server actions, middleware, and deployment to modern JavaScript runtimes.

## Why this project?

Shopify provides an official framework package for React Router. This project is exploring an equivalent integration designed specifically for Next.js rather than wrapping React Router concepts inside a Next.js application.

The package is intended to eventually handle concerns such as:

- Shopify app configuration
- OAuth installation and authentication flows
- Offline and online sessions
- Authenticated Admin API clients
- Webhook registration and processing
- App Bridge integration for embedded apps
- Billing helpers
- Next.js route-handler and server-component utilities
- Deployment-friendly session storage adapters

## Status

This project is under active development and is not ready for production use. The current implementation is only the package foundation; the Shopify integration APIs are still being designed and built.

## Planned usage

The intended developer experience will look similar to this:

```ts
import { shopifyApp } from "shopify-app-nextjs/server";

export const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  appUrl: process.env.SHOPIFY_APP_URL!,
  scopes: ["read_products"],
});
```

Next.js route handlers will then use the configured app for Shopify authentication and API access:

```ts
import { shopify } from "@/shopify.server";

export async function GET(request: Request) {
  const { admin } = await shopify.authenticate.admin(request);
  const response = await admin.graphql(`
    #graphql
    query Products {
      products(first: 10) {
        nodes {
          id
          title
        }
      }
    }
  `);

  return Response.json(await response.json());
}
```

These examples describe the planned API and are not implemented yet.

## Requirements

- Node.js 20.9 or newer
- Next.js 16
- React 19
- pnpm 10 for repository development

## Repository structure

```text
apps/web       Next.js application used to develop and test the integration
packages/core  Publishable shopify-app-nextjs package
```

## Development

Install dependencies:

```bash
pnpm install
```

Start the development workspace:

```bash
pnpm dev
```

Run the project checks:

```bash
pnpm format:check
pnpm lint
pnpm check-types
pnpm test
pnpm attw
pnpm build
```

## Package

The package is published to npm as [`shopify-app-nextjs`](https://www.npmjs.com/package/shopify-app-nextjs).

## License

MIT
