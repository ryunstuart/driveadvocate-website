import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }), {
  marshallOptions: { removeUndefinedValues: true },
});

export const handler = async (event: any) => {
  const body = JSON.parse(event.body || '{}');
  const { triggerEvent, payload } = body;

  console.log('Cal.com webhook:', triggerEvent, payload?.uid);

  try {
    switch (triggerEvent) {
      case 'BOOKING_CREATED': {
        const attendee = payload.attendees?.[0];
        if (!attendee) break;

        await db.send(new PutCommand({
          TableName: 'PendingCalls',
          Item: {
            callId: payload.uid,
            clientName: attendee.name,
            clientEmail: attendee.email,
            clientPhone: attendee.phoneNumber || payload.responses?.phone?.value || '',
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

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error('Webhook error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Webhook processing failed' }) };
  }
};
