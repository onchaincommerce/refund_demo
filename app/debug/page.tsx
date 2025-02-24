'use client';

import { useState, useCallback, useEffect } from 'react';
import { useConfetti } from '../hooks/useConfetti';
import Link from 'next/link';

export default function DebugPage() {
  const [chargeId, setChargeId] = useState(`test-charge-${Date.now()}`);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [webhookStatus, setWebhookStatus] = useState<any>(null);
  const triggerConfetti = useConfetti();

  // Get webhook status on load and periodically
  useEffect(() => {
    fetchWebhookStatus();
    
    const interval = setInterval(() => {
      fetchWebhookStatus();
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchWebhookStatus = async () => {
    try {
      const response = await fetch('/api/debug/webhook');
      const data = await response.json();
      setWebhookStatus(data);
    } catch (error) {
      console.error('Failed to fetch webhook status:', error);
    }
  };

  const handleTriggerConfetti = useCallback(async () => {
    setStatus('loading');
    setMessage('');
    
    try {
      const response = await fetch('/api/trigger-confetti', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chargeId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        triggerConfetti();
      } else {
        setStatus('error');
        setMessage(data.message || 'Unknown error occurred');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to trigger confetti');
    }
  }, [chargeId, triggerConfetti]);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/"
            className="text-blue-500 hover:text-blue-700 transition-colors mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-2">Debug Panel</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Use this page to test the confetti and payment notification system
          </p>
        </div>
        
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Trigger Confetti Manually</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Charge ID
            </label>
            <input
              type="text"
              value={chargeId}
              onChange={(e) => setChargeId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            />
          </div>
          
          <button
            onClick={handleTriggerConfetti}
            disabled={status === 'loading'}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md 
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Processing...' : 'Trigger Confetti'}
          </button>
          
          {message && (
            <div className={`mt-4 p-3 rounded-md ${
              status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>
        
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Webhook Status</h2>
          
          {webhookStatus ? (
            <div>
              <div className="mb-2">
                <span className="font-medium">Last Charge ID:</span>{' '}
                <span className="font-mono">{webhookStatus.lastChargeId || 'None'}</span>
              </div>
              <div className="mb-2">
                <span className="font-medium">Timestamp:</span>{' '}
                <span>{new Date(webhookStatus.timestamp).toLocaleString()}</span>
              </div>
              <pre className="p-3 bg-gray-100 dark:bg-gray-900 rounded-md overflow-x-auto text-xs">
                {JSON.stringify(webhookStatus, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse text-gray-500">Loading webhook status...</div>
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={fetchWebhookStatus}
              className="text-blue-500 hover:text-blue-700 transition-colors text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 