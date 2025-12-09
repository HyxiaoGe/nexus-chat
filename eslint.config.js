import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['dist', 'node_modules', '*.config.js', '*.config.ts', 'api/**/*'],
  },

  // Base JavaScript rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // React rules
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // React Refresh rules
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Customize TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',

      // React rules customization
      'react/prop-types': 'off', // TypeScript handles this
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    },
  },

  // Prettier config (disables conflicting rules)
  prettierConfig
);
