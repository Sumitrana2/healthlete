import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "..",
  testEnvironment: "node",
  testRegex: ".e2e-spec.ts$",
  setupFiles: ["<rootDir>/test/setup-env.ts"],
  transformIgnorePatterns: ["/node_modules/(?!(jose)/)"],
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
};

export default config;
