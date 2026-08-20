---
"shopify-app-nextjs": patch
"shopify-app-react": patch
---

Add React utilities for embedded Shopify apps: `ShopifyHead` configures App Bridge and Polaris web components, while `useShopifyNavigation` delegates same-origin Shopify navigation events to a client-side router.

Add a Next.js `AppProvider` that connects Shopify navigation to the App Router, and re-export `ShopifyHead` from `shopify-app-nextjs` for convenient root-layout setup.
