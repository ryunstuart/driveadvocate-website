'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existingUser = users.find((u: any) => u.email.toLowerCase() === cleanEmail);

    if (isLogin) {
      // FLOW: Log In
      if (!existingUser) {
        setError('No account found with that email. Create an account to get started.');
        return;
      }
      localStorage.setItem('currentUser', JSON.stringify(existingUser));

      // Flow 2: returning user with active deal → dashboard
      if (existingUser.hasActiveDeal === true) {
        router.push('/dashboard');
      } else {
        // Flow 3: returning user no active deal → vehicle wizard
        // Check they have a profile first, if not send to profile
        if (existingUser.profileCompleted) {
          router.push('/onboarding/vehicle');
        } else {
          router.push('/onboarding/profile');
        }
      }
    } else {
      // FLOW: Create Account
      if (existingUser) {
        setError('An account with that email already exists. Log in instead.');
        return;
      }

      // Flow 1: new user → profile wizard
      const newUser = {
        email: cleanEmail,
        firstName: '',
        hasActiveDeal: false,
        profileCompleted: false,
        hasCompletedOnboarding: false,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('currentUser', JSON.stringify(newUser));

      router.push('/onboarding/profile');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="DriveAdvocate" className="mx-auto h-12 mb-4" />
          <h1 className="text-3xl font-bold">Welcome to DriveAdvocate</h1>
        </div>

        {/* Tab toggle */}
        <div className="flex mb-8 border-b border-slate-200">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 pb-4 text-lg font-medium transition ${isLogin ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Log In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 pb-4 text-lg font-medium transition ${!isLogin ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold text-lg transition"
          >
            {isLogin ? 'Log In' : 'Create Account'}
          </button>
        </form>

        {/* Helper text */}
        <p className="text-center text-sm text-slate-400 mt-6">
          {isLogin ? (
            <>No account yet?{' '}
              <button onClick={() => { setIsLogin(false); setError(''); }} className="text-emerald-600 hover:underline font-medium">
                Create one
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setIsLogin(true); setError(''); }} className="text-emerald-600 hover:underline font-medium">
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
