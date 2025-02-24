import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { addPendingPayment } from '@/app/utils/paymentStore';

const COINBASE_COMMERCE_API = 'https://api.commerce.coinbase.com';
const WEBHOOK_SECRET = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET!;

function verifySignature(payload: string, signature: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const computedSignature = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-cc-webhook-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 401 });
    }

    // Verify the webhook signature
    if (!verifySignature(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);
    console.log('Received webhook event:', {
      type: event.event.type,
      chargeId: event.event.data.id
    });

    // Handle charge:pending event
    if (event.event.type === 'charge:pending') {
      const charge = event.event.data;
      
      // Add to our pending payments set using the utility
      addPendingPayment(charge.id);
      
      // Update charge metadata to indicate it's eligible for refund
      const updateResponse = await fetch(`${COINBASE_COMMERCE_API}/charges/${charge.id}`, {
        method: 'POST',
        headers: {
          'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: {
            ...charge.metadata,
            refund_eligible: true,
            payment_pending_at: new Date().toISOString()
          }
        }),
      });

      if (!updateResponse.ok) {
        console.error('Failed to update charge metadata:', await updateResponse.text());
        throw new Error('Failed to update charge metadata');
      }

      console.log('Updated charge metadata for pending payment:', charge.id);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 