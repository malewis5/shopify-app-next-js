"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppProvider } from "shopify-app-react";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return <AppProvider navigate={router.push}>{children}</AppProvider>;
}
