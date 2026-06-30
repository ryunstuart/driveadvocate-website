'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Footer from '@/app/components/Footer';

export const dynamic = 'force-dynamic';

function EnrollSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        await fetch('/api/enroll', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action: 'mark_used' }),
        });
        setVerified(true);
      } catch {}
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#f4f4f4] border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <img src="/logo.png" alt="DriveAdvocate" className="h-9" />
          <span className="text-xl font-bold">DriveAdvocate</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3">Payment Confirmed!</h1>
          <p className="text-slate-500 mb-2">Your enrollment is complete. Your advocate will begin working on your deal immediately.</p>
          <p className="text-sm text-slate-400 mb-8">You'll receive a confirmation email shortly.</p>

          <div className="bg-white rounded-3xl shadow p-6 mb-6 text-left">
            <h2 className="font-semibold mb-3">What happens next</h2>
            <div className="space-y-3">
              {[
                { icon: '✓', text: 'Payment confirmed', done: true },
                { icon: '📋', text: 'Your advocate reviews your vehicle preferences', done: false },
                { icon: '📞', text: 'Dealership outreach begins within 24 hours', done: false },
                { icon: '📧', text: 'You\'ll get updates as we negotiate', done: false },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{step.icon}</span>
                  <span className={step.done ? 'font-medium text-slate-800' : 'text-slate-500'}>{step.text}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => { window.location.href = '/dashboard'; }} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition">
            Go to My Dashboard
          </button>
          <p className="text-xs text-slate-400 mt-3">You'll receive a confirmation email shortly.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function EnrollSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
      </div>
    }>
      <EnrollSuccessContent />
    </Suspense>
  );
}
