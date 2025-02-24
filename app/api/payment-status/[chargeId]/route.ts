import { NextResponse } from 'next/server';
import { pendingPayments } from '../../webhook/route';

export async function GET(request: Request, { params }: { params: { chargeId: string } }) {
  const chargeId = params.chargeId;
  
  if (!chargeId) {
    return NextResponse.json({ error: 'Missing charge ID' }, { status: 400 });
  }

  // Check if the payment is pending
  const isPending = pendingPayments.has(chargeId);
  
  if (isPending) {
    // Remove from the set if we're returning success
    // This prevents duplicate notifications
    pendingPayments.delete(chargeId);
    
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