# shopify-apps

## What this codebase does

- Repository inspection could not be completed because the advertised shell execution tool was unavailable in this session.
- The codebase appears to be a Turborepo-managed Shopify application monorepo, based only on repository metadata supplied to the reviewer.
- Application responsibilities and concrete ingress families remain unverified.

## Auth shape

- Authentication implementation was not verifiable.
- Shopify session validation should be confirmed at every application boundary.
- Webhook authenticity checks should be confirmed before payload processing.

## Threat model

- Untrusted Shopify HTTP and webhook input may reach application handlers.
- Tenant isolation depends on consistently binding data access to the authenticated shop.
- OAuth tokens and Shopify session material are high-value secrets.

## Project-specific patterns to flag

- Handlers that accept a shop identifier independently of the authenticated session.
- Shopify webhooks processed without signature verification or replay controls.
- Background work that loses shop or tenant context.
- Admin API clients initialized from request-controlled shop information.

## Known false-positives

- Public OAuth callback routes are intentionally unauthenticated before callback validation.
- Shopify webhook endpoints are publicly reachable but should authenticate signatures.
- Health-check endpoints may intentionally omit application sessions.
