"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useShopifyNavigate() {
  const router = useRouter();

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const target = event.target;
      const href =
        target && "getAttribute" in target ? (target as Element).getAttribute("href") : null;

      if (!href) return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;

      router.push(`${url.pathname}${url.search}${url.hash}`);
    };

    document.addEventListener("shopify:navigate", handleNavigate);

    return () => {
      document.removeEventListener("shopify:navigate", handleNavigate);
    };
  }, [router]);
}
