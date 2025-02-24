import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { addPendingPayment } from '@/app/utils/paymentStore';

const COINBASE_COMMERCE_API = 'https://api.commerce.coinbase.com';
const WEBHOOK_SECRET = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET!;

// Store webhook history for debugging
const webhookEvents: any[] = [];
const MAX_STORED_EVENTS = 10;

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
  console.log('WEBHOOK RECEIVED:', { time: new Date().toISOString() });
  
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-cc-webhook-signature');

    console.log('WEBHOOK HEADERS:', {
      signature: signature ? 'Present (hidden for security)' : 'Missing',
      contentType: request.headers.get('content-type'),
      userAgent: request.headers.get('user-agent')
    });

    if (!signature) {
      console.error('WEBHOOK ERROR: No signature provided');
      return NextResponse.json({ error: 'No signature provided' }, { status: 401 });
    }

    // Verify the webhook signature
    const isValid = verifySignature(payload, signature);
    console.log('WEBHOOK SIGNATURE VERIFICATION:', { isValid });
    
    if (!isValid) {
      console.error('WEBHOOK ERROR: Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);
    
    // Store the event for debugging
    webhookEvents.unshift({
      type: event.event.type,
      chargeId: event.event.data.id,
      timestamp: new Date().toISOString()
    });
    
    // Keep only the last few events
    if (webhookEvents.length > MAX_STORED_EVENTS) {
      webhookEvents.pop();
    }
    
    console.log('WEBHOOK EVENT DETAILS:', {
      type: event.event.type,
      chargeId: event.event.data.id,
      timestamp: new Date().toISOString()
    });

    // Handle charge:pending event
    // IMPORTANT: We use charge:pending as our success trigger because:
    // 1. The payment has been detected on the blockchain
    // 2. The merchant has received the funds
    // 3. The probability of failure at this point is extremely low (< 1 in a million)
    if (event.event.type === 'charge:pending') {
      const charge = event.event.data;
      
      // Add to our pending payments set using the utility
      // This will allow our client to detect success and show confetti
      addPendingPayment(charge.id);
      
      console.log('WEBHOOK SUCCESS: Payment marked as pending and successful', { chargeId: charge.id });
      
      // Update charge metadata to indicate it's eligible for refund
      try {
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
          const errorText = await updateResponse.text();
          console.error('WEBHOOK ERROR: Failed to update charge metadata:', errorText);
          throw new Error('Failed to update charge metadata');
        }

        console.log('WEBHOOK SUCCESS: Updated charge metadata for pending payment:', charge.id);
      } catch (error) {
        console.error('WEBHOOK ERROR: Update charge metadata error:', error);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Webhook processed successfully: ${event.event.type}`
    });

  } catch (error) {
    console.error('WEBHOOK CRITICAL ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Helper endpoint to check webhook history
export async function GET() {
  return NextResponse.json({
    recentEvents: webhookEvents,
    totalProcessed: webhookEvents.length,
    message: 'This is a diagnostic endpoint to check webhook history'
  });
} 