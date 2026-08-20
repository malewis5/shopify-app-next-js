export default function Home() {
  return (
    <s-page heading="App dashboard" inlineSize="base">
      <s-stack direction="block" gap="base">
        <s-banner heading="Polaris web components are loaded and ready to use." tone="success" />

        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))" gap="base">
          <s-box padding="base" background="subdued" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text tone="neutral" color="subdued">
                Active products
              </s-text>
              <s-heading>24</s-heading>
              <s-badge tone="success">Up 12%</s-badge>
            </s-stack>
          </s-box>

          <s-box padding="base" background="subdued" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text tone="neutral" color="subdued">
                Orders today
              </s-text>
              <s-heading>8</s-heading>
              <s-badge tone="info">3 to fulfill</s-badge>
            </s-stack>
          </s-box>

          <s-box padding="base" background="subdued" borderRadius="base">
            <s-stack direction="block" gap="small">
              <s-text tone="neutral" color="subdued">
                App status
              </s-text>
              <s-heading>Healthy</s-heading>
              <s-badge tone="success">All systems operational</s-badge>
            </s-stack>
          </s-box>
        </s-grid>

        <s-section heading="Get started">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Build your first workflow, then preview how it appears to merchants in Shopify Admin.
            </s-paragraph>
            <s-button-group gap="base">
              <s-button variant="primary">Create workflow</s-button>
              <s-button variant="secondary">View documentation</s-button>
            </s-button-group>
          </s-stack>
        </s-section>
      </s-stack>
    </s-page>
  );
}
