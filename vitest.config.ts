import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"]
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
      // `server-only` throws outside a React Server environment; stub it so
      // server modules can be imported in unit tests.
      "server-only": new URL("./src/test/server-only-stub.ts", import.meta.url).pathname
    }
  }
});
