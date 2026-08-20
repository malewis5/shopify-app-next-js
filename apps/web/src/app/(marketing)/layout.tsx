import type { ReactNode } from "react";

import "../globals.css";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
