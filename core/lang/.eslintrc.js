"use strict";

module.exports = {
  extends: ['plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    semi: [2, "never"],
    quotes: ["error", "double", { "allowTemplateLiterals": true }],
    indent: ['error', 2, { SwitchCase: 1, VariableDeclarator: 1, MemberExpression: 'off' }],
    '@typescript-eslint/indent': ['error', 2],
    "@typescript-eslint/explicit-function-return-type": "off"
  }
};
