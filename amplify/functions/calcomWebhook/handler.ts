import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }), {
  marshallOptions: { removeUndefinedValues: true },
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json',
};

function toE164(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.startsWith('+')) return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  return `+1${trimmed.replace(/\D/g, '')}`;
}

export const handler = async (event: any) => {
  console.log('Received event:', JSON.stringify(event));

  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  const body = typeof event.body === 'string'
    ? JSON.parse(event.body || '{}')
    : (event.body || {});

  if (!body.triggerEvent) {
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ received: true, ping: true }) };
  }

  const { triggerEvent, payload } = body;
  console.log('Cal.com webhook:', triggerEvent, payload?.uid);
  console.log('Full payload:', JSON.stringify(payload));
  console.log('Responses:', JSON.stringify(payload?.responses));
  console.log('Custom inputs:', JSON.stringify(payload?.customInputs));
  console.log('Attendees:', JSON.stringify(payload?.attendees));

  try {
    switch (triggerEvent) {
      case 'BOOKING_CREATED': {
        const attendee = payload.attendees?.[0];
        if (!attendee) break;

        const rawPhone =
          payload.responses?.['Your Phone Number']?.value ||
          payload.customInputs?.['Your Phone Number'] ||
          attendee.phoneNumber ||
          payload.responses?.phone?.value ||
          '';
        console.log('Resolved phone:', rawPhone);

        await db.send(new PutCommand({
          TableName: 'PendingCalls',
          Item: {
            callId: payload.uid,
            clientName: attendee.name,
            clientEmail: attendee.email,
            clientPhone: toE164(rawPhone),
            clientZip: payload.responses?.zip?.value || '',
            clientAddress: '',
            clientCity: '',
            clientState: '',
            scheduledAt: payload.startTime,
            duration: payload.eventDuration || 30,
            status: 'scheduled',
            advocateId: 'ryun@driveadvocate.com',
            dealId: null,
            calcomEventUrl: payload.eventTypeUrl || '',
            calcomMeetingUrl: payload.metadata?.videoCallUrl || '',
            notes: '',
            enrollmentSent: false,
            enrollmentSentAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }));
        console.log(`Created PendingCall for ${attendee.name}`);
        break;
      }

      case 'BOOKING_CANCELLED': {
        await db.send(new UpdateCommand({
          TableName: 'PendingCalls',
          Key: { callId: payload.uid },
          UpdateExpression: 'SET #s = :s, updatedAt = :u',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: { ':s': 'cancelled', ':u': new Date().toISOString() },
        }));
        break;
      }

      case 'BOOKING_RESCHEDULED': {
        await db.send(new UpdateCommand({
          TableName: 'PendingCalls',
          Key: { callId: payload.uid },
          UpdateExpression: 'SET scheduledAt = :t, updatedAt = :u',
          ExpressionAttributeValues: { ':t': payload.startTime, ':u': new Date().toISOString() },
        }));
        break;
      }
    }

    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error('Webhook error:', err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Webhook processing failed' }) };
  }
};
