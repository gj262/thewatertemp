module.exports = {
  extends: "standard",
  env: {
    browser: true
  },
  rules: {
    "space-before-function-paren": "off",
    semi: "off",
    quotes: ["error", "double"],
    "max-len": [2, 130, 4, { ignoreUrls: true }]
  }
};
