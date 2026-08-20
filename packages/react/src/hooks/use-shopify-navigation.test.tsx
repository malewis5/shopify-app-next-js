import { fireEvent, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useShopifyNavigation } from "./use-shopify-navigation.js";

describe("useShopifyNavigation", () => {
  afterEach(() => {
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
