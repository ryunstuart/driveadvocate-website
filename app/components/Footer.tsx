'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#f4f4f4] text-slate-600 py-10 mt-auto border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="DriveAdvocate" className="h-7" />
            <span className="text-slate-900 font-semibold">DriveAdvocate</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/book" className="text-slate-600 hover:text-emerald-600 transition">Book a Call</Link>
            <Link href="/terms" className="text-slate-600 hover:text-emerald-600 transition">Terms of Service</Link>
            <a href="mailto:info@driveadvocate.com" className="text-emerald-600 hover:text-emerald-700 transition">Contact</a>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} DriveAdvocate. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
