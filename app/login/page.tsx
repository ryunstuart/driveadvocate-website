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

      if (user.hasActiveDeal) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding/vehicle');   // Skip profile → go straight to vehicle
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

      router.push('/onboarding');   // Full onboarding for new users
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-[#f4f4f4] rounded-3xl shadow p-10">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="mx-auto h-12 mb-4" />
          <h1 className="text-3xl font-bold">Welcome to DriveAdvocate</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full p-4 border rounded-2xl bg-white" 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-4 border rounded-2xl bg-white" 
            required 
          />
          <button 
            type="submit" 
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold"
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