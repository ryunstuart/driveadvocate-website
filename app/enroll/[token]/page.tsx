'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { dataClient } from '@/app/lib/amplify-data';
import Footer from '@/app/components/Footer';

type EnrollStep = 'loading' | 'invalid' | 'summary' | 'agreement' | 'payment' | 'complete';

export default function EnrollPage() {
  const { token } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<EnrollStep>('loading');
  const [tokenData, setTokenData] = useState<any>(null);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const cancelled = searchParams.get('cancelled');

  useEffect(() => {
    (async () => {
      try {
        console.log('Validating token:', token);
        const result = await dataClient.queries.getOnboardingToken(
          { token: token as string },
          { authMode: 'apiKey' },
        );
        console.log('Token result:', result);

        if (!result.data) { console.log('Token not found'); setStep('invalid'); return; }
        if (result.data.used) { console.log('Token used'); router.push('/dashboard'); return; }
        if (new Date(result.data.expiresAt as string) < new Date()) { console.log('Token expired'); setStep('invalid'); return; }

        setTokenData(result.data);
        if (result.data.agreementAccepted) { setStep('payment'); }
        else { setStep('summary'); }
      } catch (err) {
        console.error('Token validation error:', err);
        setStep('invalid');
      }
    })();
  }, [token, router]);

  const handleAgreement = async () => {
    if (!agreementChecked) return;
    setLoading(true);
    try {
      await fetch('/api/enroll', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'sign_agreement' }),
      });
      setStep('payment');
    } catch {}
    setLoading(false);
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token, dealId: tokenData.dealId,
          clientEmail: tokenData.clientEmail, clientName: tokenData.clientName,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setLoading(false);
    } catch { setLoading(false); }
  };

  const steps = ['Summary', 'Agreement', 'Payment'];
  const stepIdx: Record<string, number> = { summary: 0, agreement: 1, payment: 2, complete: 3 };
  const currentIdx = stepIdx[step] ?? 0;

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

        {!['loading', 'invalid'].includes(step) && (
          <div className="flex items-center justify-center gap-2 mb-10">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= currentIdx ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {i < currentIdx ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${i === currentIdx ? 'text-slate-800' : 'text-slate-400'}`}>{s}</span>
                {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < currentIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
        )}

        {step === 'summary' && tokenData && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Welcome, {(tokenData.clientName as string)?.split(' ')[0]}</h1>
            <p className="text-slate-500">Review your enrollment details.</p>
            <div className="bg-white rounded-3xl shadow p-8">
              <h2 className="font-semibold mb-4">Your Enrollment</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Client</span><span className="font-medium">{tokenData.clientName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium">{tokenData.clientEmail}</span></div>
                <div className="flex justify-between border-t border-slate-100 pt-3"><span className="text-slate-500">Service</span><span className="font-semibold">DriveAdvocate Negotiation Service</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Price</span><span className="font-bold text-emerald-700 text-lg">$899</span></div>
              </div>
              <div className="mt-4 bg-emerald-50 rounded-2xl p-4 text-sm text-emerald-700">Have a discount code? You'll be able to apply it on the payment page.</div>
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
              <p className="mb-3">Service fee of $899 is non-refundable once dealership outreach has begun. If no suitable vehicle is found within 60 days, a partial credit may be applied toward a future search at DriveAdvocate&apos;s discretion.</p>
              <p>This agreement is effective upon electronic signature and payment completion.</p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreementChecked} onChange={e => setAgreementChecked(e.target.checked)} className="mt-1 w-5 h-5 rounded" />
              <span className="text-sm text-slate-600">I have read and agree to the DriveAdvocate Service Agreement. I understand that my electronic signature constitutes a legal signature.</span>
            </label>
            <button onClick={handleAgreement} disabled={!agreementChecked || loading} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 disabled:bg-slate-300 transition">
              {loading ? 'Processing...' : 'Sign Agreement & Continue to Payment'}
            </button>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Complete Payment</h1>
            {cancelled && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-2xl">Payment was cancelled. You can try again below.</div>
            )}
            <div className="bg-white rounded-3xl shadow p-8">
              <h2 className="font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">DriveAdvocate Negotiation Service</span><span className="font-semibold">$899</span></div>
                <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-lg"><span>Total</span><span className="text-emerald-700">$899</span></div>
              </div>
              <div className="mt-4 bg-blue-50 rounded-2xl p-3 text-sm text-blue-700">Have a discount code? Enter it on the next screen during checkout.</div>
            </div>
            <div className="bg-white rounded-3xl shadow p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🔒</span>
                <div><div className="font-semibold text-sm">Secure Checkout via Stripe</div><div className="text-xs text-slate-500">Your payment info is handled securely by Stripe.</div></div>
              </div>
              <button onClick={handlePayment} disabled={loading} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 disabled:bg-slate-300 transition text-lg">
                {loading ? 'Redirecting to checkout...' : 'Pay $899 →'}
              </button>
            </div>
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
