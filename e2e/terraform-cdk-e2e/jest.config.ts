const nxPreset = require('@nrwl/jest/preset').default;

export default {
  displayName: 'terraform-cdk-e2e',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/e2e/terraform-cdk-e2e',
  // When testing Github actions workflows ensure jest-testcontainers does not start from within docker
  // Run `docker compose up -d --build` before act command
  ...(process.env.ACT ? {} : { preset: '@blueground/jest-testcontainers' }),
  ...nxPreset,
};
