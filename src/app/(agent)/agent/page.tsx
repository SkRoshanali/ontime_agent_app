'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { isBatchActive } from '@/lib/batch-rules';

interface Batch {
  id: string;
  status: string;
  claimed_at: string;
}

interface DashboardData {
  batch: Batch | null;
  orders: unknown[] | null;
  orderCount: number;
}

export default function AgentDashboard() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unclaimedCount, setUnclaimedCount] = useState<number>(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    async function checkAuthAndFetch() {
      console.log('Agent page: Checking authentication...');
      
      // Set a timeout in case the auth check hangs
      timeoutId = setTimeout(() => {
        console.error('Agent page: Auth check timed out, redirecting to login');
        router.push('/login');
      }, 10000); // 10 second timeout
      
      try {
        // First check if we have a valid session
        const authRes = await fetch('/api/auth/me');
        console.log('Agent page: Auth response status:', authRes.status);
        
        // Clear timeout since we got a response
        clearTimeout(timeoutId);
        
        if (authRes.ok) {
          const authData = await authRes.json();
          console.log('Agent page: Auth data:', authData);
          setUser(authData.data.user);
          
          // Agents should stay on agent page, admins should go to admin
          if (authData.data.user.role === 'admin') {
            console.log('Agent page: User is admin, redirecting to /admin');
            router.push('/admin');
            return;
          }
          
          // Verify user is actually an agent
          if (authData.data.user.role !== 'agent') {
            console.error('Agent page: User role is not agent:', authData.data.user.role);
            router.push('/login');
            return;
          }
          
          console.log('Agent page: User is agent, staying on page');
          // Trigger self-heal by calling claim endpoint (handles cleanup)
          await applySelfHealing();
          // Fetch unclaimed orders count
          await fetchUnclaimedCount();
        } else {
          // No valid session, redirect to login
          console.log('Agent page: No valid session, redirecting to login');
          router.push('/login');
        }
      } catch (err) {
        console.error('Agent page: Auth check failed:', err);
        clearTimeout(timeoutId);
        router.push('/login');
      }
    }

    if (!user) {
      checkAuthAndFetch();
    } else {
      // If user is already set, just fetch the count and apply self-healing
      applySelfHealing();
      fetchUnclaimedCount();
    }
    
    // Cleanup timeout on component unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, router, setUser]);

  /**
   * Apply self-healing: if agent has an empty PICKING batch, it will be
   * cancelled by the claim endpoint's self-heal logic (or we can call a separate endpoint).
   * For now, this is a no-op; the claim route handles it on POST.
   */
  const applySelfHealing = async () => {
    // Self-healing is applied when claim route is called.
    // This is a placeholder if we need to add a separate self-heal endpoint later.
    console.log('Self-healing check on page load (handled by claim route)');
  };

  const handleClaimBatch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/agent/batch/claim', {
        method: 'POST',
      });

      if (!res.ok) {
        const responseData = await res.json();
        // Handle 409 Conflict (No orders waiting) gracefully
        if (res.status === 409) {
          setError('No orders waiting');
        } else {
          setError(responseData.error || 'Failed to claim batch');
        }
        return;
      }

      const result = await res.json();
      setData({
        batch: result.data.batch,
        orders: result.data.orders,
        orderCount: result.data.orderCount,
      });
      
      // Reset the unclaimed count
      await fetchUnclaimedCount();
    } catch (err) {
      setError('Network error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnclaimedCount = async () => {
    try {
      const res = await fetch('/api/agent/orders/unclaimed-count');
      if (res.ok) {
        const data = await res.json();
        setUnclaimedCount(data.data.count);
      }
    } catch (err) {
      console.error('Failed to fetch unclaimed count:', err);
    }
  };

  // Add focus listener to refresh unclaimed count when tab regains focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('Tab regained focus, refreshing unclaimed count');
      fetchUnclaimedCount();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  // Determine if batch is active using the new helper
  const batchIsActive = data && data.batch ? isBatchActive(data.batch.status, data.orderCount) : false;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Agent Dashboard</h1>
          <p className="text-gray-600">Loading your dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Checking authentication</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-off-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
            <p className="text-gray-600">Welcome, {user.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Logout
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

        {/* Batch Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Batch Status</h2>

          {batchIsActive ? (
            <div>
              <div className="mb-4">
                <p className="text-gray-600 text-sm">Batch ID</p>
                <p className="text-2xl font-bold text-primary-green">{data?.batch?.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-600 text-sm">Status</p>
                  <p className="text-lg font-semibold uppercase text-gray-900">
                    {data?.batch?.status}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Orders in Batch</p>
                  <p className="text-lg font-semibold text-gray-900">{data?.orderCount}</p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/agent/batch/${data?.batch?.id}`)}
                className="w-full py-3 bg-primary-green text-white font-medium rounded-lg hover:bg-green-600 transition"
              >
                View Batch Details
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                {unclaimedCount > 0 ? (
                  <>
                    <p className="text-lg font-semibold text-blue-900">
                      {unclaimedCount} order{unclaimedCount !== 1 ? 's' : ''} waiting
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      You will claim all of them.
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-semibold text-blue-900">No orders waiting</p>
                )}
              </div>
              <p className="text-gray-600 mb-4">
                {unclaimedCount > 0 ? 'Tap to claim orders:' : ''}
              </p>
              <button
                onClick={handleClaimBatch}
                disabled={isLoading || unclaimedCount === 0}
                className={`w-full py-4 font-bold text-lg rounded-lg transition ${
                  unclaimedCount === 0
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-primary-green text-white hover:bg-green-600'
                }`}
              >
                {isLoading ? 'Claiming...' : unclaimedCount === 0 ? 'No orders waiting' : 'I am ready'}
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-gray-600 text-sm mb-1">Status</p>
            <p className="text-2xl font-bold text-gray-900">Active</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-gray-600 text-sm mb-1">Phone Verified</p>
            <p className="text-2xl font-bold text-gray-900">{user.phone_verified ? 'Yes' : 'No'}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-gray-600 text-sm mb-1">Account Created</p>
            <p className="text-2xl font-bold text-gray-900">Today</p>
          </div>
        </div>
      </main>
    </div>
  );
}
