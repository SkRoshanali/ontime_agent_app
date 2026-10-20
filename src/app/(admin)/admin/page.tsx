'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface DashboardData {
  stats: {
    placed: number;
    inTrip: number;
    outForDelivery: number;
  };
  agents: unknown[];
  unclaimedOrders: unknown[];
  pickingBatches: unknown[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthAndFetch() {
      try {
        // First check if we have a valid session
        const authRes = await fetch('/api/auth/me');
        if (authRes.ok) {
          const authData = await authRes.json();
          setUser(authData.data.user);
          
          // If user is admin, fetch dashboard data
          if (authData.data.user.role === 'admin') {
            await fetchDashboard();
          } else {
            // Non-admin should be redirected
            router.push('/login');
          }
        } else {
          // No valid session, redirect to login
          router.push('/login');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      }
    }

    if (!user) {
      checkAuthAndFetch();
    } else {
      // User already set, just fetch dashboard
      fetchDashboard();
    }
  }, [user, router, setUser]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard');
      }

      const result = await res.json();
      setData(result.data);
    } catch (err) {
      setError('Failed to load dashboard');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  if (!user || isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-off-white">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome, {user.name}</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/admin/agents"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Add Delivery Agent
            </Link>
            <Link
              href="/admin/orders"
              className="px-4 py-2 bg-primary-green text-white rounded hover:bg-green-600 transition"
            >
              All Orders
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 text-sm mb-2">Unclaimed Orders</p>
                <p className="text-4xl font-bold text-primary-green">{data.stats.placed}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 text-sm mb-2">In Transit</p>
                <p className="text-4xl font-bold text-blue-600">{data.stats.inTrip}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 text-sm mb-2">Out for Delivery</p>
                <p className="text-4xl font-bold text-orange-600">{data.stats.outForDelivery}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Active Agents</h2>
              <div className="space-y-2">
                {data.agents.length > 0 ? (
                  data.agents.map((agent: unknown) => {
                    const a = agent as Record<string, unknown>;
                    const agentId = String(a.id);
                    return (
                      <div
                        key={agentId}
                        className="p-4 bg-gray-50 rounded border border-gray-200 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{String(a.name)}</p>
                          {a.batch ? (
                            <p className="text-sm text-gray-600">
                              Batch {String((a.batch as Record<string, unknown>).id)} • {String(a.orderCount)} orders
                            </p>
                          ) : (
                            <p className="text-sm text-gray-600">No active batch</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-600">No agents</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Unclaimed Orders</h2>
              <div className="space-y-2">
                {data.unclaimedOrders.length > 0 ? (
                  data.unclaimedOrders.map((order: unknown) => {
                    const o = order as Record<string, unknown>;
                    const orderId = String(o.id);
                    return (
                      <div
                        key={orderId}
                        className="p-4 bg-gray-50 rounded border border-gray-200"
                      >
                        <p className="font-medium">Order {orderId.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          Placed: {new Date(o.placed_at as string).toLocaleString()}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-600">No unclaimed orders</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Active Batches (Picking)</h2>
              <div className="space-y-2">
                {data.pickingBatches.length > 0 ? (
                  data.pickingBatches.map((batch: unknown) => {
                    const b = batch as Record<string, unknown>;
                    const batchId = String(b.id);
                    return (
                      <div
                        key={batchId}
                        className="p-4 bg-gray-50 rounded border border-gray-200 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">Batch {batchId}</p>
                          <p className="text-sm text-gray-600">
                            Claimed: {new Date(b.claimed_at as string).toLocaleString()}
                          </p>
                        </div>
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition">
                          Release
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-600">No active batches</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
