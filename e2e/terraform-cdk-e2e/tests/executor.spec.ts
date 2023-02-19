import {
  ensureNxProject,
  runNxCommandAsync,
  updateFile,
  runCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';

import * as AWS from 'aws-sdk';

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
        "autoApprove": true
      }
    }
  },
  "tags": []
}
`;

const setupStack = (project: string, bucketName: string) => `
import { Construct } from 'constructs';
import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket"

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "mock", {
      region: 'us-east-1',
      s3UsePathStyle: true,
      skipCredentialsValidation: true,
      skipMetadataApiCheck: "true",
      skipRequestingAccountId: true,
      endpoints: [{
        s3: "http://localhost:4566"
      }]
    })

    const bucket = new S3Bucket(this, 'aws_s3_bucket', {
      bucket: "${bucketName}",
    });
  }
}

const app = new App();
new MyStack(app, '${project}');
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
    const expectedBucketName = 'mock-bucket';

    const s3Client = new AWS.S3({
      region: 'us-east-1',
      endpoint: 'http://localhost:4566',
      s3ForcePathStyle: true,
    });

    await runNxCommandAsync(
      `generate @dethereum/nx-terraform-cdk:init-standalone ${project}`
    );

    await runCommandAsync('pnpm add constructs cdktf @cdktf/provider-aws');

    updateFile(`apps/${project}/project.json`, setupProjectJson(project));
    updateFile(
      `apps/${project}/main.ts`,
      setupStack(project, expectedBucketName)
    );

    await runNxCommandAsync(`run ${project}:deploy`);

    const list = await s3Client.listBuckets().promise();

    expect(list.Buckets![0].Name).toEqual(expectedBucketName);
  }, 120000);
});