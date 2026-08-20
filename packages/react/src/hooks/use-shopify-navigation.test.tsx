import { cleanup, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useShopifyNavigation } from "./use-shopify-navigation.js";

describe("useShopifyNavigation", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it("cancels same-origin events and passes the destination to navigate", () => {
    const navigate = vi.fn();
    renderHook(() => useShopifyNavigation(navigate));
    const link = document.createElement("a");
    link.href = "/products?status=active#results";
    document.body.append(link);
    const event = new Event("shopify:navigate", { bubbles: true, cancelable: true });

    fireEvent(link, event);

    expect(navigate).toHaveBeenCalledWith("/products?status=active#results");
    expect(event.defaultPrevented).toBe(true);
  });

  it("ignores events already handled by another listener", () => {
    const firstNavigate = vi.fn();
    const secondNavigate = vi.fn();
    renderHook(() => useShopifyNavigation(firstNavigate));
    renderHook(() => useShopifyNavigation(secondNavigate));
    const link = document.createElement("a");
    link.href = "/products";
    document.body.append(link);

    fireEvent(link, new Event("shopify:navigate", { bubbles: true, cancelable: true }));

    expect(firstNavigate).toHaveBeenCalledOnce();
    expect(secondNavigate).not.toHaveBeenCalled();
  });

  it("leaves events without a destination untouched", () => {
    const navigate = vi.fn();
    renderHook(() => useShopifyNavigation(navigate));
    const link = document.createElement("a");
    link.setAttribute("href", "");
    document.body.append(link);
    const event = new Event("shopify:navigate", { bubbles: true, cancelable: true });

    fireEvent(link, event);

    expect(navigate).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("leaves cross-origin events untouched", () => {
    const navigate = vi.fn();
    renderHook(() => useShopifyNavigation(navigate));
    const link = document.createElement("a");
    link.href = "https://example.com/products";
    document.body.append(link);
    const event = new Event("shopify:navigate", { bubbles: true, cancelable: true });

    fireEvent(link, event);

    expect(navigate).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("leaves malformed destinations untouched", () => {
    const navigate = vi.fn();
    renderHook(() => useShopifyNavigation(navigate));
    const link = document.createElement("a");
    link.setAttribute("href", "http://[");
    document.body.append(link);
    const event = new Event("shopify:navigate", { bubbles: true, cancelable: true });

    expect(() => fireEvent(link, event)).not.toThrow();
    expect(navigate).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("does not require URL.canParse", () => {
    const canParse = URL.canParse;
    Object.defineProperty(URL, "canParse", { configurable: true, value: undefined });

    try {
      const navigate = vi.fn();
      renderHook(() => useShopifyNavigation(navigate));
      const link = document.createElement("a");
      link.href = "/products";
      document.body.append(link);

      fireEvent(link, new Event("shopify:navigate", { bubbles: true, cancelable: true }));

      expect(navigate).toHaveBeenCalledWith("/products");
    } finally {
      Object.defineProperty(URL, "canParse", { configurable: true, value: canParse });
    }
  });

  it("uses the latest callback without replacing the document listener", () => {
    const addEventListener = vi.spyOn(document, "addEventListener");
    const removeEventListener = vi.spyOn(document, "removeEventListener");
    const firstNavigate = vi.fn();
    const secondNavigate = vi.fn();
    const { rerender } = renderHook(({ navigate }) => useShopifyNavigation(navigate), {
      initialProps: { navigate: firstNavigate },
    });

    rerender({ navigate: secondNavigate });

    const link = document.createElement("a");
    link.href = "/products";
    document.body.append(link);
    fireEvent(link, new Event("shopify:navigate", { bubbles: true, cancelable: true }));

    expect(firstNavigate).not.toHaveBeenCalled();
    expect(secondNavigate).toHaveBeenCalledWith("/products");
    expect(
      addEventListener.mock.calls.filter(([type]) => type === "shopify:navigate"),
    ).toHaveLength(1);
    expect(
      removeEventListener.mock.calls.filter(([type]) => type === "shopify:navigate"),
    ).toHaveLength(0);
  });

  it("stops handling events when unmounted", () => {
    const navigate = vi.fn();
    const { unmount } = renderHook(() => useShopifyNavigation(navigate));
    const link = document.createElement("a");
    link.href = "/products";
    document.body.append(link);

    unmount();
    fireEvent(link, new Event("shopify:navigate", { bubbles: true }));

    expect(navigate).not.toHaveBeenCalled();
  });
});
