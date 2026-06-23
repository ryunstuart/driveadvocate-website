\'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock user state for now (we'll make this real later)
    const isNewUser = false;           // Change to true to test new user flow
    const hasActiveDeal = true;        // Change to test different flows

    if (isNewUser) {
      router.push('/onboarding');
    } else if (hasActiveDeal) {
      router.push('/dashboard');
    } else {
      router.push('/welcome-back');   // Choice screen for existing users without active deal
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow p-10">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="mx-auto h-12 mb-4" />
          <h1 className="text-3xl font-bold">Welcome to DriveAdvocate</h1>
        </div>

        <div className="flex mb-8 border-b">
          <button 
            onClick={() => setIsLogin(true)} 
            className={`flex-1 pb-4 ${isLogin ? 'border-b-2 border-emerald-600 font-medium' : ''}`}
          >
            Log In
          </button>
          <button 
            onClick={() => setIsLogin(false)} 
            className={`flex-1 pb-4 ${!isLogin ? 'border-b-2 border-emerald-600 font-medium' : ''}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="email" placeholder="Email" className="w-full p-4 border rounded-2xl" required />
          <input type="password" placeholder="Password" className="w-full p-4 border rounded-2xl" required />
          <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold">
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