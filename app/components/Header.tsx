'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';

interface HeaderProps {
  variant?: 'public' | 'authenticated';
  showBack?: { label: string; href: string };
}

export default function Header({ variant = 'public', showBack }: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (variant === 'authenticated') {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.email) setUser(currentUser);
    }
  }, [variant]);

  const handleLogout = async () => {
    try { await signOut(); } catch {}
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  return (
    <header className="bg-[#f4f4f4] text-slate-900 sticky top-0 z-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href={variant === 'authenticated' ? '/dashboard' : '/'} className="flex items-center gap-3">
          <img src="/logo.png" alt="DriveAdvocate" className="h-9" />
          <span className="text-xl font-bold">DriveAdvocate</span>
          {user?.isAdvocate && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium ml-1">Advocate</span>
          )}
        </Link>

        {variant === 'public' && (
          <>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="/#how" className="hover:text-emerald-600 transition">How It Works</a>
              <a href="/#pricing" className="hover:text-emerald-600 transition">Pricing</a>
              <a href="/book" className="hover:text-emerald-600 transition">Book a Call</a>
              <Link href="/login" className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-2xl text-sm font-semibold transition">
                Log In
              </Link>
            </nav>
            <div className="flex items-center gap-3 md:hidden">
              <Link href="/login" className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                Log In
              </Link>
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-xl hover:bg-slate-200 transition">
                <div className="w-5 h-0.5 bg-slate-700 mb-1" />
                <div className="w-5 h-0.5 bg-slate-700 mb-1" />
                <div className="w-5 h-0.5 bg-slate-700" />
              </button>
            </div>
            {menuOpen && (
              <div className="absolute top-full left-0 right-0 bg-[#f4f4f4] border-b border-slate-200 md:hidden">
                <div className="px-6 py-4 space-y-3">
                  <a href="/#how" className="block text-sm font-medium hover:text-emerald-600 transition" onClick={() => setMenuOpen(false)}>How It Works</a>
                  <a href="/#pricing" className="block text-sm font-medium hover:text-emerald-600 transition" onClick={() => setMenuOpen(false)}>Pricing</a>
                  <a href="/book" className="block text-sm font-medium hover:text-emerald-600 transition" onClick={() => setMenuOpen(false)}>Book a Call</a>
                </div>
              </div>
            )}
          </>
        )}

        {variant === 'authenticated' && (
          <div className="flex items-center gap-4 md:gap-6">
            {showBack && (
              <button onClick={() => router.push(showBack.href)} className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition hidden md:block">
                {showBack.label}
              </button>
            )}
            {user?.isAdvocate && (
              <>
                <button onClick={() => router.push('/dashboard')} className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition hidden md:block">Dashboard</button>
                <button onClick={() => router.push('/negotiation')} className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition hidden md:block">Queue</button>
                <button onClick={() => router.push('/account')} className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition hidden md:block">Settings</button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="text-sm bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-2xl font-semibold transition"
            >
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
