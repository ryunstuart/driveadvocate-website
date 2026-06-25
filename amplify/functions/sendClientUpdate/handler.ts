import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const ses = new SESClient({ region: 'us-east-1' });
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

const STATUS_DISPLAY: Record<string, string> = {
  'New': 'New',
  'InProgress': 'In Progress',
  'FollowUp': 'Follow Up',
  'OfferReceived': 'Offer Received',
  'Complete': 'Complete',
  'Dead': 'Closed',
};

export const handler = async (event: any) => {
  const { dealId, message, advocateName } = event.arguments;

  try {
    const tableName = process.env.DEAL_TABLE_NAME;
    if (!tableName) {
      return { success: false, error: 'Deal table not configured' };
    }

    const result = await db.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: 'id = :id',
      ExpressionAttributeValues: { ':id': dealId },
      Limit: 1,
    }));

    const deal = result.Items?.[0];
    if (!deal) {
      return { success: false, error: 'Deal not found' };
    }

    const clientEmail = deal.clientEmail;
    const clientName = deal.clientName || 'there';
    const dealStatus = STATUS_DISPLAY[deal.status || 'New'] || deal.status || 'New';

    if (!clientEmail) {
      return { success: false, error: 'No client email on file' };
    }

    const clientTableName = process.env.CLIENT_TABLE_NAME;
    if (clientTableName) {
      const clientResult = await db.send(new ScanCommand({
        TableName: clientTableName,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': clientEmail },
        Limit: 1,
      }));
      const clientRecord = clientResult.Items?.[0];
      if (clientRecord?.emailNotifications === false) {
        return { success: true, error: null };
      }
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0f172a; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">DriveAdvocate</h1>
          <p style="color: #94a3b8; margin: 4px 0 0;">Update on your deal</p>
        </div>
        <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 8px 8px;">
          <p style="color: #334155; font-size: 16px;">Hi ${clientName},</p>
          <p style="color: #334155; font-size: 16px; white-space: pre-line;">${message}</p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">Deal Status</p>
            <p style="margin: 4px 0 0; color: #059669; font-weight: bold; font-size: 18px;">${dealStatus}</p>
          </div>
          <p style="color: #64748b; font-size: 14px;">Questions? Reply to this email or contact us at info@driveadvocate.com</p>
          <p style="color: #334155; font-size: 14px; margin-top: 24px;">&mdash; ${advocateName || 'Your DriveAdvocate Team'}</p>
        </div>
      </div>
    `;

    const textBody = `Hi ${clientName},\n\n${message}\n\nDeal Status: ${dealStatus}\n\nQuestions? Contact us at info@driveadvocate.com\n\n— ${advocateName || 'DriveAdvocate'}`;

    await ses.send(new SendEmailCommand({
      Source: 'updates@driveadvocate.com',
      Destination: { ToAddresses: [clientEmail] },
      Message: {
        Subject: { Data: 'Update on your DriveAdvocate deal' },
        Body: {
          Html: { Data: emailHtml },
          Text: { Data: textBody },
        },
      },
    }));

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Email send failed:', err);
    return { success: false, error: err.message };
  }
};
