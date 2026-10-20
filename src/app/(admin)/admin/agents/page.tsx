'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  phone_verified: boolean;
  active: boolean;
  created_at: string;
}

export default function AgentsPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  useEffect(() => {
    async function checkAuthAndFetch() {
      try {
        // First check if we have a valid session
        const authRes = await fetch('/api/auth/me');
        if (authRes.ok) {
          const authData = await authRes.json();
          setUser(authData.data.user);
          
          // If user is admin, fetch agents data
          if (authData.data.user.role === 'admin') {
            await fetchAgents();
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
      // User already set, just fetch agents
      fetchAgents();
    }
  }, [user, router, setUser]);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/admin/agents');
      if (!res.ok) {
        throw new Error('Failed to fetch agents');
      }

      const result = await res.json();
      setAgents(result.data.agents);
      setError(null);
    } catch (err) {
      setError('Failed to load agents');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validate all fields are filled
    if (!formData.name.trim()) {
      setError('Name is required');
      setIsSubmitting(false);
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      setIsSubmitting(false);
      return;
    }
    if (!formData.password.trim()) {
      setError('Password is required');
      setIsSubmitting(false);
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone is required');
      setIsSubmitting(false);
      return;
    }

    // Validate phone format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError(`Phone must be 10 digits starting with 6-9. You entered: ${formData.phone}`);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone,
      };
      
      const res = await fetch('/api/admin/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMsg = data.error || `Failed to create agent (${res.status})`;
        setError(errorMsg);
        setIsSubmitting(false);
        return;
      }

      const successData = await res.json();
      console.log('Agent created successfully:', successData);
      
      await fetchAgents();
      setFormData({ name: '', email: '', password: '', phone: '' });
      setShowCreateForm(false);
      setError(null);
      setIsSubmitting(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown network error';
      console.error('Exception during agent creation:', err);
      setError(`Error: ${errorMsg}`);
      setIsSubmitting(false);
    }
  };

  const handleVerifyPhone = async (agentId: string) => {
    const phone = prompt('Enter phone number to verify:');
    if (!phone) return;

    try {
      const res = await fetch(`/api/admin/user/${agentId}/verify-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to verify phone');
        return;
      }

      await fetchAgents();
    } catch (err) {
      setError('Network error');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-off-white">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Management</h1>
            <p className="text-gray-600">Create and manage delivery agents</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-primary-green text-white rounded hover:bg-green-600 transition"
            >
              {showCreateForm ? 'Cancel' : 'New Agent'}
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showCreateForm && error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Create New Agent</h2>
            <form onSubmit={handleCreateAgent} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number * (10 digits, starting with 6-9)
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-primary-green text-white font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? 'Creating Agent...' : 'Create Agent'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-6 text-center text-gray-600">Loading agents...</div>
          ) : agents.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {agents.map((agent: unknown) => {
                  const a = agent as Record<string, unknown>;
                  const agentId = String(a.id);
                  return (
                    <tr key={agentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {String(a.name)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {String(a.email)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {a.phone ? (
                          <span>
                            {String(a.phone)}
                            {Boolean(a.phone_verified) && (
                              <span className="ml-2 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                                ✓
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        {!a.phone_verified && (
                          <button
                            onClick={() => handleVerifyPhone(agentId)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Verify Phone
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-600">
              No agents found. Create one to get started.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
