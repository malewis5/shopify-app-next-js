const APP_BRIDGE_URL = "https://cdn.shopify.com/shopifycloud/app-bridge.js";
const POLARIS_URL = "https://cdn.shopify.com/shopifycloud/polaris.js";

/** Props for the {@link ShopifyHead} component. */
export interface ShopifyHeadProps {
  /** The Shopify API key (Client ID). */
  apiKey: string;
}

/** Renders the document metadata and scripts required by App Bridge and Polaris. */
export function ShopifyHead({ apiKey }: ShopifyHeadProps) {
  return (
    <>
      <meta name="shopify-api-key" content={apiKey} />
      <script src={APP_BRIDGE_URL} />
      <script src={POLARIS_URL} />
    </>
  );
}
