const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/__tests__/helpers/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

const nextJestConfig = createJestConfig(customJestConfig);

module.exports = async () => {
  const config = await nextJestConfig();

  return {
    ...config,
    transformIgnorePatterns: [
      "/node_modules/(?!.pnpm)(?!(geist|next-intl|use-intl|@formatjs|intl-messageformat|icu-minify|@schummar)/)",
      "/node_modules/.pnpm/(?!(geist|next-intl|use-intl|@formatjs|intl-messageformat|icu-minify|@schummar))",
      "^.+\\.module\\.(css|sass|scss)$",
    ],
  };
};
