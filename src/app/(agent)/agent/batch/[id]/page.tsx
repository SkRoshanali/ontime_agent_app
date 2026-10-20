'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { sortByDistance, formatDistance, haversineKm } from '@/lib/route-sort';
import { calculateLineTotal, formatCollectAmount, quantityToMilliunits, priceToPaise, paiseToPrice } from '@/lib/money';
import { MapPin, FileSpreadsheet } from 'lucide-react';

interface OrderData {
  id: string;
  order_no: number;
  status: string;
  total: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  pincode: string;
  lat?: string | null;
  lng?: string | null;
  delivery_phone: string;
  placed_at: string;
  packed_at?: string | null;
  user_name: string;
}

interface OrderItem {
  id: number;
  name_snapshot: string;
  unit_snapshot: string;
  price_snapshot: string;
  quantity: string;
  unavailable: boolean;
}

interface AggregatedItem {
  itemId: string;
  quantity: number;
  name: string;
}

interface BatchPageProps {
  params: Promise<{ id: string }>;
}

export default function BatchPage({ params }: BatchPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [batchId, setBatchId] = useState<string>('');
  const [batchStatus, setBatchStatus] = useState<string>('PICKING');
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [aggregatedItems, setAggregatedItems] = useState<AggregatedItem[]>([]);
  const [orderItems, setOrderItems] = useState<Map<string, OrderItem[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentLocation, setAgentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortedOrders, setSortedOrders] = useState<OrderData[]>([]);

  const fetchBatchData = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/agent/batch/${id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch batch');
      }
      const data = await res.json();
      setBatchStatus(data.data.batch.status);
      setOrders(data.data.orders || []);
      setAggregatedItems(data.data.aggregatedItems || []);
      setError(null);

      // Fetch items for each order
      const itemsMap = new Map<string, OrderItem[]>();
      for (const order of data.data.orders || []) {
        const itemRes = await fetch(`/api/agent/order/${order.id}/items`);
        if (itemRes.ok) {
          const itemData = await itemRes.json();
          itemsMap.set(order.id, itemData.data.items || []);
        }
      }
      setOrderItems(itemsMap);

      // Sort by distance if we have location
      if (agentLocation) {
        const sorted = sortByDistance(
          data.data.orders || [],
          agentLocation.lat,
          agentLocation.lng
        ) as OrderData[];
        setSortedOrders(sorted);
      } else {
        setSortedOrders(data.data.orders || []);
      }
    } catch (err) {
      setError('Failed to load batch data');
      console.error(err);
    }
  }, [agentLocation]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    (async () => {
      const resolvedParams = await params;
      setBatchId(resolvedParams.id);
      await fetchBatchData(resolvedParams.id);
      setIsLoading(false);
    })();
  }, [params, user, fetchBatchData, router]);

  const handleDispatch = async () => {
    setIsDispatching(true);
    setError(null);

    try {
      const res = await fetch(`/api/agent/batch/${batchId}/dispatch`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to dispatch batch');
        setIsDispatching(false);
        return;
      }

      // Refresh batch data
      await fetchBatchData(batchId);
      setIsDispatching(false);
    } catch (err) {
      setError('Network error');
      console.error(err);
      setIsDispatching(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setAgentLocation({ lat: latitude, lng: longitude });
        // Sort orders by distance
        const sorted = sortByDistance(orders, latitude, longitude) as OrderData[];
        setSortedOrders(sorted);
      },
      () => {
        setError('Unable to get your location. Orders will be shown in claimed order.');
      }
    );
  };

  const handleExportExcel = async () => {
    try {
      const query = agentLocation 
        ? `?lat=${agentLocation.lat}&lng=${agentLocation.lng}` 
        : '';
      const res = await fetch(`/api/agent/batch/${batchId}/export${query}`);
      
      if (!res.ok) {
        setError('Failed to export batch');
        return;
      }

      // Create blob and download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch-${batchId}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export batch');
      console.error(err);
    }
  };

  const allPacked = orders.length > 0 && orders.every((o) => o.packed_at);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  const displayOrders = sortedOrders.length > 0 ? sortedOrders : orders;
  let stopNumber = 1;

  return (
    <div className="min-h-screen bg-neutral-off-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Batch {batchId}</h1>
              <p className="text-gray-600">
                {orders.length} orders • Status: <span className="font-semibold">{batchStatus}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <FileSpreadsheet size={16} />
                Download sheet
              </button>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Back
              </button>
            </div>
          </div>

          {/* Location Button */}
          <button
            onClick={handleGetLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <MapPin size={16} />
            {agentLocation ? 'Update location' : 'Use my location'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Dispatch Button */}
        {batchStatus === 'PICKING' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Ready to dispatch?</h3>
              <p className="text-sm text-blue-700 mt-1">
                {allPacked ? 'All orders are packed.' : `${orders.filter((o) => !o.packed_at).length} orders still need packing.`}
              </p>
            </div>
            <button
              onClick={handleDispatch}
              disabled={!allPacked || isDispatching}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isDispatching ? 'Dispatching...' : 'Out for Delivery'}
            </button>
          </div>
        )}

        {/* Pick List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Pick List (Aggregated)</h2>
          <div className="space-y-3">
            {aggregatedItems.length > 0 ? (
              aggregatedItems.map((item) => (
                <div
                  key={item.itemId}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-2xl font-bold text-primary-green">{item.quantity}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No items in batch</p>
            )}
          </div>
        </div>

        {/* Orders by Customer */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Deliveries ({displayOrders.length})</h2>
          {displayOrders.map((order) => {
            const items = orderItems.get(order.id) || [];
            const distance = agentLocation && order.lat && order.lng 
              ? haversineKm(agentLocation.lat, agentLocation.lng, Number(order.lat), Number(order.lng))
              : null;

            const mapsUrl = order.lat && order.lng 
              ? `https://www.google.com/maps?q=${order.lat},${order.lng}`
              : null;

            const collectAmount = items
              .filter((i) => !i.unavailable)
              .reduce((total, item) => {
                const qtyMilli = quantityToMilliunits(item.quantity);
                const pricePaise = priceToPaise(item.price_snapshot);
                return total + calculateLineTotal(qtyMilli, pricePaise);
              }, 0);

            return (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Header */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-gray-600">Stop #{stopNumber++}</p>
                      <p className="text-lg font-bold text-gray-900">Order #{order.order_no}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{order.user_name}</p>
                      <p className="text-sm text-gray-600">{order.delivery_phone}</p>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Delivery Address</p>
                  <p className="text-gray-900">
                    {order.address_line1}
                    {order.address_line2 && <>, {order.address_line2}</>}
                  </p>
                  <p className="text-gray-900">
                    {order.city}, {order.pincode}
                  </p>
                  {order.lat && order.lng ? (
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-sm text-gray-600">
                        Coords: {order.lat}, {order.lng}
                        {distance && <span className="ml-2 font-semibold">{formatDistance(distance)}</span>}
                      </p>
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline text-sm"
                        >
                          Open in Maps
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mt-2">No coordinates</p>
                  )}
                </div>

                {/* Items */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Items</p>
                  <div className="space-y-2">
                    {items.length > 0 ? (
                      items.map((item) => {
                        const qtyMilli = quantityToMilliunits(item.quantity);
                        const pricePaise = priceToPaise(item.price_snapshot);
                        const lineTotal = calculateLineTotal(qtyMilli, pricePaise);

                        return (
                          <div
                            key={item.id}
                            className={`p-2 rounded text-sm ${
                              item.unavailable ? 'bg-gray-100 line-through' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between">
                              <span>{item.name_snapshot}</span>
                              <span>{item.quantity} × {item.unit_snapshot}</span>
                              <span className="font-medium">{paiseToPrice(lineTotal)}</span>
                            </div>
                            {item.unavailable && (
                              <p className="text-red-600 text-xs mt-1">UNAVAILABLE</p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-600 text-sm">No items</p>
                    )}
                  </div>
                </div>

                {/* Collect Amount */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCollectAmount(collectAmount)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {batchStatus === 'PICKING' && !order.packed_at && (
                    <button
                      onClick={() => router.push(`/agent/batch/${batchId}/order/${order.id}`)}
                      className="flex-1 px-4 py-2 bg-primary-green text-white rounded hover:bg-green-600 transition"
                    >
                      Pack
                    </button>
                  )}
                  {batchStatus === 'OUT_FOR_DELIVERY' && order.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => router.push(`/agent/order/${order.id}/deliver`)}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
                    >
                      Deliver
                    </button>
                  )}
                  {order.status === 'DELIVERED' && (
                    <div className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded text-center font-semibold">
                      ✓ Delivered
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
