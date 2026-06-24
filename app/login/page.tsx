'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailInput = (e.target as HTMLFormElement).querySelector('input[type="email"]') as HTMLInputElement;
    const email = emailInput.value.trim();

    if (!email) return;

    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    let user = existingUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (user) {
      // Existing User
      localStorage.setItem('currentUser', JSON.stringify(user));

      if (user.hasActiveDeal === true) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding/vehicle');
      }
    } else {
      // New User
      const newUser = {
        email: email,
        firstName: '',
        hasActiveDeal: false,
        hasCompletedOnboarding: false,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('users', JSON.stringify([...existingUsers, newUser]));
      localStorage.setItem('currentUser', JSON.stringify(newUser));

      router.push('/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="DriveAdvocate" className="mx-auto h-12 mb-4" />
          <h1 className="text-3xl font-bold">Welcome to DriveAdvocate</h1>
        </div>

        {/* Toggle */}
        <div className="flex mb-8 border-b border-slate-200">
          <button 
            onClick={() => setIsLogin(true)} 
            className={`flex-1 pb-4 text-lg font-medium ${isLogin ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500'}`}
          >
            Log In
          </button>
          <button 
            onClick={() => setIsLogin(false)} 
            className={`flex-1 pb-4 text-lg font-medium ${!isLogin ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500'}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full p-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600" 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600" 
            required 
          />
          <button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold text-lg transition"
          >
            {isLogin ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-8">
          By signing up, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}