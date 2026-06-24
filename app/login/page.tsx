'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, confirmSignUp, fetchAuthSession } from 'aws-amplify/auth';

type AuthView = 'login' | 'signup' | 'confirm';

export default function Login() {
  const router = useRouter();
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn({ username: email.trim().toLowerCase(), password });

      const session = await fetchAuthSession();
      const groups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[]) || [];
      const isAdvocate = groups.includes('advocates') || groups.includes('admins');

      const currentUser = {
        email: email.trim().toLowerCase(),
        firstName: '',
        isAdvocate,
        hasActiveDeal: !isAdvocate,
      };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp({
        username: email.trim().toLowerCase(),
        password,
        options: {
          userAttributes: {
            email: email.trim().toLowerCase(),
            given_name: firstName,
            family_name: lastName,
          },
        },
      });
      setView('confirm');
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmSignUp({
        username: email.trim().toLowerCase(),
        confirmationCode: confirmCode,
      });
      await signIn({ username: email.trim().toLowerCase(), password });
      const currentUser = {
        email: email.trim().toLowerCase(),
        firstName,
        isAdvocate: false,
        hasActiveDeal: false,
        profileCompleted: false,
      };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      router.push('/onboarding/profile');
    } catch (err: any) {
      setError(err.message || 'Confirmation failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6">
      <div className="max-w-md w-full bg-[#f4f4f4] rounded-3xl shadow-xl p-6 md:p-10">

        <div className="text-center mb-8">
          <img src="/logo.png" alt="DriveAdvocate" className="h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">
            {view === 'login' ? 'Welcome Back' :
             view === 'signup' ? 'Create Account' :
             'Check Your Email'}
          </h1>
          {view === 'confirm' && (
            <p className="text-slate-500 text-sm mt-2">
              We sent a confirmation code to <strong>{email}</strong>
            </p>
          )}
        </div>

        {view !== 'confirm' && (
          <div className="flex mb-8 border-b border-slate-200">
            <button
              onClick={() => { setView('login'); setError(''); }}
              className={`flex-1 pb-4 text-lg font-medium transition ${view === 'login' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Log In
            </button>
            <button
              onClick={() => { setView('signup'); setError(''); }}
              className={`flex-1 pb-4 text-lg font-medium transition ${view === 'signup' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Create Account
            </button>
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold text-lg transition">
              {loading ? 'Signing in...' : 'Log In'}
            </button>
          </form>
        )}

        {view === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
              <input type="text" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
            </div>
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
            <input type="password" placeholder="Password (min 8 characters)" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold text-lg transition">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {view === 'confirm' && (
          <form onSubmit={handleConfirm} className="space-y-5">
            <input type="text" placeholder="Enter confirmation code" value={confirmCode} onChange={e => setConfirmCode(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition text-center text-2xl tracking-widest" />
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold text-lg transition">
              {loading ? 'Confirming...' : 'Confirm Account'}
            </button>
            <button type="button" onClick={() => setView('signup')} className="w-full py-3 text-sm text-slate-500 hover:text-slate-700 transition">
              ← Back to sign up
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
