import { useState } from 'react';
import { useAccount } from 'wagmi';

interface RefundButtonProps {
  chargeId: string;
  customerAddress: string;
  onRefundRequested?: () => void;
}

export function RefundButton({ chargeId, customerAddress, onRefundRequested }: RefundButtonProps) {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundStatus, setRefundStatus] = useState<'none' | 'requested' | 'refunded'>('none');

  // Check if the connected wallet matches the customer's address
  const isCustomer = address?.toLowerCase() === customerAddress.toLowerCase();

  const handleRefundRequest = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/refund/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          chargeId,
          customerAddress: address 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request refund');
      }

      const data = await response.json();
      if (data.success) {
        setRefundStatus('requested');
        onRefundRequested?.();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to request refund');
    } finally {
      setIsLoading(false);
    }
  };

  // If not the customer, don't show the button
  if (!isCustomer) {
    return null;
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (refundStatus === 'requested') {
    return (
      <div className="text-sm text-yellow-600">
        Refund requested
      </div>
    );
  }

  return (
    <button
      onClick={handleRefundRequest}
      disabled={isLoading}
      className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
    >
      {isLoading ? 'Processing...' : 'Request Refund'}
    </button>
  );
} 