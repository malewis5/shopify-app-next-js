import type { ReactNode } from "react";

import { AppProviderClient } from "./AppProviderClient.js";

/** Props for the {@link AppProvider} component. */
export interface AppProviderProps {
  /** The application UI to render. */
  children: ReactNode;
}

/**
 * Integrates App Bridge navigation with the Next.js App Router.
 *
 * Render {@link ShopifyHead} separately in the document head.
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <>
      <AppProviderClient />
      {children}
    </>
  );
}
