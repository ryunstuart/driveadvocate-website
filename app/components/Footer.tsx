'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="DriveAdvocate" className="h-7 brightness-200" />
            <span className="text-white font-semibold">DriveAdvocate</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/book" className="hover:text-white transition">Book a Call</Link>
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <a href="mailto:info@driveadvocate.com" className="hover:text-white transition">Contact</a>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} DriveAdvocate. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
