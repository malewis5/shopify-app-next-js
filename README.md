# shopify-app-react

[![npm version](https://img.shields.io/npm/v/shopify-app-react)](https://www.npmjs.com/package/shopify-app-react)
[![npm downloads](https://img.shields.io/npm/dm/shopify-app-react?label=downloads)](https://www.npmjs.com/package/shopify-app-react)

Framework-agnostic React utilities for building embedded Shopify apps.

This project is under active development and is not ready for production use.

## Package

[`shopify-app-react`](./packages/react/README.md) provides utilities for loading App Bridge and Polaris and handling Shopify navigation events with any client-side router.

## Requirements

- Node.js 22 or newer
- React 19

## Installation

```bash
pnpm add shopify-app-react
```

## Next.js setup

Render `ShopifyHead` in the root layout's `<head>`. Create a Client Component that passes the Next.js router's `push` function to `AppProvider`.

```tsx filename="app/providers.tsx"
"use client";

import { useRouter } from "next/navigation";
import { AppProvider } from "shopify-app-react";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return <AppProvider navigate={router.push}>{children}</AppProvider>;
}
```

```tsx filename="app/layout.tsx"
import { ShopifyHead } from "shopify-app-react";

import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.SHOPIFY_API_KEY;

  if (!apiKey) {
    throw new Error("SHOPIFY_API_KEY is required");
  }

  return (
    <html lang="en">
      <head>
        <ShopifyHead apiKey=[redacted] />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

`ShopifyHead` emits the Shopify API key metadata followed by synchronous App Bridge and Polaris scripts. `AppProvider` sends same-origin `shopify:navigate` events through the client-side navigation function you provide.

See the [package README](./packages/react/README.md) for API details and framework-agnostic usage.

## Contributing

Contributions are welcome. Please feel free to submit a pull request.

## License

MIT
