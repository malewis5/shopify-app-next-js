"use client";

import { useEffect, useRef } from "react";
import { getHref } from "./utils.js";

export type ShopifyNavigate = (href: string) => void;

/**
 * Handles Polaris `shopify:navigate` events with a client-side router.
 *
 * Same-origin destinations are cancelled and passed to `navigate`. Events
 * without a destination, with a cross-origin destination, or already handled
 * by another listener are left untouched.
 */
export function useShopifyNavigation(navigate: ShopifyNavigate) {
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      if (event.defaultPrevented) return;

      const href = getHref(event.target);
      if (!href) return;

      let url: URL;

      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      event.preventDefault();
      navigateRef.current(`${url.pathname}${url.search}${url.hash}`);
    };

    document.addEventListener("shopify:navigate", handleNavigate);

    return () => {
      document.removeEventListener("shopify:navigate", handleNavigate);
    };
  }, []);
}
