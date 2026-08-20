import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ShopifyHead } from "./ShopifyHead.js";

describe("ShopifyHead", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("uses SHOPIFY_API_KEY by default", () => {
    vi.stubEnv("SHOPIFY_API_KEY", "environment-api-key");

    render(<ShopifyHead />);

    expect(document.querySelector('meta[name="shopify-api-key"]')).toHaveAttribute(
      "content",
      "environment-api-key",
    );
  });

  it("allows SHOPIFY_API_KEY to be overridden", () => {
    render(<ShopifyHead apiKey="prop-api-key" />);

    expect(document.querySelector('meta[name="shopify-api-key"]')).toHaveAttribute(
      "content",
      "prop-api-key",
    );
  });

  it("throws when no API key is available", () => {
    vi.stubEnv("SHOPIFY_API_KEY", "");

    expect(() => render(<ShopifyHead />)).toThrow(
      "ShopifyHead requires an API key. Set SHOPIFY_API_KEY or pass the apiKey prop.",
    );
  });

  it("renders synchronous App Bridge and Polaris scripts in order", () => {
    render(<ShopifyHead apiKey="test-api-key" />);

    const appBridgeScript = document.querySelector(
      'script[src="https://cdn.shopify.com/shopifycloud/app-bridge.js"]',
    );
    const polarisScript = document.querySelector(
      'script[src="https://cdn.shopify.com/shopifycloud/polaris.js"]',
    );

    expect(appBridgeScript).not.toHaveAttribute("async");
    expect(appBridgeScript).not.toHaveAttribute("defer");
    expect(appBridgeScript).not.toHaveAttribute("type");
    expect(polarisScript).not.toHaveAttribute("async");
    expect(polarisScript).not.toHaveAttribute("defer");
    expect(polarisScript).not.toHaveAttribute("type");
    expect(appBridgeScript?.compareDocumentPosition(polarisScript!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
