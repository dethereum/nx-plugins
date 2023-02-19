export interface DeployExecutorSchema {
  buildTargets?: Array<{
    project: string;
    target: string;
    configuration?: string;
  }>;
  stack?: string | string[];
  autoApprove?: boolean;
}
