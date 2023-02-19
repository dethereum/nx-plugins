import type { ExecutorContext } from '@nrwl/devkit';
import spawn from '@expo/spawn-async';

import type { DeployExecutorSchema } from './schema';

export default async function runExecutor(
  options: DeployExecutorSchema,
  context: ExecutorContext
) {
  if (!context.projectName) {
    throw new Error('No projectName');
  }

  const infrastructureRoot =
    context.workspace.projects[context.projectName]?.root;

  if (!infrastructureRoot) {
    console.error(`Error: Cannot find root for ${context.projectName}.`);
    return {
      success: false,
    };
  }

  if (!options.stack) {
    throw new Error(
      'No stack name provided, use --stack to provide stack name'
    );
  }

  const cdktfArgs = [
    'deploy',
    ...(options.autoApprove ? ['--auto-approve'] : []),
    typeof options.stack == 'string' ? options.stack : options.stack.join(' '),
  ];

  const cdktf = spawn('cdktf', cdktfArgs, {
    cwd: infrastructureRoot,
    stdio: [process.stdin, process.stdout, process.stderr],
  });

  try {
    const res = await cdktf;
    if (res.status !== 0) return { success: false };
  } catch (e) {
    console.log('catch -> e', e.message);
    return { success: false };
  }

  return {
    success: true,
  };
}
