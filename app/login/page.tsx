'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signIn, confirmSignIn, signOut, fetchAuthSession,
  resetPassword, confirmResetPassword, fetchMFAPreference,
  getCurrentUser,
} from 'aws-amplify/auth';
import { dataClient } from '@/app/lib/amplify-data';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Eye, EyeOff } from 'lucide-react';

type AuthView = 'login' | 'forgot' | 'reset' | 'mfa';

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    signOut().catch(() => {});
  }, []);

  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('email') || '';
    }
    return '';
  });
  const postPayment = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('postpayment') === 'true'
    : false;
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const signInResult = await signIn({ username: normalizedEmail, password });

      if (signInResult.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
        setView('mfa');
        setLoading(false);
        return;
      }

      await completeLogin(normalizedEmail);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const ADMIN_EMAILS = ['ryun@driveadvocate.com', 'keith@driveadvocate.com'];

  const completeLogin = async (normalizedEmail: string) => {
    const session = await fetchAuthSession();
    const groups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[]) || [];

    const isAdmin = ADMIN_EMAILS.includes(normalizedEmail) || groups.includes('admins');
    const isAdvocate = groups.includes('advocates') || isAdmin;

    let clientFirstName = '';
    let activeDealId = '';
    if (!isAdvocate) {
      try {
        const { data: clients } = await dataClient.models.Client.list({ filter: { email: { eq: normalizedEmail } } });
        if (clients.length > 0) clientFirstName = clients[0].firstName;
      } catch (err) {
        console.warn('Client lookup failed:', err);
      }
      try {
        const { data: deals } = await dataClient.models.Deal.list({ filter: { clientId: { eq: normalizedEmail } } });
        const activeDeal = deals.find((d: any) => d.status !== 'Complete' && d.status !== 'Dead');
        if (activeDeal) activeDealId = activeDeal.id;
      } catch (err) {
        console.warn('Deal lookup failed:', err);
      }
    }

    const currentUser = {
      email: normalizedEmail, firstName: clientFirstName,
      isAdvocate, isAdmin, hasActiveDeal: !!activeDealId,
      activeDealId: activeDealId || undefined,
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    if (isAdvocate) {
      try {
        const mfaPref = await fetchMFAPreference();
        if (!mfaPref.preferred && !mfaPref.enabled?.includes('TOTP')) {
          sessionStorage.setItem('mfaSetupRequired', 'true');
          router.push('/mfa-setup');
          return;
        }
      } catch {}
    }

    const params = new URLSearchParams(window.location.search);
    router.push(params.get('redirect') || '/dashboard');
  };

  const handleMFAChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmSignIn({ challengeResponse: mfaCode });
      await completeLogin(email.trim().toLowerCase());
    } catch (err: any) {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword({ username: email.trim().toLowerCase() });
      setView('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmResetPassword({
        username: email.trim().toLowerCase(),
        confirmationCode: resetCode,
        newPassword,
      });
      setSuccess('Password reset successfully. You can now log in.');
      setPassword('');
      setResetCode('');
      setNewPassword('');
      setView('login');
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="public" />
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
      <div className="max-w-md w-full bg-[#f4f4f4] rounded-3xl shadow-xl p-6 md:p-10">

        <div className="text-center mb-8">
          <img src="/logo.png" alt="DriveAdvocate" className="h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">
            {view === 'login' ? 'Welcome Back' :
             view === 'forgot' ? 'Forgot Password' :
             view === 'mfa' ? 'Verify Identity' :
             'Reset Password'}
          </h1>
          {view === 'forgot' && (
            <p className="text-slate-500 text-sm mt-2">
              Enter your email and we'll send you a reset code.
            </p>
          )}
          {view === 'reset' && (
            <p className="text-slate-500 text-sm mt-2">
              Enter the code sent to <strong>{email}</strong> and your new password.
            </p>
          )}
        </div>

        {postPayment && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-2xl mb-5">
            Payment confirmed! Log in to view your dashboard.
          </div>
        )}
        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-2xl mb-5">{success}</div>}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-4 pr-12 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold text-lg transition">
              {loading ? 'Signing in...' : 'Log In'}
            </button>
            <button type="button" onClick={() => { setView('forgot'); setError(''); setSuccess(''); }} className="w-full py-2 text-sm text-slate-500 hover:text-emerald-600 transition">
              Forgot your password?
            </button>
            <div className="text-center mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">New to DriveAdvocate? <a href="/book" className="text-emerald-600 hover:underline font-medium">Book your free discovery call →</a></p>
            </div>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold text-lg transition">
              {loading ? 'Sending code...' : 'Send Reset Code'}
            </button>
            <button type="button" onClick={() => { setView('login'); setError(''); setSuccess(''); }} className="w-full py-3 text-sm text-slate-500 hover:text-slate-700 transition">
              ← Back to log in
            </button>
          </form>
        )}

        {view === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <input type="text" placeholder="Enter reset code" value={resetCode} onChange={e => setResetCode(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition text-center text-2xl tracking-widest" />
            <div className="relative">
              <input type={showNewPassword ? 'text' : 'password'} placeholder="New password (min 8 characters)" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} className="w-full p-4 pr-12 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold text-lg transition">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button type="button" onClick={() => { setView('login'); setError(''); setSuccess(''); }} className="w-full py-3 text-sm text-slate-500 hover:text-slate-700 transition">
              ← Back to log in
            </button>
          </form>
        )}

        {view === 'mfa' && (
          <form onSubmit={handleMFAChallenge} className="space-y-5">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔐</div>
              <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
              <p className="text-slate-500 text-sm mt-1">Enter the 6-digit code from your authenticator app</p>
            </div>
            <input
              type="text"
              value={mfaCode}
              onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              autoFocus
              className="w-full p-4 border border-slate-300 rounded-2xl text-center text-3xl tracking-widest font-mono bg-white focus:outline-none focus:border-emerald-500 transition"
            />
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{error}</div>}
            <button type="submit" disabled={loading || mfaCode.length !== 6} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold text-lg transition">
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
}
