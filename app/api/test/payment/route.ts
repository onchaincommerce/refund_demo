import { NextResponse } from 'next/server';
import { addPendingPayment } from '@/app/utils/paymentStore';

export async function POST(request: Request) {
  try {
    const { chargeId = 'test-payment-' + Date.now() } = await request.json();
    
    // Register this payment as pending
    addPendingPayment(chargeId);
    
    console.log('TEST PAYMENT CREATED:', { chargeId, time: new Date().toISOString() });
    
    return NextResponse.json({
      success: true,
      chargeId,
      message: 'Test payment created. Poll the /api/payment-status/:chargeId endpoint to detect it.'
    });
  } catch (error) {
    console.error('Error creating test payment:', error);
    return NextResponse.json(
      { error: 'Failed to create test payment' },
      { status: 500 }
    );
  }
} 