import { NextResponse } from 'next/server';

const COINBASE_COMMERCE_API = 'https://api.commerce.coinbase.com';

interface CommerceCharge {
  id: string;
  code: string;
  name: string;
  description: string;
  customer_email: string;
  charge_kind: string;
  checkout?: {
    id: string;
  };
  confirmed_at?: string;
  created_at: string;
  expires_at: string;
  payments: Array<{
    payment_id: string;
    network: string;
    transaction_id: string;
    status: string;
    detected_at: string;
    value: {
      local: {
        amount: string;
        currency: string;
      };
      crypto: {
        amount: string;
        currency: string;
      };
    };
    payer_addresses: string[];
  }>;
  timeline: Array<{
    time: string;
    status: string;
  }>;
  metadata?: {
    refunded?: boolean;
    refund_tx?: string;
    refund_date?: string;
    original_payment_tx?: string;
    refund_requested?: boolean;
    refund_request_date?: string;
  };
}

async function getAllCharges(): Promise<CommerceCharge[]> {
  let allCharges: CommerceCharge[] = [];
  let hasMore = true;
  let cursor = '';
  let retryCount = 0;
  const maxRetries = 3;

  while (hasMore && retryCount < maxRetries) {
    try {
      const endpoint = cursor 
        ? `${COINBASE_COMMERCE_API}/charges?cursor=${cursor}&limit=100`
        : `${COINBASE_COMMERCE_API}/charges?limit=100`;

      console.log('Fetching charges from endpoint:', endpoint);

      const response = await fetch(endpoint, {
        headers: {
          'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY!,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch charges:', errorText);
        throw new Error('Failed to fetch charges from Coinbase Commerce');
      }

      const data = await response.json();
      console.log('Received charges:', data.data.length, 'Has more:', !!data.pagination?.cursor_next);
      
      allCharges = [...allCharges, ...data.data];

      // Check if there are more pages
      if (data.pagination && data.pagination.cursor_next) {
        cursor = data.pagination.cursor_next;
        console.log('Next cursor:', cursor);
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error('Error fetching charges:', error);
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
    }
  }

  console.log('Total charges fetched:', allCharges.length);
  return allCharges;
}

export async function GET() {
  try {
    console.log('Fetching all charges from Coinbase Commerce...');
    const allCharges = await getAllCharges();
    
    // Sort charges by date (newest first)
    const sortedCharges = allCharges.sort((a: CommerceCharge, b: CommerceCharge) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({ data: sortedCharges });
  } catch (error) {
    console.error('Error in charges API:', error);
    return NextResponse.json({ error: 'Failed to fetch charges' }, { status: 500 });
  }
} 