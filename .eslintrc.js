module.exports = {
  root: true,
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/triple-slash-reference': 'off',
    'react/no-unescaped-entities': 'off',
    'react/jsx-key': 'error',
  },
  ignorePatterns: [
    'dist/',
    '.next/',
    'node_modules/',
    'next-env.d.ts',
    '*.d.ts',
  ],
};
