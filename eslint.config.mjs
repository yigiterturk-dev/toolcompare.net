import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  /*
    app.js (npm start ile calisan uretim sunucusu) ve generate-tools.js
    bilerek CommonJS Node betikleri; Next uygulamasinin ESM/TS kodunun
    parcasi degiller. TypeScript kaynakli `no-require-imports` kurali
    onlar icin anlamsiz -- app.js'i ESM'e cevirmek uretim baslangicini
    riske atardi, kurali susturmak dogru cevap.
  */
  {
    files: ["app.js", "generate-tools.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
