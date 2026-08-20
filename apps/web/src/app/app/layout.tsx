import { AppProvider, ShopifyHead } from "shopify-app-nextjs";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <>
      <ShopifyHead apiKey={process.env.SHOPIFY_API_KEY!} />
      <AppProvider>{children}</AppProvider>
    </>
  );
}
