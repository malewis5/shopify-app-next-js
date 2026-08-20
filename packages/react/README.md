# shopify-app-react

Framework-agnostic React utilities for building Shopify apps.

This package is under active development and is not ready for production use.

## Requirements

- Node.js 20.9 or newer
- React 19

## Installation

```bash
pnpm add shopify-app-react
```

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
