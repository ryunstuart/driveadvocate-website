'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomeBack() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow p-12 text-center">
        <div className="mb-8">
          <img src="/logo.png" alt="DriveAdvocate" className="mx-auto h-12 mb-6" />
          <h1 className="text-4xl font-bold">Welcome back, Ryun</h1>
          <p className="text-slate-600 mt-3">What would you like to do?</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full border-2 border-slate-300 hover:border-slate-400 py-6 rounded-3xl text-left px-8 transition"
          >
            <div className="font-semibold text-lg">Go to Dashboard</div>
            <div className="text-slate-500">View your current deals and saved searches</div>
          </button>

          <button
            onClick={() => router.push('/onboarding')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-3xl text-left px-8 transition"
          >
            <div className="font-semibold text-lg">Start a New Deal</div>
            <div className="text-emerald-100">Find a new car and negotiate the best price</div>
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-12">You can always change your mind later</p>
      </div>
    </div>
  );
}