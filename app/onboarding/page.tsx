'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const router = useRouter();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    // If user already has profile, skip to vehicle
    if (currentUser.profileCompleted) {
      router.push('/onboarding/vehicle');
    } else {
      router.push('/onboarding/profile');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500">Redirecting...</p>
    </div>
  );
}