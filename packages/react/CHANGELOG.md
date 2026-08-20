# shopify-app-react

## 0.0.2

### Patch Changes

- 8f46e9d: Make Shopify navigation event handling compatible with older webviews, avoid duplicate parsing and listener registration, and respect events claimed by another handler.
- 1abd128: Add React utilities for embedded Shopify apps: `ShopifyHead` configures App Bridge and Polaris web components, while `AppProvider` and `useShopifyNavigation` delegate same-origin Shopify navigation events to an injected client-side navigation function.
