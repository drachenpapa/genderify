/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFiles: ['./src/__tests__/setup.ts'],
  transform: {
    '^.+\\.ts$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)']
};

module.exports = config;
