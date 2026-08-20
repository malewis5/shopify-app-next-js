# shopify-app-nextjs

Build Shopify apps with the Next.js App Router.

This package is under active development and is not ready for production use.

## Requirements

- Node.js 20.9 or newer
- Next.js 16
- React 19

## Installation

```bash
pnpm add shopify-app-nextjs
```

## AppProvider

Add `AppProvider` to the layout for your embedded app routes. It loads App Bridge and Polaris web components, and handles App Bridge navigation with the Next.js App Router.

```tsx
import { AppProvider } from "shopify-app-nextjs";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider apiKey={process.env.SHOPIFY_API_KEY!}>
      {children}
    </AppProvider>
  );
}
```
