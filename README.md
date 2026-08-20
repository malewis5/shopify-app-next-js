# shopify-app-nextjs

[![npm version](https://img.shields.io/npm/v/shopify-app-nextjs)](https://www.npmjs.com/package/shopify-app-nextjs)
[![npm downloads](https://img.shields.io/npm/dm/shopify-app-nextjs?label=downloads)](https://www.npmjs.com/package/shopify-app-nextjs)

Utilities for building embedded Shopify apps with React and the Next.js App Router.

This project is under active development and is not ready for production use.

## Packages

- [`shopify-app-nextjs`](./packages/next/README.md) integrates Shopify navigation with the Next.js App Router and re-exports the shared head component.
- [`shopify-app-react`](./packages/react/README.md) provides framework-agnostic React utilities for loading App Bridge and Polaris and handling Shopify navigation events.

## Requirements

- Node.js 22 or newer
- Next.js 16
- React 19

## Installation

```bash
pnpm add shopify-app-nextjs
```

Installing `shopify-app-nextjs` also installs `shopify-app-react` as a dependency. Install `shopify-app-react` directly only when using its framework-agnostic APIs without the Next.js integration.

## Next.js setup

Add `ShopifyHead` to the root layout's `<head>` and wrap the application body with `AppProvider`:

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

`ShopifyHead` emits the Shopify API key metadata followed by synchronous App Bridge and Polaris scripts. `AppProvider` is a Client Component that sends same-origin `shopify:navigate` events through the Next.js App Router.

See the package READMEs for API details and framework-agnostic usage.

## Contributing

Contributions are welcome. Please feel free to submit a pull request.

## License

MIT
