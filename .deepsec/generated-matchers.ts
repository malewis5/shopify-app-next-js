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
  }
];

export const generatedMatchersPlugin: DeepsecPlugin = {
  name: "deepsec-generated-matchers",
  matchers: compileDeclarativeMatchers(specs),
};
