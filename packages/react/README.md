# shopify-app-react

Framework-agnostic React utilities for building Shopify apps.

This package is under active development and is not ready for production use.

## Requirements

- Node.js 22 or newer
- React 19

## Installation

```bash
pnpm add shopify-app-react
```

## App Bridge and Polaris

Render `ShopifyHead` near the beginning of your document `<head>`. Pass the Shopify API key explicitly so your framework or application controls how configuration is loaded.

```tsx
import { ShopifyHead } from "shopify-app-react";

export function DocumentHead() {
  return <ShopifyHead apiKey={loadShopifyApiKey()} />;
}
```

`ShopifyHead` adds the Shopify API key metadata and emits synchronous App Bridge and Polaris scripts in that order. Do not render it in the document body or insert it after hydration.

## useShopifyNavigation

Handle same-origin `shopify:navigate` events with your framework's client-side router.

```tsx
import { useShopifyNavigation } from "shopify-app-react";

function ShopifyNavigation() {
  const navigate = useYourRouter();

  useShopifyNavigation(navigate);

  return null;
}
```
