import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { sendClientUpdate } from './functions/sendClientUpdate/resource';
import { syncVehicleCatalog } from './functions/syncVehicleCatalog/resource';
import { searchDealInventory } from './functions/searchDealInventory/resource';
import { calcomWebhook } from './functions/calcomWebhook/resource';
import { sendEnrollment } from './functions/sendEnrollment/resource';
import { confirmClientSignup } from './functions/confirmClientSignup/resource';
import { getPendingCall } from './functions/getPendingCall/resource';
import { getCallsByDate } from './functions/getCallsByDate/resource';
import { getCallById } from './functions/getCallById/resource';
import { updateCall } from './functions/updateCall/resource';
import { getCatalog } from './functions/getCatalog/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';
import { CfnOutput } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  sendClientUpdate,
  syncVehicleCatalog,
  searchDealInventory,
  calcomWebhook,
  sendEnrollment,
  confirmClientSignup,
  getPendingCall,
  getCallsByDate,
  getCallById,
  updateCall,
  getCatalog,
});

// --- sendClientUpdate permissions ---

const dealTable = Object.values(backend.data.resources.tables).find(
  (table) => table.tableName.includes('Deal-')
);

if (dealTable) {
  backend.sendClientUpdate.addEnvironment('DEAL_TABLE_NAME', dealTable.tableName);
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
  backend.sendClientUpdate.addEnvironment('CLIENT_TABLE_NAME', clientTable.tableName);
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

// --- syncVehicleCatalog permissions ---

backend.syncVehicleCatalog.addEnvironment('VEHICLE_CATALOG_TABLE', 'VehicleCatalog');

backend.syncVehicleCatalog.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:PutItem', 'dynamodb:BatchWriteItem'],
    resources: ['arn:aws:dynamodb:us-east-1:870924848445:table/VehicleCatalog'],
  }),
);

backend.syncVehicleCatalog.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:PutItem', 'dynamodb:GetItem'],
    resources: ['arn:aws:dynamodb:us-east-1:870924848445:table/SyncCheckpoints'],
  }),
);

backend.syncVehicleCatalog.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ssm:GetParameter', 'ssm:PutParameter'],
    resources: ['arn:aws:ssm:us-east-1:870924848445:parameter/driveadvocate/*'],
  }),
);

// --- searchDealInventory permissions ---

backend.searchDealInventory.addEnvironment('DEAL_INVENTORY_TABLE', 'DealInventory');

if (dealTable) {
  backend.searchDealInventory.addEnvironment('DEAL_TABLE_NAME', dealTable.tableName);
  backend.searchDealInventory.resources.lambda.addToRolePolicy(
    new PolicyStatement({
      actions: ['dynamodb:Scan'],
      resources: [dealTable.tableArn],
    }),
  );
}

const vpTable = Object.values(backend.data.resources.tables).find(
  (table) => table.tableName.includes('VehiclePreference-')
);
if (vpTable) {
  backend.searchDealInventory.addEnvironment('VP_TABLE_NAME', vpTable.tableName);
  backend.searchDealInventory.resources.lambda.addToRolePolicy(
    new PolicyStatement({
      actions: ['dynamodb:Scan'],
      resources: [vpTable.tableArn],
    }),
  );
}

backend.searchDealInventory.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:Scan', 'dynamodb:Query'],
    resources: ['arn:aws:dynamodb:us-east-1:870924848445:table/DealInventory'],
  }),
);

backend.searchDealInventory.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ssm:GetParameter'],
    resources: ['arn:aws:ssm:us-east-1:870924848445:parameter/driveadvocate/*'],
  }),
);

// --- SSR API route permissions (Cognito group lookup) ---

const userPoolArn = `arn:aws:cognito-idp:us-east-1:870924848445:userpool/${backend.auth.resources.userPool.userPoolId}`;

const authRole = backend.auth.resources.authenticatedUserIamRole;
authRole.addToPrincipalPolicy(new PolicyStatement({
  actions: ['cognito-idp:AdminListGroupsForUser', 'cognito-idp:AdminConfirmSignUp'],
  resources: [userPoolArn],
}));

const unauthRole = backend.auth.resources.unauthenticatedUserIamRole;
unauthRole.addToPrincipalPolicy(new PolicyStatement({
  actions: ['cognito-idp:AdminListGroupsForUser', 'cognito-idp:AdminConfirmSignUp'],
  resources: [userPoolArn],
}));

// --- SSR API route permissions (standalone DynamoDB tables) ---

const standaloneTables = [
  'arn:aws:dynamodb:us-east-1:870924848445:table/VehicleCatalog',
  'arn:aws:dynamodb:us-east-1:870924848445:table/DealInventory',
  'arn:aws:dynamodb:us-east-1:870924848445:table/Incentives',
  'arn:aws:dynamodb:us-east-1:870924848445:table/SyncCheckpoints',
  'arn:aws:dynamodb:us-east-1:870924848445:table/PendingCalls',
  'arn:aws:dynamodb:us-east-1:870924848445:table/OnboardingTokens',
];

// --- calcomWebhook permissions ---

backend.calcomWebhook.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:GetItem'],
    resources: ['arn:aws:dynamodb:us-east-1:870924848445:table/PendingCalls'],
  }),
);

const calcomFnUrl = backend.calcomWebhook.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [HttpMethod.ALL],
    allowedHeaders: ['*'],
  },
});

new CfnOutput(backend.calcomWebhook.resources.lambda.stack, 'CalcomWebhookUrl', {
  value: calcomFnUrl.url,
});

// --- sendEnrollment permissions ---

backend.sendEnrollment.addEnvironment('ENROLLMENT_BASE_URL', 'https://driveadvocate.com');

backend.sendEnrollment.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:GetItem'],
    resources: [
      'arn:aws:dynamodb:us-east-1:870924848445:table/PendingCalls',
      'arn:aws:dynamodb:us-east-1:870924848445:table/OnboardingTokens',
    ],
  }),
);

backend.sendEnrollment.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*'],
  }),
);

authRole.addToPrincipalPolicy(new PolicyStatement({
  actions: ['dynamodb:Scan', 'dynamodb:Query', 'dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:DeleteItem'],
  resources: standaloneTables,
}));

unauthRole.addToPrincipalPolicy(new PolicyStatement({
  actions: ['dynamodb:Scan', 'dynamodb:Query', 'dynamodb:GetItem'],
  resources: standaloneTables,
}));

// --- confirmClientSignup permissions ---

backend.getPendingCall.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:Scan'],
    resources: ['arn:aws:dynamodb:us-east-1:870924848445:table/PendingCalls'],
  }),
);

backend.getCallsByDate.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:Scan'],
    resources: ['arn:aws:dynamodb:us-east-1:870924848445:table/PendingCalls'],
  }),
);

backend.getCallById.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:GetItem'],
    resources: ['arn:aws:dynamodb:us-east-1:870924848445:table/PendingCalls'],
  }),
);

backend.updateCall.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:UpdateItem'],
    resources: ['arn:aws:dynamodb:us-east-1:870924848445:table/PendingCalls'],
  }),
);

backend.getCatalog.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:Scan'],
    resources: ['arn:aws:dynamodb:us-east-1:870924848445:table/VehicleCatalog'],
  }),
);

backend.confirmClientSignup.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['cognito-idp:AdminConfirmSignUp', 'cognito-idp:AdminUpdateUserAttributes'],
    resources: ['arn:aws:cognito-idp:us-east-1:870924848445:userpool/us-east-1_mBhomQZzY'],
  }),
);
