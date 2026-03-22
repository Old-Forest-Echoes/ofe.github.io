import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
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
      globals: {
        URL: 'readonly',
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    // Astro frontmatter uses ambient types (ImageMetadata, etc.) provided by astro/client
    files: ['**/*.astro'],
    rules: {
      'no-undef': 'off',
    },
  },
  {
    ignores: ['dist/', '.astro/'],
  },
);
