const nxPreset = require('@nrwl/jest/preset').default;

export default {
  displayName: 'terraform-cdk-e2e',
  preset: '@blueground/jest-testcontainers',
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
  ...nxPreset,
};
