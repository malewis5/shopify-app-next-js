# shopify-app-nextjs

Build Shopify apps with the Next.js App Router.

This package is under active development and is not ready for production use.

## Requirements

- Node.js 22 or newer
- Next.js 16
- React 19

## Installation

```bash
pnpm add shopify-app-nextjs
```

## Setup

Render `ShopifyHead` near the beginning of the root layout's `<head>` and pass the Shopify API key explicitly. `ShopifyHead` is provided by `shopify-app-react` and re-exported here for convenience.

```tsx
import { AppProvider, ShopifyHead } from "shopify-app-nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ShopifyHead apiKey={process.env.SHOPIFY_API_KEY!} />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
```

The package does not read environment variables. The application is responsible for loading and validating its API key before passing it to `ShopifyHead`.

`ShopifyHead` adds the Shopify API key metadata and emits synchronous App Bridge and Polaris scripts in the required order. Do not render it in `<body>` or insert it after hydration.

Next.js can inject framework scripts into the generated document. Check the browser console and production HTML after framework upgrades to confirm App Bridge does not report an ordering warning.

## AppProvider

`AppProvider` is a Client Component that handles same-origin App Bridge navigation events with the Next.js App Router. It renders its children and does not load scripts or read configuration.
