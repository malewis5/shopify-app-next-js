# shopify-apps

## What this codebase does

- A Turborepo containing `shopify-app-react`, framework-agnostic React utilities for Shopify App Bridge and Polaris.
- `shopify-app-nextjs` adapts those utilities to the Next.js App Router and re-exports the shared head component.
- The example Next.js app demonstrates `ShopifyHead`, `AppProvider`, and Polaris web components.
- The packages are client-side integration libraries; no OAuth callback, webhook receiver, database, queue, or Admin API client is present in the inspected source.

## Auth shape

- `ShopifyHead` publishes the Shopify API key (public client ID) in `shopify-api-key` metadata; it must not receive an Admin API access token or other secret.
- `AppProvider` and `useShopifyNavigation` run in the browser and do not establish an authenticated server session.
- Host applications remain responsible for Shopify OAuth, session validation, authorization, and server-side API credentials.

## Threat model

- `shopify:navigate` is a document-level browser event whose target may be influenced by rendered page content.
- The navigation hook must preserve same-origin enforcement before passing destinations to a client router.
- App Bridge and Polaris are loaded as executable scripts from Shopify's CDN, making script URL integrity and ordering security-relevant.
- Consumers could accidentally pass secret credential material as `ShopifyHead.apiKey`, exposing it in document metadata.

## Project-specific patterns to flag

- Changes that remove `URL.canParse` or the `url.origin === window.location.origin` boundary in `useShopifyNavigation`.
- Passing an unnormalized external URL to the callback used by `AppProvider`.
- Making the App Bridge or Polaris script URLs caller-controlled or loading them from non-Shopify origins.
- Treating `ShopifyHead.apiKey` as a private token rather than Shopify's public client ID.

## Known false-positives

- The Shopify API key rendered by `ShopifyHead` is intentionally public and is not an Admin API access token.
- `https://cdn.shopify.com/shopifycloud/app-bridge.js` and `polaris.js` are intentional third-party script dependencies.
- Cross-origin `shopify:navigate` events are intentionally left to default browser navigation rather than intercepted.
