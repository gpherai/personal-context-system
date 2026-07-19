import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      ".next/**",
      "coverage/**",
      "data/**",
      "node_modules/**",
      "src/generated/**"
    ]
  },
  ...nextVitals,
  ...nextTypescript,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/error-boundaries": "off",
      // Server actions and react-markdown component overrides receive
      // positional arguments they must accept but never use. The codebase
      // already marks those with a leading underscore — honour that instead
      // of reporting each one.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_"
        }
      ]
    }
  }
];

export default config;
