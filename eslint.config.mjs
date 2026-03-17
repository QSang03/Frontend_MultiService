import nextCore from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...(nextCore.default ?? nextCore),
  ...(nextTs.default ?? nextTs),
  { ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", "**/*.js"] },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default config;