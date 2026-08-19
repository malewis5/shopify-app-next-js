# Next.js Shopify app dependency research

The reference project at `/Users/mattlewis/Desktop/boilerplate-test-app` is Shopify's React Router template, not a Next.js app. The session storage pieces can be reused, but the behavior supplied by `@shopify/shopify-app-react-router` needs to be implemented for Next.js.

## Core dependencies

For a new embedded Shopify Admin app using Next.js, Prisma, and PostgreSQL:

```json
{
  "dependencies": {
    "next": "...",
    "react": "...",
    "react-dom": "...",
    "@shopify/shopify-api": "^14.0.0",
    "@shopify/shopify-app-session-storage": "^6.0.0",
    "@shopify/shopify-app-session-storage-prisma": "^10.0.0",
    "@shopify/app-bridge-react": "^4.2.12",
    "@prisma/client": "^6.19.0"
  },
  "devDependencies": {
    "prisma": "^6.19.0",
    "typescript": "...",
    "@types/node": "...",
    "@types/react": "...",
    "@types/react-dom": "..."
  }
}
```

`@shopify/shopify-api` v14 requires Node.js 22 or newer.

There does not appear to be an official `@shopify/shopify-app-next` package equivalent to Shopify's React Router integration.

## Reusable without rewriting

- `@shopify/app-bridge-react`
  - Provides React wrappers and hooks for App Bridge.
  - It does not implement backend authentication.
- `@shopify/shopify-app-session-storage`
- `@shopify/shopify-app-session-storage-prisma`
- Prisma's `Session` model from the Shopify template
- `shopify.app.toml`, with URLs and webhook paths changed for the Next.js app
- Shopify CLI extension workspace and configuration

The Prisma session adapter is framework-independent. It needs a Prisma client and the compatible peer dependencies listed above.

## Must port from `@shopify/shopify-app-react-router`

The React Router package currently handles more than routing. A Next.js integration must replace its behavior:

- OAuth and/or embedded token exchange
- Session-token/JWT validation on protected routes
- Loading online and offline sessions from Prisma
- Reauthorization when a session is absent or invalid
- Creating authenticated Admin API clients
- OAuth callback handling, if using authorization-code OAuth
- Webhook HMAC verification using the unmodified request body
- `app/uninstalled` webhook session cleanup
- `app/scopes_update` handling
- Embedded-app redirects and iframe escape
- Dynamic `Content-Security-Policy: frame-ancestors ...` headers
- App Bridge and Polaris script injection
- Billing helpers, if the app charges merchants

These should live in server-only modules and Next.js route handlers or middleware where appropriate.

## App Bridge and Polaris

The current Shopify template loads App Bridge from Shopify's CDN. A Next.js layout should include the equivalent script with the public Shopify API key/client ID:

```tsx
<script
  src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
  data-api-key={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}
/>
```

For Shopify's current Polaris web components, also load:

```tsx
<script src="https://cdn.shopify.com/shopifycloud/polaris.js" />
```

`@shopify/polaris-types` is optional but useful for TypeScript support for Polaris web components. The old `@shopify/polaris` React component package is not required when following the current web-component approach.

## Optional GraphQL code generation

If typed Admin GraphQL operations are wanted:

```json
{
  "devDependencies": {
    "@shopify/api-codegen-preset": "^1.2.2",
    "graphql-config": "^5.1.6",
    "@graphql-codegen/cli": "..."
  }
}
```

The GraphQL config will need to scan the Next.js source directories instead of the React Router template's `app` routes.

## Do not carry over from the React Router template

These are framework-specific and should not be installed in the Next.js app:

- `@shopify/shopify-app-react-router`
- `@react-router/dev`
- `@react-router/fs-routes`
- `@react-router/node`
- `@react-router/serve`
- `react-router`
- `@vercel/react-router`
- Vite and `vite-tsconfig-paths`
- `isbot`, unless the Next.js app independently needs it

## Prisma session schema

The reusable session model must include fields required by Shopify's current session adapter, including refresh-token fields for expiring offline access tokens:

```prisma
model Session {
  id                  String    @id
  shop                String
  state               String
  isOnline            Boolean   @default(false)
  scope               String?
  expires             DateTime?
  accessToken         String
  userId              BigInt?
  firstName           String?
  lastName            String?
  email               String?
  accountOwner        Boolean   @default(false)
  locale              String?
  collaborator        Boolean?  @default(false)
  emailVerified       Boolean?  @default(false)
  refreshToken        String?
  refreshTokenExpires DateTime?
}
```

## Scope clarification

This research applies to an embedded Shopify Admin app. A Next.js storefront would use the Storefront API or Hydrogen and has a different dependency and authentication model.
