"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useShopifyNavigation } from "shopify-app-react";

/** Props for the {@link AppProvider} component. */
export interface AppProviderProps {
  /** The application UI to render. */
  children: ReactNode;
}

/** Integrates App Bridge navigation with the Next.js App Router. */
export function AppProvider({ children }: AppProviderProps) {
  const router = useRouter();

  useShopifyNavigation(router.push);

  return children;
}
