"use client";

import { useShopifyNavigation } from "shopify-app-react";
import { useRouter } from "next/navigation";

export function AppProviderClient() {
  const router = useRouter();

  useShopifyNavigation(router.push);

  return null;
}
