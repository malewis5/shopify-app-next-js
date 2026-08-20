import { compileDeclarativeMatchers, type DeepsecPlugin } from "deepsec/config";

const specs = [
  {
    "version": 1,
    "slug": "package-manager-scripts",
    "description": "Detects package-manager CLI commands registered in a package.json scripts object.",
    "noiseTier": "precise",
    "filePatterns": [
      "package.json"
    ],
    "patterns": [
      {
        "source": "^\\s*\"scripts\"\\s*:\\s*\\{",
        "flags": "m",
        "label": "package.json scripts registration"
      }
    ],
    "examples": [
      "\"scripts\": {"
    ],
    "closesSurfaceIds": [
      "workspace-cli"
    ]
  },
  {
    "version": 1,
    "slug": "shopify-navigation-event-bridge",
    "description": "Detects Shopify document navigation events, same-origin URL validation, and forwarding into the client router.",
    "noiseTier": "precise",
    "filePatterns": [
      "packages/react/src/hooks/use-shopify-navigation.ts",
      "packages/react/src/hooks/utils.ts",
      "packages/next/src/AppProvider.tsx"
    ],
    "patterns": [
      {
        "source": "[\"']shopify:navigate[\"']",
        "label": "Shopify navigation event identifier"
      },
      {
        "source": "\\bURL\\.canParse\\s*\\(",
        "label": "Navigation URL parsing guard"
      },
      {
        "source": "\\b(?:url|parsedUrl)\\.origin\\s*(?:===|!==)\\s*(?:window\\.)?location\\.origin",
        "label": "Same-origin navigation constraint"
      },
      {
        "source": "\\brouter\\.push\\s*\\(",
        "label": "Host client-router forwarding"
      },
      {
        "source": "\\buseShopifyNavigation\\s*\\(",
        "label": "Shopify navigation bridge installation"
      }
    ],
    "examples": [
      "document.addEventListener(\"shopify:navigate\", handleNavigation);",
      "if (!URL.canParse(url)) return;",
      "if (parsedUrl.origin !== window.location.origin) return;",
      "router.push(destination);",
      "useShopifyNavigation(router);"
    ],
    "closesSurfaceIds": [
      "shopify-browser-navigation"
    ]
  },
  {
    "version": 1,
    "slug": "shopify-head-document-bootstrap",
    "description": "Detects the public Shopify document-head bootstrap component and its package entry-point exports.",
    "noiseTier": "precise",
    "filePatterns": [
      "packages/react/src/ShopifyHead.tsx",
      "packages/react/src/index.ts",
      "packages/next/src/index.ts"
    ],
    "patterns": [
      {
        "source": "<meta\\s+[^>]*name=[\"']shopify-api-key[\"']",
        "label": "Shopify API key metadata"
      },
      {
        "source": "<script\\s+[^>]*src=[\"']https://cdn\\.shopify\\.com/",
        "label": "Fixed Shopify CDN bootstrap script"
      },
      {
        "source": "\\bexport\\s+(?:\\{[^}\\n]*\\bShopifyHead\\b[^}\\n]*\\}|\\*\\s+from\\s+[\"'][^\"'\\n]*ShopifyHead[^\"'\\n]*[\"'])",
        "label": "ShopifyHead public package export"
      }
    ],
    "examples": [
      "<meta name=\"shopify-api-key\" content={apiKey} />",
      "<script src=\"https://cdn.shopify.com/shopifycloud/app-bridge.js\" />",
      "export {ShopifyHead} from \"@shopify/shopify-app-react-router/react\";"
    ],
    "closesSurfaceIds": [
      "shopify-document-bootstrap"
    ]
  },
  {
    "version": 1,
    "slug": "shopify-navigation-url-normalizer",
    "description": "Detects Shopify navigation helpers that validate URLs, enforce same-origin navigation, and normalize destinations to path-only values.",
    "noiseTier": "precise",
    "filePatterns": [
      "packages/react/src/hooks/utils.ts"
    ],
    "requires": {
      "sentinelFiles": [
        "packages/react/src/hooks/use-shopify-navigation.ts",
        "packages/next/src/AppProvider.tsx"
      ]
    },
    "patterns": [
      {
        "source": "URL\\.canParse\\s*\\([^\\r\\n]+\\)[\\s\\S]{0,1000}\\burl\\.origin\\b[\\s\\S]{0,1000}\\burl\\.pathname\\b[\\s\\S]{0,160}\\burl\\.search\\b[\\s\\S]{0,160}\\burl\\.hash\\b",
        "label": "same-origin Shopify navigation URL normalization"
      }
    ],
    "examples": [
      "if (URL.canParse(destination)) {\n  const url = new URL(destination);\n  if (url.origin === window.location.origin) {\n    return `${url.pathname}${url.search}${url.hash}`;\n  }\n}"
    ],
    "closesSurfaceIds": [
      "shopify-browser-navigation"
    ]
  }
];

export const generatedMatchersPlugin: DeepsecPlugin = {
  name: "deepsec-generated-matchers",
  matchers: compileDeclarativeMatchers(specs),
};
