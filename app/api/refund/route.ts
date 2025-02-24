import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const COINBASE_COMMERCE_API = 'https://api.commerce.coinbase.com';
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base USDC
const BASE_RPC_URL = 'https://mainnet.base.org'; // Base mainnet RPC
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

export async function POST(request: Request) {
  try {
    // Debug logging for environment variables
    console.log('Environment check:', {
      hasPrivateKey: !!process.env.PRIVATE_KEY,
      privateKeyLength: process.env.PRIVATE_KEY?.length,
      hasCoinbaseKey: !!process.env.COINBASE_COMMERCE_API_KEY
    });

    const { chargeId } = await request.json();
    console.log('Processing refund for charge:', chargeId);

    // Validate private key
    if (!process.env.PRIVATE_KEY) {
      console.error('PRIVATE_KEY environment variable is not set');
      return NextResponse.json({ 
        error: 'Merchant configuration error: Missing PRIVATE_KEY environment variable' 
      }, { status: 500 });
    }

    if (process.env.PRIVATE_KEY.length !== 64 && !process.env.PRIVATE_KEY.startsWith('0x')) {
      console.error('PRIVATE_KEY environment variable is invalid');
      return NextResponse.json({ 
        error: 'Merchant configuration error: Invalid PRIVATE_KEY format' 
      }, { status: 500 });
    }

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
      metadata: charge.metadata,
      payments: charge.payments
    });

    // Check if already refunded
    if (charge.metadata?.refunded) {
      return NextResponse.json({ error: 'Charge already refunded' }, { status: 400 });
    }

    // Get payment details and customer address
    const payment = charge.payments[0];
    if (!payment || !payment.value.crypto.amount) {
      return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 });
    }

    // Get the customer's address from the payment
    if (!payment.payer_addresses || payment.payer_addresses.length === 0) {
      console.error('No payer addresses found:', payment);
      return NextResponse.json({ error: 'No payer address found' }, { status: 400 });
    }

    const customerAddress = payment.payer_addresses[0];
    console.log('Customer address:', customerAddress);

    if (!ethers.isAddress(customerAddress)) {
      console.error('Invalid customer address:', customerAddress);
      return NextResponse.json({ error: 'Invalid customer address' }, { status: 400 });
    }

    try {
      // Initialize provider and wallet
      console.log('Initializing provider with Base RPC URL');
      const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
      
      // Wait for provider to be ready
      await provider.ready;
      console.log('Provider ready, network:', await provider.getNetwork());

      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      console.log('Wallet initialized:', await wallet.getAddress());

      const usdc = new ethers.Contract(USDC_CONTRACT, USDC_ABI, wallet);
      console.log('USDC contract initialized');

      // Get USDC decimals
      const decimals = await usdc.decimals();
      console.log('USDC decimals:', decimals);
      
      // Convert amount to USDC units
      const refundAmount = ethers.parseUnits(payment.value.crypto.amount, decimals);
      console.log('Refund amount:', refundAmount.toString());

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

    } catch (txError) {
      console.error('Transaction error:', txError);
      return NextResponse.json({ 
        error: 'Failed to process refund transaction. Please check merchant wallet balance and network status.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process refund' 
    }, { status: 500 });
  }
} 