# shopify-app-nextjs

Next.js App Router integration for embedded Shopify apps.

This package is under active development and is not ready for production use.

## Requirements

- Node.js 22 or newer
- Next.js 16
- React 19

## Installation

```bash
pnpm add shopify-app-nextjs
```

`shopify-app-react` is installed as a dependency.

## Setup

Render `ShopifyHead` in the root layout's `<head>` and pass your Shopify API key explicitly. Then wrap the application body with `AppProvider`.

```tsx
import { AppProvider, ShopifyHead } from "shopify-app-nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.SHOPIFY_API_KEY;

  if (!apiKey) {
    throw new Error("SHOPIFY_API_KEY is required");
  }

  return (
    <html lang="en">
      <head>
        <ShopifyHead apiKey={apiKey} />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
```

This package does not read environment variables. Your application must load and validate its API key before passing it to `ShopifyHead`.

## ShopifyHead

`ShopifyHead` is provided by `shopify-app-react` and re-exported here for convenience. It renders:

1. The `shopify-api-key` metadata used to configure App Bridge.
2. The synchronous App Bridge script.
3. The synchronous Polaris web components script.

Keep it in the document `<head>`, before other scripts that need App Bridge. Do not render it in `<body>` or add it only after hydration.

Next.js can add framework scripts to the generated document. After upgrading Next.js, inspect the production HTML and browser console to confirm App Bridge does not report a script-ordering warning.

## AppProvider

`AppProvider` is a Client Component that renders its children and listens for `shopify:navigate` events. Same-origin destinations are cancelled and passed to `router.push`, preserving client-side App Router navigation. Empty, malformed, and cross-origin destinations are left to their default behavior.

`AppProvider` does not load scripts or read configuration; use `ShopifyHead` for that setup.
