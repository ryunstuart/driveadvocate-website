'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Footer from '@/app/components/Footer';

type EnrollStep = 'loading' | 'invalid' | 'summary' | 'agreement' | 'complete';

export default function EnrollPage() {
  const { token } = useParams();
  const router = useRouter();
  const [step, setStep] = useState<EnrollStep>('loading');
  const [tokenData, setTokenData] = useState<any>(null);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/enroll?token=${token}`);
        if (!res.ok) { setStep('invalid'); return; }
        const data = await res.json();
        if (!data.tokenRecord || data.tokenRecord.used) { router.push('/dashboard'); return; }
        if (new Date(data.tokenRecord.expiresAt) < new Date()) { setStep('invalid'); return; }
        setTokenData(data.tokenRecord);
        setStep('summary');
      } catch { setStep('invalid'); }
    })();
  }, [token, router]);

  const handleAgreement = async () => {
    if (!agreementChecked) return;
    setLoading(true);
    try {
      await fetch('/api/enroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'sign_agreement' }),
      });
      setStep('complete');
    } catch { }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#f4f4f4] border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <img src="/logo.png" alt="DriveAdvocate" className="h-9" />
          <span className="text-xl font-bold">DriveAdvocate</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 flex-1 w-full">
        {step === 'loading' && (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        )}

        {step === 'invalid' && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">⚠</div>
            <h2 className="text-2xl font-bold mb-2">Link Expired or Invalid</h2>
            <p className="text-slate-500 mb-6">This enrollment link has expired. Contact your advocate for a new link.</p>
            <a href="mailto:info@driveadvocate.com" className="text-emerald-600 hover:underline font-medium">info@driveadvocate.com</a>
          </div>
        )}

        {step === 'summary' && tokenData && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Welcome, {tokenData.clientName?.split(' ')[0]}</h1>
            <p className="text-slate-500">Review your deal details and complete your enrollment.</p>
            <div className="bg-white rounded-3xl shadow p-8">
              <h2 className="font-semibold mb-4">Enrollment Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Client</span><span className="font-medium">{tokenData.clientName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium">{tokenData.clientEmail}</span></div>
              </div>
            </div>
            <button onClick={() => setStep('agreement')} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition">Continue to Agreement</button>
          </div>
        )}

        {step === 'agreement' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Service Agreement</h1>
            <div className="bg-white rounded-3xl shadow p-8 max-h-96 overflow-y-auto text-sm text-slate-600 leading-relaxed">
              <h3 className="font-bold text-slate-800 mb-3">DriveAdvocate Service Agreement v1.0</h3>
              <p className="mb-3">By signing this agreement, you authorize DriveAdvocate to act as your advocate in negotiating the purchase of a vehicle on your behalf.</p>
              <p className="mb-3">DriveAdvocate will contact dealerships, negotiate pricing, and present you with the best available options. The final decision to purchase remains entirely with you.</p>
              <p className="mb-3">DriveAdvocate does not guarantee specific savings or outcomes. Results vary based on market conditions, vehicle availability, and dealer willingness to negotiate.</p>
              <p>This agreement is effective upon electronic signature and payment completion.</p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreementChecked} onChange={e => setAgreementChecked(e.target.checked)} className="mt-1 w-5 h-5 rounded" />
              <span className="text-sm text-slate-600">I have read and agree to the DriveAdvocate Service Agreement. I understand that my electronic signature below constitutes a legal signature.</span>
            </label>
            <button onClick={handleAgreement} disabled={!agreementChecked || loading} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 disabled:bg-slate-300 transition">
              {loading ? 'Processing...' : 'Sign Agreement & Continue'}
            </button>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-3xl font-bold mb-2">Enrollment Complete!</h1>
            <p className="text-slate-500 mb-6">Your advocate will begin working on your deal immediately.</p>
            <button onClick={() => router.push('/dashboard')} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition">Go to Dashboard</button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
