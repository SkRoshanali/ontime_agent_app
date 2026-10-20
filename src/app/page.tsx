'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAuthAndRedirect() {
      console.log('Root page: Checking authentication...');
      try {
        const res = await fetch('/api/auth/me');
        console.log('Root page: Auth response status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('Root page: Auth data:', data);
          
          // Redirect based on user role
          const redirectPath = data.data.user.role === 'admin' ? '/admin' : '/agent';
          console.log('Root page: Redirecting to:', redirectPath);
          router.push(redirectPath);
        } else {
          // No session, redirect to login
          console.log('Root page: No session, redirecting to login');
          router.push('/login');
        }
      } catch (err) {
        console.error('Root page: Auth check failed:', err);
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    }

    checkAuthAndRedirect();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Grocery Admin & Agent</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Grocery Admin & Agent</h1>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
