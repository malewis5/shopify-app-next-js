"use client";

import { useEffect } from "react";
import { getHref } from "./utils.js";

export type ShopifyNavigate = (href: string) => void;

/**
 * Handles Polaris `shopify:navigate` events with a client-side router.
 *
 * Same-origin destinations are cancelled and passed to `navigate`. Events
 * without a destination or with a cross-origin destination are left untouched
 * so the dispatcher can perform its default navigation behavior.
 */
export function useShopifyNavigation(navigate: ShopifyNavigate) {
  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const href = getHref(event.target);
      if (!href) return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;

      event.preventDefault();
      navigate(`${url.pathname}${url.search}${url.hash}`);
    };

    document.addEventListener("shopify:navigate", handleNavigate);

    return () => {
      document.removeEventListener("shopify:navigate", handleNavigate);
    };
  }, [navigate]);
}
