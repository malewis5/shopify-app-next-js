import type { ReactNode } from "react";

import { AppProviderClient } from "./AppProviderClient.js";

const APP_BRIDGE_URL = "https://cdn.shopify.com/shopifycloud/app-bridge.js";
const POLARIS_URL = "https://cdn.shopify.com/shopifycloud/polaris.js";

/** Props for the {@link AppProvider} component. */
export interface AppProviderProps {
  /**
   * The API key (Client ID) for your Shopify app.
   * @defaultValue `process.env.SHOPIFY_API_KEY`
   */
  apiKey?: string;
  /** The application UI to render. */
  children: ReactNode;
}

/**
 * Sets up an embedded Shopify app with App Bridge and Polaris web components.
 */
export function AppProvider({ apiKey = process.env.SHOPIFY_API_KEY, children }: AppProviderProps) {
  if (!apiKey) {
    throw new Error(
      "AppProvider requires an API key. Set SHOPIFY_API_KEY or pass the apiKey prop.",
    );
  }

  return (
    <>
      <script src={APP_BRIDGE_URL} data-api-key={apiKey} />
      <script src={POLARIS_URL} />
      <AppProviderClient />
      {children}
    </>
  );
}
