# `@shopify/shopify-app-react-router` public API

This inventory is based on the installed package in `/Users/mattlewis/Desktop/boilerplate-test-app`:

- Package: `@shopify/shopify-app-react-router`
- Installed version: `1.2.1`
- Node requirement: `>=20`
- React peer requirement: `>=18`
- React Router peer requirement: `^7.6.2`
- Source repository: `Shopify/shopify-app-js`, under `packages/apps/shopify-app-react-router`

The package is more than a React Router binding. It is a framework-level facade over `@shopify/shopify-api`, session storage, Admin and Storefront GraphQL clients, authentication strategies, billing, scopes, webhooks, redirects, CORS, and a few React components.

## Public entry points

The package export map exposes:

```ts
@shopify/shopify-app-react-router/server
@shopify/shopify-app-react-router/react
@shopify/shopify-app-react-router/adapters/*
@shopify/shopify-app-react-router/server/adapters/*
@shopify/shopify-app-react-router/test-helpers
```

The installed package only contains a Node adapter implementation under `adapters/node`.

## Server module

Import from:

```ts
import { shopifyApp, ApiVersion, AppDistribution } from "@shopify/shopify-app-react-router/server";
```

### Runtime exports

The server module directly exports or re-exports:

- `shopifyApp`
- `boundary`
- `SessionNotFoundError`
- `AppDistribution`
- `LoginErrorType`
- `LogSeverity` from `@shopify/shopify-api`
- `DeliveryMethod` from `@shopify/shopify-api`
- `BillingInterval` from `@shopify/shopify-api`
- `BillingReplacementBehavior` from `@shopify/shopify-api`
- `ApiVersion` from `@shopify/shopify-api`
- `Session` from `@shopify/shopify-api`

### Type exports

The server module exports:

- `ShopifyApp`
- `LoginError`
- `JwtPayload`
- `AdminContext`
- `WebhookContext`
- `AppProxyContext`
- `FlowContext`
- `FulfillmentServiceContext`
- `POSContext`
- `CheckoutContext`
- `CustomerAccountContext`
- `ScopesContext`
- `ScopesDetail`
- `AdminApiContext`
- `StorefrontApiContext`
- `AdminGraphqlClient`
- `StorefrontGraphqlClient`
- `UnauthenticatedAdminContext`
- `UnauthenticatedStorefrontContext`

## `shopifyApp(config)`

The primary factory accepts app configuration and returns a typed Shopify application facade.

```ts
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  apiVersion: ApiVersion.July26,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL!,
  sessionStorage,
  distribution: AppDistribution.AppStore,
});
```

### React Router-specific configuration

In addition to applicable `@shopify/shopify-api` configuration, the facade adds:

```ts
type AppConfig = {
  appUrl: string;
  apiVersion: ApiVersion;
  sessionStorage?: SessionStorage;
  billing?: BillingConfig;
  useOnlineTokens?: boolean; // defaults to false
  webhooks?: WebhookConfig;
  hooks?: {
    afterAuth?: ({ session, admin }) => void | Promise<void>;
  };
  distribution?: AppDistribution; // defaults to AppStore
  authPathPrefix?: string; // defaults to "/auth"
  future?: FutureFlags;
};
```

A session store is mandatory for `AppStore` and `SingleMerchant` distribution. It is optional for `ShopifyAdmin` distribution.

The configured auth prefix expands internally to:

```text
/auth
/auth/callback
/auth/session-token
/auth/exit-iframe
/auth/login
```

### Distribution modes

```ts
enum AppDistribution {
  AppStore = "app_store",
  SingleMerchant = "single_merchant",
  ShopifyAdmin = "shopify_admin",
}
```

Distribution changes both runtime behavior and the returned TypeScript type:

- `AppStore`: embedded token-exchange strategy, session storage required, `login` available.
- `SingleMerchant`: embedded token-exchange strategy, session storage required, `login` available.
- `ShopifyAdmin`: merchant custom-app strategy, session storage optional, no `login` member.

### Returned facade

Conceptually, `shopifyApp` returns:

```ts
type ShopifyAppFacade = {
  sessionStorage?: SessionStorage;
  addDocumentResponseHeaders(request: Request, headers: Headers): void;
  registerWebhooks(options: { session: Session }): Promise<RegisterReturn | void>;
  login?: (request: Request) => Promise<LoginError | never>;

  authenticate: {
    admin(request: Request): Promise<AdminContext>;
    flow(request: Request): Promise<FlowContext>;
    fulfillmentService(request: Request): Promise<FulfillmentServiceContext>;
    pos(request: Request, options?: CorsOptions): Promise<POSContext>;
    public: {
      checkout(request: Request, options?: CorsOptions): Promise<CheckoutContext>;
      customerAccount(request: Request, options?: CorsOptions): Promise<CustomerAccountContext>;
      appProxy(request: Request): Promise<AppProxyContext>;
    };
    webhook(request: Request): Promise<WebhookContext>;
  };

  unauthenticated: {
    admin(shop: string): Promise<UnauthenticatedAdminContext>;
    storefront(shop: string): Promise<UnauthenticatedStorefrontContext>;
  };
};
```

## Authentication API

### `authenticate.admin(request)`

Authenticates a Shopify Admin request. If authentication cannot be completed from the request and stored session, the implementation can initiate or redirect through the appropriate auth flow.

For an embedded app, it resolves to:

```ts
type AdminContext = {
  session: Session;
  admin: {
    graphql: AdminGraphqlClient;
  };
  sessionToken: JwtPayload;
  billing: BillingContext;
  scopes: ScopesApiContext;
  cors(responseOrData): Response;
  redirect(url: string, options?): Response;
};
```

For `AppDistribution.ShopifyAdmin`, the context omits embedded-only `sessionToken` and `redirect` members.

Important behavior hidden by this method includes:

- Validating the embedded session token.
- Deriving the shop and session identity.
- Running token exchange when necessary.
- Persisting online and offline sessions.
- Refreshing expiring offline access tokens when configured.
- Creating an authenticated Admin GraphQL client.
- Producing safe embedded-app redirects.
- Attaching CORS, billing, and scope helpers.

### Admin client

The public Admin API context is intentionally small:

```ts
type AdminApiContext = {
  graphql: AdminGraphqlClient;
};
```

The facade exposes GraphQL, not an app-level REST client.

### `authenticate.webhook(request)`

Validates a webhook and parses its metadata and payload:

```ts
type WebhookContext = {
  apiVersion: string;
  shop: string;
  topic: string;
  webhookId: string;
  payload: Record<string, unknown>;
  webhookType: "webhooks" | "events";
  subTopic?: string;
  name?: string;
  handle?: string;
  action?: string;
  resourceId?: string;
  triggeredAt?: string;
  eventId?: string;
} & ({ session: Session; admin: AdminApiContext } | { session: undefined; admin: undefined });
```

A valid webhook can lack a session because Shopify may deliver it after an uninstall. The webhook ID is exposed as an idempotency key.

### `authenticate.flow(request)`

Validates a Shopify Flow extension POST request and returns:

```ts
{
  session: Session;
  admin: AdminApiContext;
  payload: unknown;
}
```

### `authenticate.fulfillmentService(request)`

Validates fulfillment-service callbacks and returns:

```ts
{
  session: Session;
  admin: AdminApiContext;
  payload: Record<string, unknown> & { kind: string };
}
```

### `authenticate.pos(request, options?)`

Validates a POS UI extension session token:

```ts
{
  sessionToken: JwtPayload;
  cors(responseOrData): Response;
}
```

It accepts optional additional CORS response headers:

```ts
{ corsHeaders?: string[] }
```

### `authenticate.public.checkout(request, options?)`

Validates a checkout extension session token and returns:

```ts
{
  sessionToken: JwtPayload;
  cors(responseOrData): Response;
}
```

### `authenticate.public.customerAccount(request, options?)`

Validates a customer-account extension session token and returns the same basic contract as checkout authentication:

```ts
{
  sessionToken: JwtPayload;
  cors(responseOrData): Response;
}
```

### `authenticate.public.appProxy(request)`

Validates an app-proxy signature and always provides a Liquid response helper:

```ts
{
  liquid(body: string, init?: ResponseInit & { layout?: boolean }): Response;
}
```

When an offline session exists, it additionally returns:

```ts
{
  session: Session;
  admin: AdminApiContext;
  storefront: StorefrontApiContext;
}
```

Without a session, all three values are `undefined`.

The `liquid` helper supports rendering through the shop theme or returning Liquid without the theme layout using `{ layout: false }`.

## Unauthenticated contexts

The term "unauthenticated" means the request was authenticated by the application through some external mechanism, not that these methods are safe for public input.

### `unauthenticated.admin(shop)`

Loads the shop's offline session or throws `SessionNotFoundError`, then returns:

```ts
{
  session: Session;
  admin: AdminApiContext;
}
```

### `unauthenticated.storefront(shop)`

Loads the shop's offline session or throws, then returns:

```ts
{
  session: Session;
  storefront: {
    graphql: StorefrontGraphqlClient;
  }
}
```

These methods require the caller to validate and authorize the supplied shop domain before calling them.

## Billing API

`authenticate.admin()` attaches a `billing` context based on the plans passed to `shopifyApp({ billing })`.

```ts
billing.require(options): Promise<BillingCheckResponseObject>
billing.check(options?): Promise<BillingCheckResponseObject>
billing.request(options): Promise<never>
billing.cancel(options): Promise<AppSubscription>
billing.createUsageRecord(options): Promise<UsageRecord>
billing.updateUsageCappedAmount(options): Promise<never>
```

- `require` checks configured plans and invokes `onFailure` when no matching active payment exists.
- `check` inspects payments without forcing a redirect.
- `request` redirects to Shopify's payment confirmation flow.
- `cancel` cancels a subscription with optional prorating.
- `createUsageRecord` charges against a usage-based subscription.
- `updateUsageCappedAmount` redirects to confirm a new usage cap.

Plan names are typed from the keys of the app's `billing` configuration.

## Scope management API

`authenticate.admin()` also returns:

```ts
scopes.query(): Promise<{
  granted: string[];
  required: string[];
  optional: string[];
}>;

scopes.request(scopes: string[]): Promise<void>;
scopes.revoke(scopes: string[]): Promise<{ revoked: string[] }>;
```

`request` can perform a server-side redirect to merchant consent. `revoke` applies to optional scopes and errors for required scopes.

## Other facade methods

### `registerWebhooks({ session })`

Registers shop-specific webhook handlers configured through `shopifyApp({ webhooks })`. Shopify recommends app-specific webhook subscriptions in `shopify.app.toml` for cases that do not require per-shop logic.

### `addDocumentResponseHeaders(request, headers)`

Mutates a `Headers` object with document-level Shopify headers. For embedded apps this includes a dynamic `Content-Security-Policy` `frame-ancestors` directive based on the shop and Shopify Admin origins. It also adds App Bridge/Polaris preload or preconnect links.

### `login(request)`

Processes GET query parameters or POST form data containing a shop domain. It either returns validation errors or redirects into authentication.

```ts
type LoginError = {
  shop?: "MISSING_SHOP" | "INVALID_SHOP";
};
```

This member is absent for `AppDistribution.ShopifyAdmin`.

## React module

Import from:

```ts
import {
  AppProvider,
  AppProxyProvider,
  AppProxyLink,
} from "@shopify/shopify-app-react-router/react";
```

### `AppProvider`

```ts
<AppProvider embedded apiKey={apiKey}>
  {children}
</AppProvider>
```

For embedded routes it:

- Loads `https://cdn.shopify.com/shopifycloud/app-bridge.js`.
- Sets `data-api-key` on the script.
- Loads `https://cdn.shopify.com/shopifycloud/polaris.js`.
- Listens for `shopify:navigate` DOM events.
- Uses React Router's `useNavigate()` for same-app navigation.

For a non-embedded route, `<AppProvider embedded={false}>` loads Polaris but not App Bridge.

Most of this component is portable to Next.js. The `useNavigate()` dependency must be replaced by Next.js navigation.

### `AppProxyProvider`

```ts
<AppProxyProvider appUrl={appUrl}>{children}</AppProxyProvider>
```

It supports pages rendered behind a Shopify app proxy by:

- Adding `<base href={appUrl}>` so app-hosted JavaScript and CSS resolve correctly.
- Capturing the browser's proxy URL.
- Providing a URL formatter through React context.
- Normalizing proxy links with trailing slashes.

Its exact pathname/trailing-slash warning exists because React Router lacks URL rewriting. Next.js may be able to replace this behavior with rewrites rather than porting the component unchanged.

### `AppProxyLink`

Renders an anchor that formats its `href` through `AppProxyProvider`:

```ts
<AppProxyLink href="/other-proxy-route">Other page</AppProxyLink>
```

It throws when used outside `AppProxyProvider`.

## React Router-specific boundary API

```ts
boundary.error(error);
boundary.headers(headersArgs);
```

These helpers preserve special headers from responses thrown by `authenticate.admin()` and integrate them with React Router error boundaries.

This API should not be copied directly to Next.js. Next.js route handlers, redirects, errors, middleware, and page rendering have different propagation rules. The underlying response semantics must be preserved, but the boundary abstraction should be redesigned.

## Adapter entry point

The Node adapter is imported for side effects:

```ts
import "@shopify/shopify-app-react-router/adapters/node";
```

It:

- Sets the Shopify API runtime label to `React Router (Node)`.
- Reads `APP_BRIDGE_URL` and applies an App Bridge URL override when present.

The main server entry point already installs Shopify's Web API adapter. A Next.js replacement needs to make an explicit runtime decision between Node and Edge; Prisma and the current Shopify Node stack strongly favor the Node runtime.

## Test helpers

Import from:

```ts
import { testConfig } from "@shopify/shopify-app-react-router/test-helpers";
```

`testConfig(overrides?)` returns a baseline test app configuration containing dummy Shopify credentials, a memory session store, debug logging, and `isTesting: true`.

A Next.js facade could provide a similar helper, but this is not required for production compatibility.

## What is framework-neutral versus framework-specific?

### Primarily framework-neutral

- Shopify API configuration and constants
- Session storage
- Session-token validation
- Token exchange
- Webhook verification and parsing
- Admin and Storefront GraphQL clients
- Billing operations
- Scope operations
- App-proxy signature verification
- Flow, fulfillment, POS, checkout, and customer-account authentication
- Unauthenticated offline-session contexts
- Lifecycle `afterAuth` hook

Much of this can be composed from `@shopify/shopify-api`, `@shopify/admin-api-client`, `@shopify/storefront-api-client`, and Shopify session-storage packages.

### React Router-specific or coupled

- Thrown-response authentication flow
- `boundary.error` and `boundary.headers`
- Route conventions under `authPathPrefix`
- React Router navigation inside `AppProvider`
- App-proxy trailing-slash workaround
- Document-header integration through React Router's server entry
- Loader/action examples and response propagation

## Proposed Next.js compatibility surface

A Next.js implementation does not need to clone every name immediately. A useful compatibility-oriented first version would expose:

```ts
const shopify = shopifyApp(config);

shopify.authenticate.admin(request);
shopify.authenticate.webhook(request);
shopify.authenticate.public.appProxy(request);
shopify.unauthenticated.admin(shop);
shopify.registerWebhooks({ session });
shopify.sessionStorage;
```

Then add, based on actual product requirements:

1. Checkout, customer-account, and POS extension authentication.
2. Billing helpers.
3. Optional-scope helpers.
4. Flow and fulfillment-service authentication.
5. Storefront context.
6. App-proxy Liquid and React utilities.
7. Login UI support for non-embedded entry points.

The hardest compatibility area is not GraphQL or Prisma. It is matching the redirect, token-exchange, session refresh, iframe escape, and response-header behavior of `authenticate.admin()` across Next.js pages and route handlers.

## Source files inspected

The inventory was derived from the installed package's export map and public source declarations, especially:

- `package.json`
- `src/server/index.ts`
- `src/server/shopify-app.ts`
- `src/server/types.ts`
- `src/server/types-contexts.ts`
- `src/server/config-types.ts`
- `src/server/authenticate/**/types.ts`
- `src/server/unauthenticated/**/types.ts`
- `src/server/clients/**/types.ts`
- `src/server/boundary/index.ts`
- `src/react/components/**`
- `src/server/test-helpers/test-config.ts`
