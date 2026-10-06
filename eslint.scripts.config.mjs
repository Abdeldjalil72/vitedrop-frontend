import { defineConfig } from "eslint/config";
import baseConfig from "./eslint.config.mjs";

export default defineConfig([
  ...baseConfig,
  {
    files: ["scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
