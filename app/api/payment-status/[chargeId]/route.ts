import { NextResponse } from 'next/server';
import { hasPendingPayment, removePendingPayment } from '@/app/utils/paymentStore';

export async function GET(request: Request, { params }: { params: { chargeId: string } }) {
  const chargeId = params.chargeId;
  
  if (!chargeId) {
    return NextResponse.json({ error: 'Missing charge ID' }, { status: 400 });
  }

  // Check if the payment is pending using the utility
  const isPending = hasPendingPayment(chargeId);
  
  if (isPending) {
    // Remove from the set if we're returning success
    // This prevents duplicate notifications
    removePendingPayment(chargeId);
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Payment has been processed successfully'
    });
  }
  
  return NextResponse.json({ 
    status: 'waiting',
    message: 'Payment has not been processed yet'
  });
} 