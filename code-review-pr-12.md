# Code Review — PR #12 (`mttlws/add-app-provider`)

Review of https://github.com/malewis5/shopify-app-next-js/pull/12, run 2026-08-20.
10 findings survived verification: 6 **confirmed** against primary sources (downloaded `polaris.js`/`app-bridge.js` dispatch code, base-branch CI/tsconfig/package.json, and the diff itself), 4 **plausible**.

---

## Confirmed

### 1. Navigation hook relies on an undocumented polaris side channel, and its early returns leave links dead

**File:** `packages/next/src/hooks/use-shopify-navigate.ts:13`

polaris.js monkey-patches `target.getAttribute` during dispatch: any `'href'` read triggers `preventDefault()` on the original click (`n.getAttribute=function(e){return"href"===e&&(r=!0),s.call(this,e)}; … r&&e.preventDefault()`). The hook reads `href` unconditionally, then returns without `router.push` for empty href (reachable today: `href=""` passes polaris's same-origin pre-check) or cross-origin hrefs from non-polaris dispatchers — default navigation is suppressed **and** no SPA navigation happens, so the element does nothing when clicked.

Conversely, the happy path never calls `event.preventDefault()`, which is the documented/stable cancellation (polaris honors `!1===l&&e.preventDefault()`). Any refactor that reads the URL via the `.href` property or defers the read — or a polaris release dropping the instrumentation — makes every s-link click do **both** `router.push` and a full-page reload of the embedded app.

**Fix direction:** call `event.preventDefault()` explicitly on the handled path; on early-return paths, either don't read `getAttribute('href')` before deciding, or perform the fallback navigation yourself.

### 2. `SHOPIFY_API_KEY` becomes a hard build-time requirement and the placeholder gets baked into the prerendered shell

**File:** `packages/next/src/AppProvider.tsx:22`

`apps/web/src/app/layout.tsx` renders `<AppProvider>` with no `apiKey` while `next.config.ts` sets `cacheComponents: true`, so the root layout is prerendered at build: `pnpm build` on a fresh clone or an unconfigured deploy fails with "AppProvider requires an API key". CI only passes because `ci.yml` exports `SHOPIFY_API_KEY=ci-test-api-key` — and that placeholder is frozen into the prerendered HTML as `data-api-key`, so a CI-built or misconfigured-build artifact ships a bogus client ID and App Bridge session-token auth silently breaks; rotating the key at runtime has no effect until rebuild.

### 3. Sync `<script>` tags in `<body>` violate App Bridge's first-script-in-document contract and block paint

**File:** `packages/next/src/AppProvider.tsx:31`

React 19 hoists only `async` scripts to `<head>`; these sync scripts stay in `<body>` after all preceding content. The shipped `app-bridge.js` checks `document.scripts` and warns "The script tag loading App Bridge should be the first script tag in the document"; any earlier blocking script (analytics, GTM) or pre-app-bridge fetch escapes its session-token fetch patching, producing intermittent 401s inside the admin iframe. The two synchronous cross-origin fetches also block HTML parsing of the entire app UI on every cold load.

### 4. Committed shared `client_id` with `automatically_update_urls_on_dev = true`

**File:** `apps/web/shopify.app.toml:3`

A concrete `client_id` and personal `application_url` are committed to the template. Anyone with the Shopify CLI who runs `shopify app dev` against this checked-in config rewrites the shared app's `application_url`/`redirect_urls` to their own tunnel, breaking the author's deployment and every other user. The config also registers webhooks at `/webhooks/app/uninstalled` and `/webhooks/app/scopes_update` — routes the Next.js app does not implement, so deploys register endpoints that 404.

### 5. `pnpm dev` now requires `@shopify/cli`, which isn't declared anywhere

**File:** `apps/web/package.json:6`

Fresh clone + `pnpm install` + `pnpm dev` (`turbo run dev`) fails with "shopify: command not found" unless the contributor has a globally installed Shopify CLI; even then, `shopify app dev` requires partner auth and access to the specific app in the committed `shopify.app.toml`, and no fallback script preserves the old env-free `next dev` path.

### 6. Node 20.9.0 smoke test downgraded to a text grep

**File:** `.github/workflows/ci.yml:101`

The smoke test went from executing the built ESM to `grep -q 'export { AppProvider }'`, and the Test step is still gated `if: matrix.node-version != '20.9.0'` — so zero package code runs on the documented minimum Node. A dist that is unloadable on 20.9.0 (target bump emitting unsupported syntax, broken relative specifier, dependency needing newer Node) keeps CI green while the published package throws `SyntaxError`/`ERR_MODULE_NOT_FOUND` for consumers; conversely a harmless tsc re-export formatting change (`export * from`) fails the grep even though the package works.

---

## Plausible

### 7. Client-boundary render throws a misleading env error

**File:** `packages/next/src/AppProvider.tsx:22`

The package exports `AppProvider` unconditionally with no `server-only` guard. If a consumer imports it from a `'use client'` component, `process.env.SHOPIFY_API_KEY` is undefined in the browser bundle (Next.js never exposes non-`NEXT_PUBLIC` vars to client bundles), so the component throws "Set SHOPIFY_API_KEY or pass the apiKey prop" at hydration — telling the user to set a variable that is already set on the server.

### 8. Unguarded `new URL()` can throw inside the document-level event handler

**File:** `packages/next/src/hooks/use-shopify-navigate.ts:17`

Today's polaris.js pre-parses the href before dispatching, but any other dispatcher of `shopify:navigate` (tests, app code, a future App Bridge/polaris version that skips the pre-parse) with a malformed href (e.g. `http://[`) makes the URL constructor throw inside the listener — uncaught error on `document`, navigation dead, dev-mode error overlay. Use `URL.canParse` or try/catch.

### 9. `check-types.dependsOn` swap drops the upstream type gate

**File:** `turbo.json:23`

Changed from `["^check-types"]` to `["^build"]`, dropping the upstream type-cleanliness gate instead of extending it. `packages/next`'s build tsconfig excludes `src/**/*.test.*`, so in filtered/affected runs (`turbo check-types --filter=web...`) type errors confined to core's test files no longer fail the type-check pipeline and only surface later in vitest or the separate CI matrix. `["^build", "^check-types"]` would keep both guarantees.

### 10. 257 lines of vendored docs for a different package committed

**File:** `research/react-router-docs.md:1`

Copied shopify.dev documentation for `@shopify/shopify-app-react-router` — a different package than this Next.js one — apparently research scratch that leaked into the PR. It will silently go stale, misleads contributors about which API applies, and nothing references it. Drop it or move it out of version control.
