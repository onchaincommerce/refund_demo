import { NextResponse } from 'next/server';
import { getLastChargeId } from '@/app/utils/paymentStore';

export async function GET() {
  return NextResponse.json({
    lastChargeId: getLastChargeId(),
    timestamp: new Date().toISOString(),
    info: 'This endpoint helps debug whether webhooks are being received'
  });
} 