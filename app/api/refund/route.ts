import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const COINBASE_COMMERCE_API = 'https://api.commerce.coinbase.com';
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base USDC
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

export async function POST(request: Request) {
  try {
    const { chargeId } = await request.json();
    console.log('Processing refund for charge:', chargeId);

    if (!chargeId) {
      return NextResponse.json({ error: 'Missing charge ID' }, { status: 400 });
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

    // Verify this is a refund request
    if (!charge.metadata?.refund_requested) {
      return NextResponse.json({ error: 'No refund requested for this charge' }, { status: 400 });
    }

    // Check if already refunded
    if (charge.metadata?.refunded) {
      return NextResponse.json({ error: 'Charge already refunded' }, { status: 400 });
    }

    // Get payment details
    const payment = charge.payments[0];
    if (!payment || !payment.value.crypto.amount) {
      return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 });
    }

    // Get customer address from metadata
    const customerAddress = charge.metadata.refund_requested_by;
    if (!customerAddress || !ethers.isAddress(customerAddress)) {
      return NextResponse.json({ error: 'Invalid customer address' }, { status: 400 });
    }

    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.MERCHANT_PRIVATE_KEY!, provider);
    const usdc = new ethers.Contract(USDC_CONTRACT, USDC_ABI, wallet);

    // Get USDC decimals
    const decimals = await usdc.decimals();
    
    // Convert amount to USDC units
    const refundAmount = ethers.parseUnits(payment.value.crypto.amount, decimals);

    console.log('Sending refund:', {
      to: customerAddress,
      amount: payment.value.crypto.amount,
      amountInUnits: refundAmount.toString()
    });

    // Send the refund transaction
    const tx = await usdc.transfer(customerAddress, refundAmount);
    console.log('Refund transaction sent:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Refund transaction confirmed:', receipt.hash);

    // Update charge metadata with refund info
    const updateResponse = await fetch(`${COINBASE_COMMERCE_API}/charges/${chargeId}`, {
      method: 'POST',
      headers: {
        'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata: {
          ...charge.metadata,
          refunded: true,
          refund_date: new Date().toISOString(),
          refund_tx: receipt.hash,
          refund_amount: payment.value.crypto.amount,
          refund_currency: payment.value.crypto.currency
        }
      }),
    });

    if (!updateResponse.ok) {
      console.error('Failed to update charge metadata:', await updateResponse.text());
      // Don't fail the request since the refund was processed
    }

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      transactionHash: receipt.hash
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process refund' 
    }, { status: 500 });
  }
} 