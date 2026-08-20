"use client";

import { useShopifyNavigate } from "./hooks/use-shopify-navigate.js";

export function AppProviderClient() {
  useShopifyNavigate();

  return null;
}
