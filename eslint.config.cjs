const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['src/**/*.ts'],
    ignores: ['dist/**', 'node_modules/**', '**/*.test.ts'],
    languageOptions: {
      parser: tsparser,
      globals: {
        process:    'readonly',
        console:    'readonly',
        Buffer:     'readonly',
        __dirname:  'readonly',
        __filename: 'readonly',
      },
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-console':                              'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any':      'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      'prefer-const':                            'error',
      'no-var':                                  'error',
    },
  },
];