// apps/api/jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',

  // Use ts-jest and point it at the app tsconfig (decorators, class fields)
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: 'apps/api/tsconfig.app.json',
        isolatedModules: false,
        diagnostics: false
      }
    ]
  },

  moduleFileExtensions: ['ts', 'js', 'json'],
  testRegex: '.*\\.spec\\.ts$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Ensure reflect-metadata is loaded before tests run
  setupFiles: ['reflect-metadata'],

  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/**/index.ts'],
  coverageDirectory: '../../coverage/apps/api'
};

export default config;
