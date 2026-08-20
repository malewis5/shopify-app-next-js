# shopify-app-nextjs

Build Shopify apps with the Next.js App Router.

This package is under active development and is not ready for production use.

## Requirements

- Node.js 20.9 or newer
- Next.js 16
- React 19

## Installation

```bash
pnpm add shopify-app-nextjs
```

## App Bridge and Polaris

Render `ShopifyHead` at the beginning of the `<head>` in your root layout. It adds the Shopify API key metadata and loads App Bridge and Polaris in the required order.

Shopify requires App Bridge to load synchronously before other blocking scripts. Keeping `ShopifyHead` in the root layout's `<head>` gives the application control over this document-level placement.

```tsx
import { AppProvider, ShopifyHead } from "shopify-app-nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ShopifyHead />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
```

`ShopifyHead` uses `process.env.SHOPIFY_API_KEY` by default. You can override it with `<ShopifyHead apiKey="..." />`.

Do not render `ShopifyHead` in `<body>` or inside `AppProvider`. It intentionally emits blocking classic scripts without `async`, `defer`, or `type="module"` because App Bridge rejects those loading modes.

Next.js can inject framework scripts into the generated document. Check the browser console and production HTML after framework upgrades to confirm App Bridge does not report an ordering warning.

## AppProvider

`AppProvider` handles App Bridge navigation events with the Next.js App Router. Render `ShopifyHead` separately in the document head as shown above.
