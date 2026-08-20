const APP_BRIDGE_URL = "https://cdn.shopify.com/shopifycloud/app-bridge.js";
const POLARIS_URL = "https://cdn.shopify.com/shopifycloud/polaris.js";

/** Props for the {@link ShopifyHead} component. */
export interface ShopifyHeadProps {
  /**
   * The API key (Client ID) for your Shopify app.
   * @defaultValue `process.env.SHOPIFY_API_KEY`
   */
  apiKey?: string;
}

/**
 * Renders the document metadata and scripts required by App Bridge and Polaris.
 *
 * Render this component at the beginning of the root layout's `head` element.
 */
export function ShopifyHead({ apiKey = process.env.SHOPIFY_API_KEY }: ShopifyHeadProps) {
  if (!apiKey) {
    throw new Error(
      "ShopifyHead requires an API key. Set SHOPIFY_API_KEY or pass the apiKey prop.",
    );
  }

  return (
    <>
      <meta name="shopify-api-key" content={apiKey} />
      <script src={APP_BRIDGE_URL} />
      <script src={POLARIS_URL} />
    </>
  );
}
