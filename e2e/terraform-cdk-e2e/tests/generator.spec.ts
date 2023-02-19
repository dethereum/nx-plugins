import {
  checkFilesExist,
  ensureNxProject,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';

describe.skip('terraform-cdk init-standalone generator', () => {
  // Setting up individual workspaces per
  // test can cause e2e runs to take a long time.
  // For this reason, we recommend each suite only
  // consumes 1 workspace. The tests should each operate
  // on a unique project in the workspace, such that they
  // are not dependant on one another.
  beforeAll(() => {
    ensureNxProject(
      '@dethereum/nx-terraform-cdk',
      'dist/packages/terraform-cdk'
    );
  });

  afterAll(() => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    runNxCommandAsync('reset');
  });

  it('generates the files needed for a working terraform cdk project', async () => {
    const FILES = [
      '.eslintrc.json',
      'cdktf.json',
      'jest.config.js',
      'main.ts',
      'package.json',
      'setup.js',
      'tsconfig.json',
      '__tests__/main-test.ts',
    ] as const;

    const project = uniq('terraform-cdk');
    const expectedFiles = FILES.map((file) => `apps/${project}/${file}`);

    await runNxCommandAsync(
      `generate @dethereum/nx-terraform-cdk:init-standalone ${project}`
    );

    expect(() => checkFilesExist(...expectedFiles)).not.toThrow();
  }, 120000);
});
