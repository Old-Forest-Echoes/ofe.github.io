import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      'no-console': 'warn',
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      globals: globals.nodeBuiltin,
    },
  },
  {
    // typescript-eslint disables no-undef for .ts files, but eslint-plugin-astro's
    // parser does not get the same treatment — Astro frontmatter uses ambient types
    // (ImageMetadata, etc.) from astro/client.d.ts that trigger false positives.
    files: ['**/*.astro'],
    rules: {
      'no-undef': 'off',
    },
  },
  {
    ignores: ['dist/', '.astro/'],
  },
];
