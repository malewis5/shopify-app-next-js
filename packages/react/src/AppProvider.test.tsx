import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppProvider } from "./AppProvider.js";

const navigate = vi.fn();

describe("AppProvider", () => {
  beforeEach(() => {
    navigate.mockReset();
  });

  afterEach(() => {
    cleanup();
    document.body.replaceChildren();
  });

  it("renders its children without injecting document scripts", () => {
    render(
      <AppProvider navigate={navigate}>
        <main>Application</main>
      </AppProvider>,
    );

    expect(screen.getByRole("main")).toHaveTextContent("Application");
    expect(document.querySelector('script[src*="shopifycloud/app-bridge.js"]')).toBeNull();
    expect(document.querySelector('script[src*="shopifycloud/polaris.js"]')).toBeNull();
  });

  it("passes same-origin Shopify navigation events to the client router", () => {
    render(
      <AppProvider navigate={navigate}>
        <main>Application</main>
      </AppProvider>,
    );
    const link = document.createElement("a");
    link.href = "/products?status=active#results";
    document.body.append(link);
    const event = new Event("shopify:navigate", { bubbles: true, cancelable: true });

    fireEvent(link, event);

    expect(navigate).toHaveBeenCalledWith("/products?status=active#results");
    expect(event.defaultPrevented).toBe(true);
  });

  it("leaves cross-origin Shopify navigation events uncancelled", () => {
    render(
      <AppProvider navigate={navigate}>
        <main>Application</main>
      </AppProvider>,
    );
    const link = document.createElement("a");
    link.href = "https://example.com/products";
    document.body.append(link);
    const event = new Event("shopify:navigate", { bubbles: true, cancelable: true });

    fireEvent(link, event);

    expect(navigate).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("stops handling Shopify navigation events when unmounted", () => {
    const { unmount } = render(
      <AppProvider navigate={navigate}>
        <main>Application</main>
      </AppProvider>,
    );
    const link = document.createElement("a");
    link.href = "/products";
    document.body.append(link);

    unmount();
    fireEvent(link, new Event("shopify:navigate", { bubbles: true }));

    expect(navigate).not.toHaveBeenCalled();
  });
});
