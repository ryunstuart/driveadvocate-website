import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { sendClientUpdate } from './functions/sendClientUpdate/resource';
import { syncVehicleCatalog } from './functions/syncVehicleCatalog/resource';
import { searchDealInventory } from './functions/searchDealInventory/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth,
  data,
  sendClientUpdate,
  syncVehicleCatalog,
  searchDealInventory,
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
  actions: ['cognito-idp:AdminListGroupsForUser'],
  resources: [userPoolArn],
}));

const unauthRole = backend.auth.resources.unauthenticatedUserIamRole;
unauthRole.addToPrincipalPolicy(new PolicyStatement({
  actions: ['cognito-idp:AdminListGroupsForUser'],
  resources: [userPoolArn],
}));
