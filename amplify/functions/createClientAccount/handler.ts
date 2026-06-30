import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = 'us-east-1_mBhomQZzY';

export const handler = async (event: any) => {
  const { email, password, firstName, lastName, phone } = event.arguments;
  console.log('createClientAccount for:', email);

  try {
    await cognito.send(new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
        ...(phone ? [{ Name: 'phone_number', Value: phone }] : []),
      ],
      MessageAction: 'SUPPRESS',
    }));

    await cognito.send(new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    }));

    console.log('Account created for:', email);
    return { success: true };
  } catch (err: any) {
    console.error('createClientAccount error:', err.name, err.message);
    return { success: false, error: err.message };
  }
};
