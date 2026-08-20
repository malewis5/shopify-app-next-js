"use client";

import type { ReactNode } from "react";

import { type ShopifyNavigate, useShopifyNavigation } from "./hooks/use-shopify-navigation.js";

/** Props for the {@link AppProvider} component. */
export interface AppProviderProps {
  /** The application UI to render. */
  children: ReactNode;
  /** Navigates to a root-relative URL with the application's client router. */
  navigate: ShopifyNavigate;
}

/** Connects Shopify navigation events to an application's client router. */
export function AppProvider({ children, navigate }: AppProviderProps) {
  useShopifyNavigation(navigate);

  return children;
}
