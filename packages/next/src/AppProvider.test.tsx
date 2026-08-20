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
  });

  afterEach(() => {
    cleanup();
    document.body.replaceChildren();
  });

  it("renders its children without injecting document scripts", () => {
    render(
      <AppProvider>
        <main>Application</main>
      </AppProvider>,
    );

    expect(screen.getByRole("main")).toHaveTextContent("Application");
    expect(document.querySelector('script[src*="shopifycloud/app-bridge.js"]')).toBeNull();
    expect(document.querySelector('script[src*="shopifycloud/polaris.js"]')).toBeNull();
  });

  it("cancels same-origin Shopify navigation events handled by Next.js", () => {
    render(
      <AppProvider>
        <main>Application</main>
      </AppProvider>,
    );
    const link = document.createElement("a");
    link.href = "/products?status=active#results";
    document.body.append(link);
    const event = new Event("shopify:navigate", { bubbles: true, cancelable: true });

    fireEvent(link, event);

    expect(push).toHaveBeenCalledWith("/products?status=active#results");
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not consume empty href events through a getAttribute side effect", () => {
    render(
      <AppProvider>
        <main>Application</main>
      </AppProvider>,
    );
    const link = document.createElement("a");
    link.setAttribute("href", "");
    document.body.append(link);
    const event = new Event("shopify:navigate", { bubbles: true, cancelable: true });
    const getAttribute = link.getAttribute.bind(link);
    vi.spyOn(link, "getAttribute").mockImplementation((name) => {
      if (name === "href") event.preventDefault();
      return getAttribute(name);
    });

    fireEvent(link, event);

    expect(push).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("leaves cross-origin Shopify navigation events uncancelled", () => {
    render(
      <AppProvider>
        <main>Application</main>
      </AppProvider>,
    );
    const link = document.createElement("a");
    link.href = "https://example.com/products";
    document.body.append(link);
    const event = new Event("shopify:navigate", { bubbles: true, cancelable: true });

    fireEvent(link, event);

    expect(push).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("stops handling Shopify navigation events when unmounted", () => {
    const { unmount } = render(
      <AppProvider>
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
