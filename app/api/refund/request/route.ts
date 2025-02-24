import { NextResponse } from 'next/server';

const COINBASE_COMMERCE_API = 'https://api.commerce.coinbase.com';

export async function POST(request: Request) {
  try {
    const { chargeId, customerAddress } = await request.json();
    console.log('Processing refund request:', { chargeId, customerAddress });

    if (!chargeId || !customerAddress) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Get the charge
    const chargeResponse = await fetch(`${COINBASE_COMMERCE_API}/charges/${chargeId}`, {
      headers: {
        'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY!,
        'Accept': 'application/json',
      },
    });

    if (!chargeResponse.ok) {
      const errorText = await chargeResponse.text();
      console.error('Failed to fetch charge:', errorText);
      return NextResponse.json({ error: 'Failed to fetch charge' }, { status: 404 });
    }

    const chargeData = await chargeResponse.json();
    const charge = chargeData.data;
    console.log('Found charge:', {
      id: charge.id,
      code: charge.code,
      status: charge.timeline[charge.timeline.length - 1]?.status,
      metadata: charge.metadata
    });

    // Check if already refunded or requested
    if (charge.metadata?.refunded) {
      return NextResponse.json({ error: 'Charge already refunded' }, { status: 400 });
    }
    if (charge.metadata?.refund_requested) {
      return NextResponse.json({ error: 'Refund already requested' }, { status: 400 });
    }

    // Mark as refund requested
    const updateResponse = await fetch(`${COINBASE_COMMERCE_API}/charges/${chargeId}`, {
      method: 'POST',
      headers: {
        'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata: {
          ...charge.metadata,
          refund_requested: true,
          refund_request_date: new Date().toISOString(),
          refund_requested_by: customerAddress
        },
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update charge:', errorText);
      return NextResponse.json({ error: 'Failed to update charge' }, { status: 500 });
    }

    const updatedCharge = await updateResponse.json();
    console.log('Successfully marked charge for refund:', updatedCharge.data.id);

    return NextResponse.json({
      success: true,
      message: 'Refund request submitted',
      charge: updatedCharge.data
    });

  } catch (error) {
    console.error('Error processing refund request:', error);
    return NextResponse.json({ 
      error: 'Failed to process refund request' 
    }, { status: 500 });
  }
} 