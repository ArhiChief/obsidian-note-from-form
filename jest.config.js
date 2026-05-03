module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    moduleNameMapper: {
        "^obsidian$": "<rootDir>/__mocks__/obsidian.ts",
        "^src/(.*)$": "<rootDir>/src/$1",
    },
};
