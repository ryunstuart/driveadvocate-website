import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { sendClientUpdate } from './functions/sendClientUpdate/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth,
  data,
  sendClientUpdate,
});

const dealTable = Object.values(backend.data.resources.tables).find(
  (table) => table.tableName.includes('Deal-')
);

if (dealTable) {
  backend.sendClientUpdate.addEnvironment(
    'DEAL_TABLE_NAME',
    dealTable.tableName,
  );
  backend.sendClientUpdate.resources.lambda.addToRolePolicy(
    new PolicyStatement({
      actions: ['dynamodb:Scan', 'dynamodb:GetItem'],
      resources: [dealTable.tableArn],
    }),
  );
}

const clientTable = Object.values(backend.data.resources.tables).find(
  (table) => table.tableName.includes('Client-')
);

if (clientTable) {
  backend.sendClientUpdate.addEnvironment(
    'CLIENT_TABLE_NAME',
    clientTable.tableName,
  );
  backend.sendClientUpdate.resources.lambda.addToRolePolicy(
    new PolicyStatement({
      actions: ['dynamodb:Scan'],
      resources: [clientTable.tableArn],
    }),
  );
}

backend.sendClientUpdate.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*'],
  }),
);
