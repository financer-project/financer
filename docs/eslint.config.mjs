import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [".vitepress/**/*.{ts,mts}"],
  },
  {
    ignores: [
      "node_modules",
      ".vitepress/cache",
      ".vitepress/dist",
    ],
  },
);
