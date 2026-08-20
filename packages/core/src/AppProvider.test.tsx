import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppProvider } from "./AppProvider.js";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("AppProvider", () => {
  beforeEach(() => {
    push.mockReset();
    vi.stubEnv("SHOPIFY_API_KEY", "environment-api-key");
  });

  afterEach(() => {
    cleanup();
    document.body.replaceChildren();
    vi.unstubAllEnvs();
  });

  it("uses SHOPIFY_API_KEY by default", () => {
    render(
      <AppProvider>
        <main>Application</main>
      </AppProvider>,
    );

    expect(
      document.querySelector('script[src="https://cdn.shopify.com/shopifycloud/app-bridge.js"]'),
    ).toHaveAttribute("data-api-key", "environment-api-key");
  });

  it("allows SHOPIFY_API_KEY to be overridden", () => {
    render(
      <AppProvider apiKey="prop-api-key">
        <main>Application</main>
      </AppProvider>,
    );

    expect(
      document.querySelector('script[src="https://cdn.shopify.com/shopifycloud/app-bridge.js"]'),
    ).toHaveAttribute("data-api-key", "prop-api-key");
  });

  it("throws when no API key is available", () => {
    vi.stubEnv("SHOPIFY_API_KEY", "");

    expect(() =>
      render(
        <AppProvider>
          <main>Application</main>
        </AppProvider>,
      ),
    ).toThrow("AppProvider requires an API key. Set SHOPIFY_API_KEY or pass the apiKey prop.");
  });

  it("renders App Bridge, Polaris, and its children", () => {
    render(
      <AppProvider apiKey="test-api-key">
        <main>Application</main>
      </AppProvider>,
    );

    expect(screen.getByRole("main")).toHaveTextContent("Application");
    const appBridgeScript = document.querySelector(
      'script[src="https://cdn.shopify.com/shopifycloud/app-bridge.js"]',
    );
    const polarisScript = document.querySelector(
      'script[src="https://cdn.shopify.com/shopifycloud/polaris.js"]',
    );

    expect(appBridgeScript).toHaveAttribute("data-api-key", "test-api-key");
    expect(appBridgeScript).not.toHaveAttribute("async");
    expect(appBridgeScript).not.toHaveAttribute("defer");
    expect(polarisScript).not.toHaveAttribute("async");
    expect(polarisScript).not.toHaveAttribute("defer");
    expect(appBridgeScript?.compareDocumentPosition(polarisScript!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(polarisScript?.compareDocumentPosition(screen.getByRole("main"))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("uses Next.js navigation for same-origin Shopify navigation events", () => {
    render(
      <AppProvider apiKey="test-api-key">
        <main>Application</main>
      </AppProvider>,
    );
    const link = document.createElement("a");
    link.href = "/products?status=active#results";
    document.body.append(link);

    fireEvent(link, new Event("shopify:navigate", { bubbles: true }));

    expect(push).toHaveBeenCalledWith("/products?status=active#results");
  });

  it("ignores cross-origin Shopify navigation events", () => {
    render(
      <AppProvider apiKey="test-api-key">
        <main>Application</main>
      </AppProvider>,
    );
    const link = document.createElement("a");
    link.href = "https://example.com/products";
    document.body.append(link);

    fireEvent(link, new Event("shopify:navigate", { bubbles: true }));

    expect(push).not.toHaveBeenCalled();
  });

  it("stops handling Shopify navigation events when unmounted", () => {
    const { unmount } = render(
      <AppProvider apiKey="test-api-key">
        <main>Application</main>
      </AppProvider>,
    );
    const link = document.createElement("a");
    link.href = "/products";
    document.body.append(link);

    unmount();
    fireEvent(link, new Event("shopify:navigate", { bubbles: true }));

    expect(push).not.toHaveBeenCalled();
  });
});
