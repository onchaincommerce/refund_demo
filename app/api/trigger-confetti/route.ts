import { NextResponse } from 'next/server';
import { addPendingPayment } from '@/app/utils/paymentStore';

export async function POST(request: Request) {
  try {
    // Get the charge ID from the request, or use a default test ID
    const data = await request.json().catch(() => ({}));
    const chargeId = data.chargeId || `test-charge-${Date.now()}`;
    
    console.log(`[DEBUG] Manually triggering confetti for charge ID: ${chargeId}`);
    
    // Add this charge ID to the pending payments
    addPendingPayment(chargeId);
    
    return NextResponse.json({
      success: true,
      message: 'Confetti trigger successful! The payment has been marked as pending.',
      chargeId,
      testNote: 'This endpoint exists only for testing. It simulates a charge:pending event from Coinbase Commerce.'
    });
  } catch (error) {
    console.error('Error in trigger-confetti endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to trigger confetti',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 