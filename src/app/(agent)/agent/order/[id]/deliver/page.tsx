'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DeliverPageProps {
  params: Promise<{ id: string }>;
}

export default function DeliverPage({ params }: DeliverPageProps) {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setOrderId(resolvedParams.id);
      setIsLoading(false);
    })();
  }, [params]);

  const handleDeliver = async () => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/agent/order/${orderId}/delivered`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to mark as delivered');
        return;
      }

      router.push('/agent');
    } catch (err) {
      setError('Network error');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-off-white p-4 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Deliver Order</h1>
        <p className="text-gray-600 mb-6">Order {orderId.slice(0, 8)}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-900">
            Confirm that you have delivered this order to the customer.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDeliver}
            disabled={isSubmitting}
            className="flex-1 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Delivery'}
          </button>
        </div>
      </div>
    </div>
  );
}
