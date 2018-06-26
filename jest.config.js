
module.exports = {
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    testRegex: "(/tests/.*|(\\.|/)(test|spec))\\.(tsx?)$",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    collectCoverageFrom: [
        "src/**/*.ts",
        '!**/*.d.ts',
        "!**/node_modules/**"
    ],
    reporters: [ "default", [ "jest-junit", { output: "tests/reports/unit/junit.xml" } ] ],
    coverageDirectory: 'tests/reports/coverage',
    coverageReporters: [
        "cobertura"
    ],
    bail: true,
    coverageThreshold: {
      global: {
        branches: 60,
        functions: 60,
        lines: 60,
        statements: 60
      }
    }
};