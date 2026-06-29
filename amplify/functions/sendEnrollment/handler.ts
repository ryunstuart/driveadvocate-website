import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { randomUUID } from 'crypto';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }), {
  marshallOptions: { removeUndefinedValues: true },
});
const ses = new SESClient({ region: 'us-east-1' });

export const handler = async (event: any) => {
  const { callId, dealId } = event.arguments;

  try {
    const callResult = await db.send(new GetCommand({ TableName: 'PendingCalls', Key: { callId } }));
    const call = callResult.Item;
    if (!call) return { success: false, error: 'Call not found', token: null, enrollmentUrl: null };

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 72 * 3600000).toISOString();
    console.log('Token:', token, 'Expires:', expiresAt);

    await db.send(new PutCommand({
      TableName: 'OnboardingTokens',
      Item: {
        token, clientEmail: call.clientEmail, clientName: call.clientName,
        dealId, callId, expiresAt, used: false, usedAt: null,
        stripeSessionId: null, paymentStatus: 'pending',
        agreementAccepted: false, agreementAcceptedAt: null,
        agreementIpAddress: null, agreementVersion: 'v1.0-2026-06',
        createdAt: new Date().toISOString(),
      },
    }));

    await db.send(new UpdateCommand({
      TableName: 'PendingCalls', Key: { callId },
      UpdateExpression: 'SET enrollmentSent = :t, enrollmentSentAt = :a, updatedAt = :u',
      ExpressionAttributeValues: { ':t': true, ':a': new Date().toISOString(), ':u': new Date().toISOString() },
    }));

    const BASE_URL = process.env.ENROLLMENT_BASE_URL || 'https://driveadvocate.com';
    const enrollmentUrl = `${BASE_URL}/enroll/${token}`;
    console.log('Enrollment URL:', enrollmentUrl);
    const firstName = call.clientName.split(' ')[0];

    await ses.send(new SendEmailCommand({
      Source: 'updates@driveadvocate.com',
      ReplyToAddresses: ['info@driveadvocate.com'],
      Destination: { ToAddresses: [call.clientEmail] },
      Message: {
        Subject: { Data: 'Complete Your DriveAdvocate Enrollment' },
        Body: {
          Html: { Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0f172a; padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">DriveAdvocate</h1>
                <p style="color: #94a3b8; margin: 8px 0 0;">Your Voice at the Dealership Table</p>
              </div>
              <div style="background: #f8fafc; padding: 40px; border-radius: 0 0 12px 12px;">
                <h2 style="color: #0f172a; margin: 0 0 16px;">Hi ${firstName},</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.6;">Great talking with you! Complete your enrollment below to get started.</p>
                <div style="background: white; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">Your enrollment includes:</p>
                  <p style="margin: 4px 0; color: #0f172a;">✓ Review your deal summary</p>
                  <p style="margin: 4px 0; color: #0f172a;">✓ Sign your service agreement</p>
                  <p style="margin: 4px 0; color: #0f172a;">✓ Complete payment</p>
                </div>
                <a href="${enrollmentUrl}" style="display: block; background: #059669; color: white; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 18px; margin: 24px 0;">Complete My Enrollment →</a>
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">This link expires in 72 hours. Questions? Reply to this email.</p>
              </div>
            </div>
          ` },
          Text: { Data: `Hi ${firstName},\n\nComplete your DriveAdvocate enrollment:\n${enrollmentUrl}\n\nExpires in 72 hours.\n\n— DriveAdvocate` },
        },
      },
    }));

    return { success: true, token, enrollmentUrl, error: null };
  } catch (err: any) {
    console.error('sendEnrollment failed:', err);
    return { success: false, error: err.message, token: null, enrollmentUrl: null };
  }
};
