import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypeScript from "eslint-config-next/typescript"

/**
 * Flat ESLint config for ESLint 9.
 *
 * The `lint` script existed but ESLint was never installed and there was no
 * config file, so `pnpm lint` failed on every fresh clone of the repository.
 *
 * `eslint-config-next` v16 ships flat configs directly, so no `FlatCompat`
 * shim is needed.
 */
const config = [
  {
    ignores: [
      ".next/**",
      ".cache/**",
      "out/**",
      "node_modules/**",
      ".content-sources/**",
      ".private-vault/**",
      "generated/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      // Underscore-prefixed parameters are intentional placeholders.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Downgraded from `error` to `warn`, deliberately.
      //
      // `react-hooks/set-state-in-effect` fires on the "hydrate persisted UI
      // state after mount" and "sync React state with the DOM" patterns, which
      // are legitimate here (theme, language, reading preferences, mounted
      // flags). The proper long-term fix is `useSyncExternalStore`, which
      // `lib/scroll-store.ts` already demonstrates; the remaining call sites
      // are tracked as warnings so they stay visible without breaking CI.
      "react-hooks/set-state-in-effect": "warn",

      // `any` appears in a few pre-existing spots (markdown token rendering,
      // decrypted payload shapes). Warn so new occurrences are still noticed.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]

export default config
