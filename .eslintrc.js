module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
  },
  extends: ["eslint:recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    // Reglas básicas
    "no-console": "off", // Permitir console.log para logging del servidor
    "no-debugger": "error",
    "no-unused-vars": "off", // Desactivado porque @typescript-eslint/no-unused-vars lo maneja
    "prefer-const": "error",
    "no-var": "error",

    // TypeScript específicas
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-explicit-any": "off", // Permitir any para flexibilidad
    "@typescript-eslint/no-non-null-assertion": "warn",

    // Reglas de formato
    indent: ["error", 2],
    quotes: ["error", "single"],
    semi: ["error", "always"],
    "comma-dangle": ["error", "always-multiline"],
    "object-curly-spacing": ["error", "always"],
    "array-bracket-spacing": ["error", "never"],

    // Reglas específicas del proyecto
    "no-eval": "off", // Permitir eval para la calculadora (funcionalidad intencional)
  },
  ignorePatterns: ["dist/", "node_modules/", "*.js", "*.mjs"],
};
