import type { ReactNode } from "react";

import { ShopifyHead } from "shopify-app-react";

import "../globals.css";
import { Providers } from "./providers";

export default function EmbeddedLayout({ children }: { children: ReactNode }) {
  const apiKey = process.env.SHOPIFY_API_KEY;

  if (!apiKey) {
    throw new Error("SHOPIFY_API_KEY is required to render the embedded app.");
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://cdn.shopify.com" />
        <ShopifyHead apiKey={apiKey} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
