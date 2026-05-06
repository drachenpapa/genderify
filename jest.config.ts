import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: {
                rootDir: './src',
                outDir: './dist',
                noEmit: false,
                ignoreDeprecations: '6.0',
            },
        }],
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    testMatch: [
        "**/__tests__/**/*.test.[jt]s?(x)",
        "**/?(*.)+(spec|test).[jt]s?(x)"
    ],
};

export default config;
