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
    indent: ["error", 2, { "SwitchCase": 0 }],
    '@typescript-eslint/indent': ['error', 2, { "SwitchCase": 0 }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-loop-func": "off"
  }
};
