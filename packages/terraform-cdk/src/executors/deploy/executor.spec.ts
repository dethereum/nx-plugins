import executor from './executor';

jest.mock('@expo/spawn-async', () => {
  const original = jest.requireActual('@expo/spawn-async');
  return {
    __esModule: true,
    default: jest
      .fn(original.default)
      .mockImplementation(() => ({ status: 0 })),
  };
});

const setupContext = (projectName: string) => ({
  root: '',
  cwd: '',
  isVerbose: false,
  projectName,
  workspace: {
    projects: {
      [projectName]: {
        root: '/Users',
      },
    },
    version: 0,
  },
});

describe('Deploy Executor', () => {
  it('can run', async () => {
    const projectName = 'terraform-cdk-mock-stack';

    const output = await executor(
      { stack: projectName },
      setupContext(projectName)
    );

    expect(output.success).toBe(true);
  });
});
