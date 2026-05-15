/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "web",
        "db",
        "ui",
        "shared",
        "templates",
        "messaging",
        "ai",
        "storage",
        "analytics",
        "i18n",
        "docker",
        "ci",
        "docs",
        "deps",
      ],
    ],
  },
};
