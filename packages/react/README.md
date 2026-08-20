# shopify-app-react

Framework-agnostic React utilities for embedded Shopify apps.

This package is under active development and is not ready for production use.

## Requirements

- Node.js 22 or newer
- React 19

## Installation

```bash
pnpm add shopify-app-react
```

## ShopifyHead

Render `ShopifyHead` in your document `<head>` and pass the Shopify API key explicitly so your framework or application controls how configuration is loaded.

```tsx
import { ShopifyHead } from "shopify-app-react";

export function DocumentHead({ apiKey }: { apiKey: string }) {
  return <ShopifyHead apiKey={apiKey} />;
}
```

`ShopifyHead` renders the following elements in order:

1. `<meta name="shopify-api-key">` with the provided API key.
2. The synchronous App Bridge script from Shopify's CDN.
3. The synchronous Polaris web components script from Shopify's CDN.

Keep it in the document `<head>`, before other scripts that need App Bridge. Do not render it in the document body or add it only after hydration.

The package does not read environment variables. Your application must load and validate the API key before passing it to `ShopifyHead`.

## AppProvider

`AppProvider` renders your application and connects Shopify navigation events to the client router you provide. Pass the router's navigation function rather than the router object so the component remains framework-agnostic.

```tsx
"use client";

import { AppProvider } from "shopify-app-react";

export function Providers({ children }: { children: React.ReactNode }) {
  const navigate = useYourRouter();

  return <AppProvider navigate={navigate}>{children}</AppProvider>;
}
```

For a same-origin destination, the provider prevents the event's default navigation and calls `navigate` with its pathname, search parameters, and hash. Empty, malformed, and cross-origin destinations are ignored so their default behavior remains available.

The provider must run on the client in frameworks that distinguish server and client components.

## useShopifyNavigation

`useShopifyNavigation` exposes the navigation behavior used by `AppProvider` when a component-level API is more appropriate.

```tsx
import { useShopifyNavigation } from "shopify-app-react";

function ShopifyNavigation() {
  const navigate = useYourRouter();

  useShopifyNavigation(navigate);

  return null;
}
```
