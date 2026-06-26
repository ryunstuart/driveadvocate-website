'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, setUpTOTP, verifyTOTPSetup, updateMFAPreference } from 'aws-amplify/auth';
import { QRCodeSVG } from 'qrcode.react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function MFASetup() {
  const router = useRouter();
  const [step, setStep] = useState<'loading' | 'qr' | 'verify' | 'done'>('loading');
  const [setupUri, setSetupUri] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const fromLogin = sessionStorage.getItem('mfaSetupRequired');
        if (fromLogin) sessionStorage.removeItem('mfaSetupRequired');

        await getCurrentUser();
        const totpSetup = await setUpTOTP();
        const uri = totpSetup.getSetupUri('DriveAdvocate');
        setSetupUri(uri.toString());
        setSecretKey(totpSetup.sharedSecret);
        setStep('qr');
      } catch (err) {
        console.error('MFA setup failed:', err);
        router.push('/login');
      }
    })();
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyTOTPSetup({ code });
      await updateMFAPreference({ totp: 'PREFERRED' });
      setStep('done');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">

          {step === 'loading' && (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 text-sm">Setting up authenticator...</p>
            </div>
          )}

          {step === 'qr' && (
            <div>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🔐</div>
                <h1 className="text-2xl font-bold mb-2">Set Up Two-Factor Authentication</h1>
                <p className="text-slate-500 text-sm">Scan this QR code with Google Authenticator, Authy, or any TOTP app</p>
              </div>

              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl">
                  <QRCodeSVG value={setupUri} size={200} />
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                <div className="text-xs text-slate-500 mb-1">Or enter this key manually:</div>
                <div className="font-mono text-sm text-slate-700 break-all select-all">{secretKey}</div>
              </div>

              <button onClick={() => setStep('verify')} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition">
                I've Scanned the Code
              </button>
            </div>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerify}>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🔢</div>
                <h1 className="text-2xl font-bold mb-2">Verify Your Authenticator</h1>
                <p className="text-slate-500 text-sm">Enter the 6-digit code from your authenticator app</p>
              </div>

              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
                className="w-full p-4 border border-slate-300 rounded-2xl text-center text-3xl tracking-widest font-mono focus:outline-none focus:border-emerald-500 transition mb-5"
              />

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl mb-5">{error}</div>}

              <button type="submit" disabled={loading || code.length !== 6} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 disabled:bg-slate-300 transition">
                {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
              </button>

              <button type="button" onClick={() => setStep('qr')} className="w-full py-3 text-sm text-slate-500 hover:text-slate-700 transition mt-3">
                Back to QR Code
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-2xl font-bold mb-2">2FA Enabled!</h1>
              <p className="text-slate-500 text-sm">Your account is now protected with two-factor authentication. Redirecting...</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
