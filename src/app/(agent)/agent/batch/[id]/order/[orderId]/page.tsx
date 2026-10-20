'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  calculateCollectAmount,
  formatCollectAmount,
  quantityToMilliunits,
  priceToPaise,
  calculateLineTotal,
  paiseToPrice,
} from '@/lib/money';

interface OrderItem {
  id: number;
  item_id: string;
  name_snapshot: string;
  unit_snapshot: string;
  price_snapshot: string;
  quantity: string;
  unavailable: boolean;
}

interface PackOrderPageProps {
  params: Promise<{ id: string; orderId: string }>;
}

export default function PackOrderPage({ params }: PackOrderPageProps) {
  const router = useRouter();
  const [batchId, setBatchId] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [unavailableItems, setUnavailableItems] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setBatchId(resolvedParams.id);
      setOrderId(resolvedParams.orderId);
      await fetchOrderItems(resolvedParams.orderId);
      setIsLoading(false);
    })();
  }, [params]);

  const fetchOrderItems = async (orderId: string) => {
    try {
      const res = await fetch(`/api/agent/order/${orderId}/items`);
      if (!res.ok) {
        throw new Error('Failed to fetch items');
      }
      const data = await res.json();
      setItems(data.data.items || []);
      setError(null);
    } catch (err) {
      setError('Failed to load order items');
      console.error(err);
    }
  };

  const toggleUnavailable = (itemId: number) => {
    const updated = new Set(unavailableItems);
    if (updated.has(itemId)) {
      updated.delete(itemId);
    } else {
      updated.add(itemId);
    }
    setUnavailableItems(updated);
  };

  const handleMarkPacked = async () => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/agent/order/${orderId}/packed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unavailableItemIds: Array.from(unavailableItems),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to pack order');
        return;
      }

      router.push(`/agent/batch/${batchId}`);
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
    <div className="min-h-screen bg-neutral-off-white p-4">
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
      >
        ← Back
      </button>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Pack Order {orderId.slice(0, 8)}</h1>
        <p className="text-gray-600 mb-6">Mark items as unavailable if out of stock</p>

      {items.length > 0 ? (
        <div className="space-y-4 mb-6">
          {items.map((item) => {
            const isUnavailable = unavailableItems.has(item.id);
            const qtyMilliunits = quantityToMilliunits(item.quantity);
            const pricePaise = priceToPaise(item.price_snapshot);
            const lineTotalPaise = calculateLineTotal(qtyMilliunits, pricePaise);
            const qtyDisplay = Number(item.quantity).toString();

            return (
              <div
                key={item.id}
                className={`p-4 border border-gray-200 rounded-lg flex items-center justify-between ${
                  isUnavailable ? 'bg-gray-100 opacity-60' : 'bg-gray-50'
                }`}
              >
                <div className="flex-1">
                  <h3 className={`font-semibold text-gray-900 ${isUnavailable ? 'line-through' : ''}`}>
                    {item.name_snapshot}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {qtyDisplay} × {item.unit_snapshot} @ {paiseToPrice(pricePaise)} ={' '}
                    {paiseToPrice(lineTotalPaise)}
                  </p>
                  {isUnavailable && <p className="text-sm text-red-600 mt-1">Unavailable</p>}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUnavailable}
                    onChange={() => toggleUnavailable(item.id)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-600">
                    {isUnavailable ? 'Out of Stock' : 'In Stock'}
                  </span>
                </label>
              </div>
            );
          })}

          {/* Order Total */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-lg font-semibold text-green-900">
              {formatCollectAmount(
                calculateCollectAmount(
                  items.map((item) => ({
                    quantity: item.quantity,
                    price_snapshot: item.price_snapshot,
                    unavailable: unavailableItems.has(item.id),
                  }))
                )
              )}
            </p>
            <p className="text-sm text-green-700 mt-1">
              ({items.filter((i) => unavailableItems.has(i.id)).length} items unavailable)
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg mb-6">
          <p className="text-gray-600">No items in this order</p>
        </div>
      )}

        <button
          onClick={handleMarkPacked}
          disabled={isSubmitting}
          className="w-full py-3 bg-primary-green text-white font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
        >
          {isSubmitting ? 'Saving...' : 'Mark as Packed'}
        </button>
      </div>
    </div>
  );
}
