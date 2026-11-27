import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      ".wrangler/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
      "scratch/**",
      "worker-entry.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@next/next/no-img-element": "off",
      // eslint-plugin-react-hooks v6 (React Compiler) flags the prop→state sync
      // pattern used by the invitation templates; fix dần, chưa chặn CI.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
