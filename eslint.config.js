// eslint.config.js

const pluginReact = require('eslint-plugin-react');
const pluginReactHooks = require('eslint-plugin-react-hooks');
const pluginJsxA11y = require('eslint-plugin-jsx-a11y');
const pluginPrettier = require('eslint-plugin-prettier');
const pluginImport = require('eslint-plugin-import');
const parserTypeScript = require('@typescript-eslint/parser');
const pluginTypeScript = require('@typescript-eslint/eslint-plugin');

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    ignores: ['eslint.config.js', 'src/index.js', 'scripts/eslint.js'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: parserTypeScript,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': pluginTypeScript,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      sourceType: 'module',
    },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'jsx-a11y': pluginJsxA11y,
      prettier: pluginPrettier,
      import: pluginImport,
    },
    rules: {
      'prettier/prettier': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-multiple-empty-lines': ['warn', { max: 1, maxEOF: 0 }],
    },
  },
];
