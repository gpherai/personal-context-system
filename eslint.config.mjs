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
      "react-hooks/error-boundaries": "off"
    }
  }
];

export default config;
