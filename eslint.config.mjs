// @ts-check
import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import nodePlugin from 'eslint-plugin-n';
import pluginPromise from 'eslint-plugin-promise';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default tseslint.config(
  // Base configurations
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,

  // Plugin configurations
  nodePlugin.configs['flat/recommended'],
  eslintPluginUnicorn.configs['recommended'],
  pluginPromise.configs['flat/recommended'],
  security.configs['recommended'],
  sonarjs.configs['recommended'],

  // Global language options
  {
    name: 'Global Language Options',
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    name: 'Global Ignores',
    ignores: [
      ...(includeIgnoreFile(gitignorePath).ignores ?? []),
      '/.cache',
      '/.git',
      '/.husky',
      '/.yarn',
      'dist/**',
      'build/**',
      'coverage/**',
      '.dependency-cruiser.js',
      'cucumber.setup.js',
      'eslint.config.mjs',
      '**/*.d.ts',
    ],
  },
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    name: 'Security and Code Quality',
    rules: {
      // Security rules - important for backend APIs
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',

      // SonarJS rules - code quality and bug prevention
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-duplicate-string': ['warn', { threshold: 3 }],
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-small-switch': 'error',
      'sonarjs/prefer-immediate-return': 'warn',
      'sonarjs/prefer-object-literal': 'warn',
      'sonarjs/prefer-single-boolean-return': 'warn',
      'sonarjs/no-nested-template-literals': 'warn',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/no-unused-collection': 'error',
      'sonarjs/no-useless-catch': 'error',
      'sonarjs/todo-tag': 'off',
      'sonarjs/no-commented-code': 'off',
      'sonarjs/function-return-type': 'off',
      'sonarjs/no-empty-test-file': 'off',
      'sonarjs/no-alphabetical-sort': 'off',
    },
  },
  {
    name: 'TypeScript Rules',
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',
      'n/prefer-global/process': 'error',
      'n/prefer-global/buffer': 'error',
      'n/prefer-promises/dns': 'error',
      'n/prefer-promises/fs': 'error',
      'promise/prefer-await-to-then': 'warn',
      'promise/prefer-await-to-callbacks': 'warn',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-null': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/no-array-reduce': 'off',
    },
  },
  {
    name: 'Test Files',
    files: [
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/test/**/*.ts',
      '**/tests/**/*.ts',
    ],
    rules: {
      'sonarjs/no-duplicate-string': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'unicorn/no-null': 'off',
    },
  },
  {
    name: 'Configuration Files',
    files: ['*.config.{js,ts,mjs}', '.*.{js,ts,mjs}', './scripts/**/*'],
    rules: {
      'unicorn/prefer-module': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  eslintConfigPrettier,
);
