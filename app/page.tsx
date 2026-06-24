'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Header */}
      <header className="bg-[#f4f4f4] text-slate-900 sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="DriveAdvocate" className="h-9" />
            <span className="text-xl font-bold">DriveAdvocate</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#how" className="hover:text-emerald-600 transition">How It Works</a>
            <a href="#pricing" className="hover:text-emerald-600 transition">Pricing</a>
            <a href="/book" className="hover:text-emerald-600 transition">Book a Call</a>
            <Link href="/login" className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-2xl text-sm font-semibold transition">
              Log In
            </Link>
          </nav>

          {/* Mobile: Log In + Hamburger */}
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
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-[#f4f4f4] px-6 py-4 space-y-3">
            <a href="#how" onClick={() => setMenuOpen(false)} className="block text-sm font-medium hover:text-emerald-600 py-2">How It Works</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} className="block text-sm font-medium hover:text-emerald-600 py-2">Pricing</a>
            <a href="/book" onClick={() => setMenuOpen(false)} className="block text-sm font-medium hover:text-emerald-600 py-2">Book a Call</a>
          </div>
        )}
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16 md:py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Your Voice at the<br />Dealership Table</h1>
          <p className="text-lg md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Professional car buying advocates who negotiate for you. Skip the stress and get the deal you deserve.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/book" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl text-base md:text-lg font-semibold transition">
              Book a Free Discovery Call
            </a>
            <a href="#how" className="border border-white hover:bg-white hover:text-slate-900 text-white px-8 py-4 rounded-xl text-base md:text-lg font-semibold transition">
              See How It Works
            </a>
          </div>
        </div>
      </div>

      {/* Why Us */}
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Why Choose DriveAdvocate</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 md:p-8 bg-white rounded-2xl shadow">
            <div className="text-2xl mb-3">💪</div>
            <h3 className="font-semibold text-lg mb-2">Expert Negotiation</h3>
            <p className="text-slate-600 text-sm">We fight for the best price and remove junk fees on your behalf.</p>
          </div>
          <div className="p-6 md:p-8 bg-white rounded-2xl shadow">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="font-semibold text-lg mb-2">Total Convenience</h3>
            <p className="text-slate-600 text-sm">We handle research, paperwork, and coordination — you just approve.</p>
          </div>
          <div className="p-6 md:p-8 bg-white rounded-2xl shadow">
            <div className="text-2xl mb-3">🔍</div>
            <h3 className="font-semibold text-lg mb-2">Complete Transparency</h3>
            <p className="text-slate-600 text-sm">We work only for you with clear updates every step of the way.</p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-slate-50 py-16 md:py-20" id="pricing">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow text-center">
              <h3 className="text-xl font-semibold mb-2">Research Package</h3>
              <p className="text-4xl md:text-5xl font-bold text-emerald-600 mb-4">$149</p>
              <p className="text-slate-600 mb-6 text-sm">Expert market report, target prices, and inventory shortlist.</p>
              <a href="/book" className="block w-full bg-slate-900 text-white py-3 rounded-2xl text-sm font-medium hover:bg-slate-800 transition">
                Choose Research
              </a>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow text-center border-2 border-emerald-600 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-1 rounded-full text-sm font-medium whitespace-nowrap">Most Popular</div>
              <h3 className="text-xl font-semibold mb-2">Negotiation Service</h3>
              <p className="text-4xl md:text-5xl font-bold text-emerald-600 mb-4">$999</p>
              <p className="text-slate-600 mb-6 text-sm">Full dealer negotiation, locked OTD price, and coordination.</p>
              <a href="/book" className="block w-full bg-emerald-600 text-white py-3 rounded-2xl text-sm font-medium hover:bg-emerald-700 transition">
                Choose Negotiation
              </a>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow text-center">
              <h3 className="text-xl font-semibold mb-2">Full Concierge</h3>
              <p className="text-4xl md:text-5xl font-bold text-emerald-600 mb-4">$2,250</p>
              <p className="text-slate-600 mb-6 text-sm">End-to-end service including sourcing and delivery.</p>
              <a href="/book" className="block w-full bg-slate-900 text-white py-3 rounded-2xl text-sm font-medium hover:bg-slate-800 transition">
                Choose Concierge
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 md:py-20" id="how">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-3 text-emerald-600">1</div>
              <h3 className="font-semibold mb-1 text-sm md:text-base">Tell Us What You Want</h3>
              <p className="text-slate-600 text-xs md:text-sm">Quick call or short form</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-3 text-emerald-600">2</div>
              <h3 className="font-semibold mb-1 text-sm md:text-base">We Research & Negotiate</h3>
              <p className="text-slate-600 text-xs md:text-sm">We do the hard work with dealers</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-3 text-emerald-600">3</div>
              <h3 className="font-semibold mb-1 text-sm md:text-base">You Review & Approve</h3>
              <p className="text-slate-600 text-xs md:text-sm">Clear options presented to you</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-3 text-emerald-600">4</div>
              <h3 className="font-semibold mb-1 text-sm md:text-base">Drive Away Happy</h3>
              <p className="text-slate-600 text-xs md:text-sm">We handle the final details</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-slate-100 py-8 text-center text-xs md:text-sm text-slate-500 border-t">
        <div className="max-w-4xl mx-auto px-6">
          <p><strong>Legal Disclaimer:</strong> DriveAdvocate provides advocacy and negotiation services only. We do not guarantee specific savings or outcomes. Actual results vary. See our full Service Agreement for details.</p>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-slate-900 text-white py-16 md:py-20 text-center" id="book">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Buy Your Next Car the Smart Way?</h2>
          <p className="text-slate-300 mb-8 text-sm md:text-base">Join hundreds of buyers who got a better deal with DriveAdvocate.</p>
          <a href="mailto:hello@driveadvocate.com" className="inline-block bg-emerald-600 hover:bg-emerald-700 px-10 py-4 rounded-2xl text-lg font-semibold transition">
            Book Your Free Discovery Call
          </a>
        </div>
      </div>
    </div>
  );
}
