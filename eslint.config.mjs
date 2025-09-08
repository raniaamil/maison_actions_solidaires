// eslint.config.mjs
import { dirname as pathDirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

