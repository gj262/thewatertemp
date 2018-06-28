module.exports = {
  extends: ["eslint:recommended"],
  env: {
    browser: true,
    mocha: true
  },
  rules: {
    "no-console": "off",
    "space-before-function-paren": "off",
    semi: "off",
    quotes: ["error", "double"],
    "max-len": [2, 130, 4, { ignoreUrls: true }]
  }
};
