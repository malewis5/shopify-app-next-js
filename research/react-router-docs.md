---
title: Shopify App package for React Router
description: >-
  The @shopify/shopify-app-react-router package enables React Router apps to
  authenticate with Shopify and make API calls.
api_version: v2
source_url:
  html: "https://shopify.dev/docs/api/shopify-app-react-router/latest"
  md: "https://shopify.dev/docs/api/shopify-app-react-router/latest.md"
api_name: shopify-app-react-router
---

# Shopify App package for React Router

The [@shopify/shopify-app-react-router](https://www.npmjs.com/package/@shopify/shopify-app-react-router) package enables [React Router](https://reactrouter.com/home) apps to authenticate with Shopify and make API calls. It uses [App Bridge](https://shopify.dev/docs/api/app-home) to enable apps to embed themselves in the Shopify Admin.

On this page learn the key concepts when building an app with this package.

## Quick start

The quickest way to create a new app is using the Shopify CLI, and the Shopify App Template.

Check out the [getting started guide](https://shopify.dev/docs/apps/build/scaffold-app), or the [app template](https://github.com/Shopify/shopify-app-template-react-router).

## Create an app

## Terminal

```sh
shopify app init --template=https://github.com/Shopify/shopify-app-template-react-router
```

---

## Configure the package

Using the `shopifyApp` function, you can configure the package's functionality for different app distributions types, access tokens, logging levels and future flags.

[shopifyApp](https://shopify.dev/docs/api/shopify-app-react-router/entrypoints/shopifyapp)

## Configure ShopifyApp

## /app/shopify.server.ts

```ts
import {
  ApiVersion,
  LogSeverity,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  appUrl: process.env.SHOPIFY_APP_URL!,
  apiVersion: ApiVersion.July25,
  logger: {
    level: LogSeverity.Debug, // Set the log level to debug
  },
  future: {
    exampleFlag: true, // Enable a future flag to true
  },
});
export default shopify;
```

---

## Make Admin API Graph​QL requests

Authenticated requests with the Admin API GraphQL client are made by calling the `admin.graphql` function. This function returns a GraphQL client that is authenticated with the Admin API.

[admin.graphql](https://shopify.dev/docs/api/shopify-app-react-router/v0/guide-admin#graphql-api)

## Make a GraphQL request

## /app/routes/admin/$.tsx

```tsx
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
        mutation populateProduct($product: ProductCreateInput!) {
          productCreate(product: $product) {
            product {
              id
              variants(first: 10) {
                  nodes {
                    id
                    createdAt
                  }
                }
              }
            }
          }
        }`,
    {
      variables: {
        product: {
          title: "Test Product",
        },
      },
    },
  );
  const responseJson = await response.json();
};
```

---

## Add a new route to your app

Routes embedded in the Shopify Admin must be nested under an Admin layout route for proper authentication and functionality.

The template includes an admin route at `/app/routes/app.tsx` that handles App Bridge initialization, authenticates requests via `authenticate.admin`, provides error boundaries and headers required by the admin.

When creating new routes, place them in the `/app/routes/` directory with the `app.` prefix (e.g., `app.products.tsx`) to ensure they inherit these features. This structure ensures your app behaves correctly within the Shopify Admin and has access to authenticated API clients.

## Add a route

##### /app/routes/app.new\.tsx

```tsx
import { TitleBar } from "@shopify/app-bridge-react";

export default function AdditionalPage() {
  return (
    <s-page>
      <TitleBar title="Additional page"></TitleBar>
      <s-section heading="Multiple pages">
        <s-paragraph>
          The app template comes with an additional page which demonstrates how
          to create multiple pages within app navigation using{" "}
          <s-link
            href="https:shopify.dev/docs/apps/tools/app-bridge"
            target="_blank"
          >
            App Bridge
          </s-link>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
```

##### /app/routes/app.tsx

```tsx
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { NavMenu } from "@shopify/app-bridge-react";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/additional">Additional page</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
```

---

## Authenticate Webhook Requests

The package provide functions to authenticate webhook requests. This function returns a webhook client that is authenticated with the Admin API.

**Note:**

Ensure your webhook route is not nested under you app layout route.

[authenticate.webhook](https://shopify.dev/docs/api/shopify-app-react-router/v0/authenticate/webhook)

## Authenticate Webhook Requests

## /app/routes/webhooks.app.product_updated.tsx

```tsx
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  return new Response();
};
```

---

## Session Storage

When using this package, installed shops access tokens will be stored in session storage.You can configure the storage mechanism by passing a custom storage object to the `shopifyApp` function.By default, the template will use Prisma and SQLite, but other session storage adapters are available.

**Note:**

The type of session storage you use may impact how your app will be deployed.

[Session Storage](https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/session-storage)

## Session Storage

## /app/shopify.server.ts

```ts
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  appUrl: process.env.SHOPIFY_APP_URL || "",
  // use Prisma session storage
  sessionStorage: new PrismaSessionStorage(prisma),
});

export const sessionStorage = shopify.sessionStorage;
```

---

## Deploy your app

You can deploy your app to your preferred hosting service that is compatible with JavaScript apps. Review our deployment guide to learn about the requirements for deploying your app.

[Deploy your app](https://shopify.dev/docs/apps/launch/deployment)

---
