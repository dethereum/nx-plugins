import {
  ensureNxProject,
  runNxCommandAsync,
  updateFile,
  runCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';

import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

const setupProjectJson = (project: string) => `{
  "name": "${project}",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/${project}/src",
  "targets": {
    "deploy": {
      "executor": "@dethereum/nx-terraform-cdk:deploy",
      "options": {
        "buildTargets": [],
        "stack": "${project}",
        "autoApprove": true,
        "preferLocal": true
      }
    }
  },
  "tags": []
}
`;

const setupStack = (props: {
  project: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
}) => `
import { Construct } from 'constructs';
import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket"

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "mock", {
      region: 'us-east-1',
      accessKey: "${props.accessKeyId}",
      secretKey: "${props.secretAccessKey}",
      s3UsePathStyle: true,
      skipCredentialsValidation: true,
      skipMetadataApiCheck: "true",
      skipRequestingAccountId: true,
      endpoints: [{
        s3: "http://localhost:4566"
      }]
    })

    const bucket = new S3Bucket(this, 'aws_s3_bucket', {
      bucket: "${props.bucketName}",
    });
  }
}

const app = new App();
new MyStack(app, '${props.project}');
app.synth();
`;

describe('terraform-cdk deploy executor', () => {
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

  it('can successfully deploy to localstack', async () => {
    const project = uniq('terraform-cdk');
    const credentials = {
      accessKeyId: 'fake',
      secretAccessKey: 'fake',
    };

    const expectedBucketName = 'mock-bucket';

    const s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: 'http://localhost:4566',
      forcePathStyle: true,
      credentials,
    });

    await runNxCommandAsync(
      `generate @dethereum/nx-terraform-cdk:init-standalone ${project}`
    );

    await runCommandAsync(
      'pnpm add constructs cdktf cdktf-cli @cdktf/provider-aws'
    );

    updateFile(`apps/${project}/project.json`, setupProjectJson(project));
    updateFile(
      `apps/${project}/main.ts`,
      setupStack({ project, bucketName: expectedBucketName, ...credentials })
    );

    await runNxCommandAsync(`run ${project}:deploy`);

    const list = await s3Client.send(new ListBucketsCommand({}));

    expect(list?.Buckets?.[0].Name).toEqual(expectedBucketName);
  }, 120000);
});
