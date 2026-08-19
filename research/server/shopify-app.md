# `shopifyApp()` port analysis for Next.js

This analysis focuses on the installed `@shopify/shopify-app-react-router` version `1.2.1` in `/Users/mattlewis/Desktop/boilerplate-test-app` and, specifically, the factory rooted at:

```text
src/server/shopify-app.ts
```

The question is not merely whether the TypeScript compiles under Next.js. It is whether each piece preserves its behavior under Next.js App Router request handling, redirects, rendering, and deployment.

## Decision summary

Do not copy the package wholesale.

A Next.js version should:

1. Use `@shopify/shopify-api` and its Web API adapter directly.
2. Keep the public `shopifyApp(config)` facade if API compatibility is valuable.
3. Copy/adapt the small framework-neutral composition factories.
4. Port the Admin authentication coordinator and all redirect-producing helpers.
5. Copy most webhook, Flow, fulfillment, extension-token, session, billing, and scope logic after removing React Router response assumptions.
6. Omit React Router boundaries entirely.
7. Run Shopify server modules in the Next.js Node runtime, not Edge.

The largest risk is `authenticate.admin()`. The rest of the server surface is substantially more portable.

## Terminology used below

### Reuse

Call an existing lower-level Shopify package instead of copying its implementation.

### Copy

The implementation is framework-neutral enough to bring into a Next.js package with only imports, naming, package-version, and tests changed.

This still requires respecting Shopify's MIT license and retaining applicable copyright/license notices.

### Copy with adaptation

The algorithm is portable, but response construction, package branding, route paths, or Next.js runtime details need small changes.

### Port/redesign

The behavior must be preserved, but the implementation is coupled to React Router conventions and should not be copied literally.

### Defer/omit

Do not implement until the application needs the feature, or omit because Next.js has a different mechanism.

## What `shopifyApp()` actually does

The factory is a dependency-injection and composition root. Its direct work is small:

```ts
const api = deriveApi(appConfig);
const config = deriveConfig(appConfig, api.config);
const logger = overrideLogger(api.logger);

api.webhooks.addHandlers(appConfig.webhooks);

const strategy =
  distribution === ShopifyAdmin
    ? createMerchantCustomAuthStrategy(params)
    : createTokenExchangeStrategy(params);

return {
  sessionStorage,
  addDocumentResponseHeaders,
  registerWebhooks,
  authenticate: {
    admin,
    flow,
    fulfillmentService,
    pos,
    public,
    webhook,
  },
  unauthenticated: {
    admin,
    storefront,
  },
  login,
};
```

The value of the package is in the factories assembled behind that object, not in the object literal itself.

## Top-level factory classification

| Source                                | Decision                | Reason                                                                                                                                                                                            |
| ------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/shopify-app.ts: shopifyApp`   | Copy with adaptation    | Framework-neutral composition root; change branding, config defaults, and the factories it wires.                                                                                                 |
| `server/shopify-app.ts: deriveApi`    | Copy with adaptation    | URL normalization and `shopifyApi()` setup are portable; change user-agent branding and review forced future flags against the installed `@shopify/shopify-api` version.                          |
| `server/shopify-app.ts: deriveConfig` | Copy with adaptation    | Session-storage validation and defaults are portable; auth path defaults must map to actual Next.js routes.                                                                                       |
| `server/types.ts`                     | Copy with adaptation    | Useful compatibility surface, but redirect/response contracts should reflect Next.js integration decisions.                                                                                       |
| `server/config-types.ts`              | Copy with adaptation    | Most configuration is framework-neutral; React Router route commentary and internal auth paths need updating.                                                                                     |
| `server/types-contexts.ts`            | Copy                    | Type aliases are portable if the returned facade stays compatible.                                                                                                                                |
| `server/override-logger.ts`           | Reimplement or simplify | The wrapper is portable but brands logs as `shopify-app`, compares against the React Router package version, and depends on `compare-versions`. A smaller Next.js-specific wrapper is preferable. |
| `server/future/flags.ts`              | Do not blindly copy     | Future flags are version-sensitive. Define only flags that a Next.js facade actually supports.                                                                                                    |

## `deriveApi`: what can be retained

The current implementation:

- Validates `appUrl` with `new URL()`.
- Adds `process.env.PORT` for localhost without an explicit port.
- Normalizes `appUrl` to its origin.
- Derives `hostName` and `hostScheme`.
- Calls `shopifyApi()`.
- Forces `isEmbeddedApp: true`.
- Maps `AppDistribution.ShopifyAdmin` to `isCustomStoreApp`.
- Adds a package-specific user-agent prefix.
- Forwards billing configuration.

These behaviors can be retained.

Required changes:

```ts
import "@shopify/shopify-api/adapters/web-api";
```

Use the Web API adapter because Next.js App Router exposes standard `Request`, `Response`, and `Headers` objects.

Change:

```text
Shopify React Router Library v...
```

to a Next.js package identifier.

Do not copy this forced configuration without checking the current lower-level API:

```ts
future: {
  unstable_managedPricingSupport: true,
}
```

Future flags are tied to package versions and can become removed, renamed, or defaulted.

Do not mutate a `Readonly<Config>` input as the current implementation effectively does with:

```ts
appConfig.appUrl = appUrl.origin;
appConfig.distribution = appConfig.distribution ?? AppDistribution.AppStore;
```

A Next.js implementation should derive a new normalized object instead.

## `deriveConfig`: what can be retained

Portable behavior:

- Require session storage for App Store and single-merchant apps.
- Allow it to be absent for a Shopify Admin-managed app.
- Default distribution to `AppStore`.
- Default `useOnlineTokens` to `false`.
- Default lifecycle hooks and future flags to empty objects.
- Keep an idempotency guard for `afterAuth`.

The internal route expansion can also be retained if matching Next.js handlers are created:

```text
/auth
/auth/callback
/auth/session-token
/auth/exit-iframe
/auth/login
```

However, these are conventions rather than a complete implementation. Next.js requires actual route handlers/pages at the chosen paths.

Recommended Next.js mapping:

```text
app/auth/route.ts
app/auth/callback/route.ts
app/auth/session-token/route.ts
app/auth/exit-iframe/route.ts
app/auth/login/page.tsx
```

The exact set depends on whether token exchange fully replaces authorization-code OAuth for the targeted distribution.

## Runtime adapter decision

Use:

```ts
import "@shopify/shopify-api/adapters/web-api";
```

Do not rely on:

```ts
import "@shopify/shopify-app-react-router/adapters/node";
```

That React Router adapter only changes the runtime label and optionally overrides the App Bridge URL. It does not adapt requests.

Also avoid `@shopify/shopify-api/adapters/node` for App Router route handlers. That adapter expects raw Node `IncomingMessage` and `ServerResponse` objects. Next.js App Router gives Web API requests and responses.

Shopify routes using Prisma should declare:

```ts
export const runtime = "nodejs";
```

The Web API adapter describes the request shape; it does not imply that the code should run in Next.js Edge runtime.

## Authentication surface

## `authenticate.admin()` — port/redesign

Source root:

```text
server/authenticate/admin/authenticate.ts
```

This is the most important code to port rather than copy.

### Portable algorithm

The high-level state machine should remain:

1. Reject bots where appropriate.
2. Handle CORS preflight.
3. Handle App Bridge bounce and exit-iframe endpoints.
4. For document requests, validate `shop` and `host`.
5. Ensure the app is embedded when required.
6. Ensure a session token is available.
7. Decode and validate the session token.
8. Derive the online or offline session ID.
9. Load a stored session.
10. Ask the configured authorization strategy to authenticate or refresh it.
11. Return Admin, session, billing, scope, CORS, redirect, and token contexts.

### Why literal copying is unsafe

The implementation uses React Router's control flow:

```ts
throw new Response(...)
throw redirect(...)
```

React Router catches these responses in loaders/actions. Its `boundary` helpers preserve response headers through route error boundaries.

Next.js does not provide the same general thrown-`Response` contract for route handlers and Server Components. A thrown Web `Response` can be treated as an unhandled error rather than a redirect or route response.

### Recommended Next.js contract

Keep a compatibility API, but make response outcomes explicit internally:

```ts
type AuthenticationResult<T> = { ok: true; context: T } | { ok: false; response: Response };
```

Then expose one of two public styles:

```ts
// Explicit and safest
const result = await shopify.authenticate.admin(request);
if (!result.ok) return result.response;
const { admin, session } = result.context;
```

or a route-handler wrapper:

```ts
return shopify.withAdmin(request, async ({ admin, session }) => {
  return Response.json(...);
});
```

Trying to preserve the exact React Router method signature while relying on thrown responses creates framework ambiguity.

### Context construction

The context assembly in `createContext()` is framework-neutral and can be copied after its dependencies are ported:

- Admin GraphQL client
- Session
- Billing methods
- Scope methods
- CORS helper
- Embedded session-token payload
- Embedded redirect helper

## Token-exchange strategy — copy with adaptation

Source:

```text
server/authenticate/admin/strategies/token-exchange.ts
```

Portable behavior:

- Use `api.auth.tokenExchange()`.
- Request an offline token when no valid stored session exists.
- Optionally request and store an online token.
- Store sessions through the injected session adapter.
- Run `afterAuth` once for a session-token event.
- Invalidate a stored session after an Admin API 401.
- Retry authentication after an invalid session/access token.

Required adaptations:

- Replace thrown `Response` outcomes with the Next.js response contract.
- Remove the stray debug `console.log` currently present in `exchangeToken()`.
- Reassess the in-memory idempotency guard for serverless/multi-instance deployment.
- Add tests for concurrent token exchange and refresh.

### Important serverless caveat

`IdempotentPromiseHandler` uses a process-local `Map` with a 60-second TTL. This only deduplicates within one warm process. It does not deduplicate across Vercel functions, regions, containers, or cold starts.

It can be copied as a best-effort optimization, but it is not distributed idempotency. Hooks that must run exactly once need durable database idempotency.

## Merchant custom-app strategy — copy

Source:

```text
server/authenticate/admin/strategies/merchant-custom-app.ts
```

This is mostly framework-neutral:

- Create a custom-app session from configured credentials.
- Convert an Admin API 401 into a useful credential-revocation error.

Only response/error conventions and package-specific logging need adjustment.

## Session helpers — copy with adaptation

Relevant sources:

```text
server/helpers/create-or-load-offline-session.ts
server/helpers/ensure-valid-offline-session.ts
server/helpers/ensure-offline-token-is-not-expired.ts
server/helpers/refresh-token.ts
server/authenticate/helpers/invalidate-access-token.ts
```

These are framework-neutral business logic built on:

- `@shopify/shopify-api` session IDs and refresh APIs.
- The injected `SessionStorage` interface.
- Shopify sessions.

They can largely be copied.

Review before copying:

- Future-flag names and refresh API signatures against the chosen `@shopify/shopify-api` version.
- Error handling that throws `Response`.
- Race conditions when multiple serverless requests refresh the same token.

A database transaction or distributed lock may be needed for robust refresh behavior.

## Request helpers

| Helper                                | Decision             | Notes                                                                                                |
| ------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| `get-session-token-header.ts`         | Copy                 | Standard `Request` header parsing.                                                                   |
| `get-shop-from-request.ts`            | Copy                 | Standard URL/header parsing; retain Shopify sanitization.                                            |
| `validate-session-token.ts`           | Copy with adaptation | Core JWT verification is reusable; replace thrown response flow.                                     |
| `ensure-cors-headers.ts`              | Copy with adaptation | Standard Headers logic; ensure it supports both `Response` and Next.js response usage.               |
| `respond-to-options-request.ts`       | Port                 | It currently terminates through a thrown `Response`; Next.js route handlers should return it.        |
| `respond-to-invalid-session-token.ts` | Port                 | Produces retry/bounce behavior through React Router response semantics.                              |
| `reject-bot-request.ts`               | Copy with adaptation | Bot detection is portable, but the rejection response must be returned through the Next.js contract. |
| `add-response-headers.ts`             | Copy with adaptation | Header values are portable; integration location and CSP application need Next.js-specific handling. |
| `app-bridge-url.ts`                   | Copy or simplify     | A small global URL override; consider explicit config instead of mutable module state.               |

## Embedded redirect and bounce helpers — port/redesign

Relevant sources:

```text
server/authenticate/admin/helpers/redirect.ts
server/authenticate/admin/helpers/render-app-bridge.ts
server/authenticate/admin/helpers/ensure-app-is-embedded-if-required.ts
server/authenticate/admin/helpers/ensure-session-token-search-param-if-required.ts
server/authenticate/admin/helpers/redirect-to-bounce-page.ts
server/authenticate/admin/helpers/redirect-to-install-page.ts
server/authenticate/admin/helpers/redirect-to-shopify-or-app-root.ts
server/authenticate/admin/helpers/redirect-with-app-bridge-headers.ts
server/authenticate/admin/helpers/validate-redirect-url.ts
server/authenticate/admin/helpers/validate-shop-and-host-params.ts
```

Preserve these behaviors:

- Detect document, data, bounce, and embedded requests.
- Copy embedded query parameters only to same-origin destinations.
- Sanitize redirect destinations.
- Convert `shopify://admin/...` URLs to Admin URLs.
- Use App Bridge for parent/top/blank navigation.
- Escape the iframe for install and external destinations.
- Render an App Bridge bootstrap page when required.
- Reject malformed `shop` and `host` parameters.

Do not copy:

```ts
import { redirect } from "react-router";
throw redirect(...);
```

Next.js choices differ by execution context:

- Route handler: return `Response.redirect(...)` or `NextResponse.redirect(...)`.
- Server Component/action: Next.js `redirect()` throws a private framework control-flow error.
- Client Component: use `useRouter()` or App Bridge navigation.

The Shopify facade should produce ordinary `Response` objects at its core and add thin Next.js wrappers for Server Components or actions if needed.

## Document response headers — copy values, port integration

Source:

```text
server/authenticate/helpers/add-response-headers.ts
```

Portable output:

- App Bridge/Polaris CDN preconnect and preload `Link` headers.
- Embedded `Content-Security-Policy` with a sanitized shop in `frame-ancestors`.
- `frame-ancestors 'none'` for non-embedded apps.

Do not set a global static CSP containing a request-specific shop. The shop must be sanitized and derived per request.

Possible Next.js integration points:

- A route-handler response helper.
- Middleware for document requests, if all required runtime APIs are Edge-compatible.
- A reverse proxy/platform header layer only if it can safely derive the shop.

Because authentication and Prisma should stay in Node runtime, a response helper is the simplest initial design.

## Admin and Storefront clients — copy wrapper or use lower-level clients directly

Sources:

```text
server/clients/admin/factory.ts
server/clients/admin/graphql.ts
server/clients/storefront/factory.ts
```

The wrappers:

- Construct lower-level Shopify clients from a session.
- Normalize retry options.
- Convert the lower-level result into a Web `Response` containing JSON.
- Intercept Admin 401 errors to invalidate sessions.

They are framework-neutral and can be copied.

However, the source itself notes that the Admin wrapper is mostly a call-through that belongs at the library layer. Two reasonable choices are:

### Compatibility choice

Copy the wrappers so callers retain:

```ts
const response = await admin.graphql(query, options);
const json = await response.json();
```

### Native-client choice

Expose the lower-level client result directly and avoid JSON stringify plus `Response` wrapping.

For a compatibility-oriented package, copy the wrappers. For one internal Next.js app, using the lower-level client directly is simpler.

## Webhook authentication — copy with adaptation

Source:

```text
server/authenticate/webhooks/authenticate.ts
```

This is highly portable because Next.js route handlers expose the unmodified body through:

```ts
const rawBody = await request.text();
```

Portable behavior:

- Require POST.
- Read the body once as text.
- Call `api.webhooks.validate({ rawBody, rawRequest: request })`.
- Return 401 for invalid HMAC and 400 for other validation failures.
- Parse traditional and events webhook metadata.
- Load an offline session when available.
- Attach an Admin client when a session exists.
- Return a valid context without a session after uninstall.

Adapt only the error response mechanism: return a response result instead of throwing it.

Do not call `request.json()` before validation. HMAC verification needs the exact raw body.

## Webhook registration — copy

Source:

```text
server/authenticate/webhooks/register.ts
```

This is a small wrapper around:

```ts
api.webhooks.register({ session });
```

It adds logging and special handling for throttling. It has no React Router dependency and can be copied.

Prefer app-specific webhook subscriptions in `shopify.app.toml` where possible. Implement this wrapper only for shop-specific subscriptions.

## Flow authentication — copy with adaptation

Source:

```text
server/authenticate/flow/authenticate.ts
```

The implementation uses standard Web APIs and lower-level Shopify validation:

- Require POST.
- Read raw body.
- Call `api.flow.validate()`.
- Parse payload.
- Load/refresh offline session.
- Create Admin client.

Only thrown response handling needs to change.

## Fulfillment-service authentication — copy with adaptation

Source:

```text
server/authenticate/fulfillment-service/authenticate.ts
```

The same reasoning as Flow applies. It uses:

- Standard `Request` methods and headers.
- `api.fulfillmentService.validate()`.
- Offline session loading.
- Admin client creation.

Only response control flow needs porting.

## POS, checkout, and customer-account extension authentication — copy with adaptation

Sources:

```text
server/authenticate/pos/authenticate.ts
server/authenticate/public/checkout/authenticate.ts
server/authenticate/public/customer-account/authenticate.ts
server/authenticate/public/extension/authenticate.ts
```

All three surfaces share the same framework-neutral implementation:

- Handle OPTIONS.
- Read bearer session token.
- Validate JWT, with audience behavior appropriate to extensions.
- Return the decoded token and CORS helper.

Copy the shared extension authenticator and thin factories. Port preflight/error termination to explicit Next.js responses.

## App proxy authentication — split the implementation

Source:

```text
server/authenticate/public/appProxy/authenticate.ts
```

### Copy

- Read `shop` from URL parameters.
- Validate the app-proxy HMAC with `api.utils.validateHmac()`.
- Load a valid offline session.
- Attach Admin and Storefront clients when present.
- Return an `application/liquid` response helper.

### Remove or redesign

The implementation retries HMAC validation with React Router `_data` query parameters. That is a workaround for React Router data routing and should not be copied into Next.js.

The Liquid body processor forcibly adds trailing slashes to relative form actions and links because of the React Router app-proxy routing constraint. Next.js rewrites and `trailingSlash` behavior should be tested before retaining that mutation.

Recommended approach:

1. Validate the original Shopify app-proxy query exactly.
2. Use Next.js rewrites for the public proxy path.
3. Preserve query parameters without adding framework-internal parameters.
4. Add URL rewriting only if an integration test proves it is needed.

## Unauthenticated contexts — copy

Sources:

```text
server/unauthenticated/admin/factory.ts
server/unauthenticated/storefront/factory.ts
```

These factories are framework-neutral:

- Validate/load an offline session for a trusted shop.
- Throw `SessionNotFoundError` when missing.
- Return Admin or Storefront client context.

They can be copied almost verbatim.

The security warning remains important: the caller must authenticate and authorize the external request before accepting a shop string.

## Billing — mostly copy, port redirects

Sources:

```text
server/authenticate/admin/billing/*
```

### Copy

- `check`
- `cancel`
- `createUsageRecord`
- Most option and response types
- Most `require` logic

These call lower-level `api.billing` methods with a session.

### Port

- `request`
- `updateUsageCappedAmount`
- `redirectOutOfApp`
- 401 reauthentication behavior

These produce or throw redirects through React Router helpers. Preserve their billing behavior but return Next.js-compatible response outcomes.

## Scope management — mostly copy, port consent redirect

Sources:

```text
server/authenticate/admin/scope/*
```

### Copy

- Scope query GraphQL operation and result mapping.
- Scope revocation GraphQL operation and result mapping.
- `scopesApiFactory` composition.

### Port

- Optional-scope request/consent flow because it redirects the top-level merchant window.
- Any thrown `Response` error paths.

## Login — port

Source:

```text
server/authenticate/login/login.ts
```

Portable algorithm:

- Accept shop from GET query or POST form data.
- Normalize protocol and `.myshopify.com` suffix.
- Sanitize the shop.
- Return missing/invalid validation errors.
- Choose install or auth URL based on distribution.

React Router-specific implementation:

```ts
import { redirect } from "react-router";
throw redirect(redirectUrl);
```

A Next.js version should return a redirect `Response` from its route handler or expose the validated destination to a page/action wrapper.

## Lifecycle hook — copy with a stronger idempotency warning

Source:

```text
server/authenticate/admin/helpers/trigger-after-auth-hook.ts
```

The hook contract is useful and portable:

```ts
afterAuth({ session, admin });
```

Copy it, but document that the hook can run more than once. Installation setup and webhook registration should be idempotent at the database/API level.

## React Router boundaries — omit

Sources:

```text
server/boundary/*
```

Do not port `boundary.error()` or `boundary.headers()`.

They exist to preserve headers from React Router loader/action responses and error boundaries. Next.js has different error, redirect, and response propagation.

Replace them with:

- Route-handler response helpers.
- A documented wrapper that always returns the authentication response outcome.
- Next.js-specific page/action helpers only if those execution contexts are supported.

## Recommended public API for the first Next.js version

Preserve the familiar facade but make response outcomes explicit:

```ts
const shopify = shopifyApp(config);

shopify.sessionStorage;
shopify.registerWebhooks({ session });
shopify.addDocumentResponseHeaders(request, headers);

await shopify.authenticate.admin(request);
await shopify.authenticate.webhook(request);
await shopify.authenticate.public.appProxy(request);

await shopify.unauthenticated.admin(shop);
await shopify.unauthenticated.storefront(shop);
```

Recommended result model:

```ts
type Result<T> = { ok: true; context: T } | { ok: false; response: Response };
```

This makes it possible to use the same core from any Next.js route handler without depending on undocumented thrown-response behavior.

## Suggested implementation phases

### Phase 1: embedded Admin app essentials

- `shopifyApp` composition root
- `deriveApi` and normalized config
- Prisma session storage
- `authenticate.admin`
- Token exchange and offline-token refresh
- Admin GraphQL client
- Embedded redirect/bounce responses
- Dynamic document CSP
- Webhook authentication
- Unauthenticated Admin context

### Phase 2: production lifecycle

- `afterAuth` hook with durable idempotent application logic
- Shop-specific webhook registration, if needed
- Scope query/request/revoke
- Billing
- Explicit multi-instance token-refresh tests

### Phase 3: optional Shopify surfaces

- Checkout extensions
- Customer-account extensions
- POS extensions
- App proxies and Liquid
- Flow
- Fulfillment services
- Storefront context
- Login form

## File-level decision matrix

| Area                             | Copy                     | Copy with adaptation    | Port/redesign                | Omit/defer                    |
| -------------------------------- | ------------------------ | ----------------------- | ---------------------------- | ----------------------------- |
| `shopify-app.ts` composition     |                          | Yes                     |                              |                               |
| API/config derivation            |                          | Yes                     |                              |                               |
| Type/context declarations        | Yes                      | Some redirect types     |                              |                               |
| Token exchange                   |                          | Yes                     | Response/retry flow          |                               |
| Merchant custom auth             | Yes                      | Logging/errors          |                              |                               |
| Admin authentication coordinator |                          | Context assembly        | Yes                          |                               |
| Session load/refresh             |                          | Yes                     | Concurrency hardening        |                               |
| Admin/Storefront client wrappers | Yes                      | Package versions        |                              | Could use lower-level clients |
| Webhook validation               |                          | Error responses         |                              |                               |
| Webhook registration             | Yes                      |                         |                              | If TOML subscriptions suffice |
| Flow validation                  |                          | Error responses         |                              | If unused                     |
| Fulfillment validation           |                          | Error responses         |                              | If unused                     |
| Extension JWT auth               |                          | CORS/error responses    |                              | If unused                     |
| App proxy                        | HMAC/session/Liquid core |                         | Remove RR `_data` workaround | If unused                     |
| Billing                          | Operations               | 401 handling            | Redirects                    | If unused                     |
| Scopes                           | Query/revoke             |                         | Consent redirect             | If unused                     |
| Unauthenticated contexts         | Yes                      |                         |                              |                               |
| Login                            | Validation algorithm     |                         | Redirect integration         | If no login page              |
| Document headers                 | Header values            |                         | Next response integration    |                               |
| Redirect/bounce/App Bridge pages |                          | Sanitization algorithms | Yes                          |                               |
| React Router boundaries          |                          |                         |                              | Yes                           |
| React Router node adapter        |                          |                         |                              | Yes                           |
| Test config helper               | Yes                      | Rename/package versions |                              | Optional                      |

## Copying and maintenance risks

Even framework-neutral files are implementation details of another package, not a stable public API. Copying them creates a fork that must track:

- Shopify authentication changes.
- API version changes.
- Token-exchange and refresh changes.
- New webhook metadata.
- App Bridge redirect changes.
- Security fixes to HMAC, shop sanitization, CSP, and redirect validation.
- Session schema changes.

Prefer direct lower-level calls where practical. If code is copied:

1. Record the upstream package version and source commit.
2. Preserve the MIT license notices.
3. Keep source paths in comments or a manifest.
4. Add integration tests for authentication, redirects, webhooks, and token refresh.
5. Periodically diff against upstream `shopify-app-js`.

## Final recommendation

A Next.js `shopifyApp` facade is feasible without rewriting every Shopify operation.

The top-level factory, validators, session helpers, API clients, webhooks, Flow, fulfillment, extension authentication, unauthenticated contexts, and much of billing/scopes can be copied or composed from lower-level packages.

The code that genuinely needs a Next.js port is concentrated in:

- Admin authentication orchestration.
- All thrown `Response` handling.
- Redirect and iframe escape behavior.
- Bounce/session-token bootstrap pages.
- Billing and optional-scope redirects.
- Per-request document header integration.
- App-proxy routing workarounds.

Therefore, the best architecture is a framework-neutral Shopify core that returns explicit contexts or `Response` outcomes, plus thin Next.js route-handler and rendering integrations. It should not be a line-for-line fork of the React Router package.
