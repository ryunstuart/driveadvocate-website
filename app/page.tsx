'use client';

import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header - Grey to match logo background */}
      <header className="bg-slate-800 text-white sticky top-0 z-50 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="DriveAdvocate" className="h-10" />
            <span className="text-2xl font-bold">DriveAdvocate</span>
          </div>
          <nav className="flex gap-8 text-sm font-medium">
            <a href="#how" className="hover:text-emerald-400 transition">How It Works</a>
            <a href="#pricing" className="hover:text-emerald-400 transition">Pricing</a>
            <a href="#book" className="hover:text-emerald-400 transition">Book a Call</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-6xl font-bold mb-6">Your Voice at the Dealership Table</h1>
          <p className="text-2xl text-slate-300 mb-10">Professional car buying advocates who negotiate for you.<br />Skip the stress and get the deal you deserve.</p>
          <div className="flex justify-center gap-4">
            <a href="#book" className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-xl text-lg font-semibold">Book a Free Discovery Call</a>
            <a href="#how" className="border border-white hover:bg-white hover:text-slate-900 text-white px-8 py-4 rounded-xl text-lg font-semibold">See How It Works</a>
          </div>
        </div>
      </div>

      {/* Trust Bar */}
      <div className="bg-slate-100 py-4 text-center text-slate-600 font-medium">
        100% Buyer-Focused • Average Savings $2,500+ • Transparent Process • No Dealer Kickbacks
      </div>

      {/* Why Us */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Why Choose DriveAdvocate</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 bg-white rounded-2xl shadow">Expert Negotiation - We fight for the best price and remove junk fees.</div>
          <div className="p-8 bg-white rounded-2xl shadow">Total Convenience - We handle research, paperwork, and coordination.</div>
          <div className="p-8 bg-white rounded-2xl shadow">Complete Transparency - We work only for you with clear updates.</div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-slate-50 py-20" id="how">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl mb-4 text-emerald-600">1</div>
              <h3 className="font-semibold mb-2">Tell Us What You Want</h3>
              <p className="text-slate-600">Quick call or short form</p>
            </div>
            <div>
              <div className="text-5xl mb-4 text-emerald-600">2</div>
              <h3 className="font-semibold mb-2">We Research & Negotiate</h3>
              <p className="text-slate-600">We do the hard work with dealers</p>
            </div>
            <div>
              <div className="text-5xl mb-4 text-emerald-600">3</div>
              <h3 className="font-semibold mb-2">You Review & Approve</h3>
              <p className="text-slate-600">Clear options presented to you</p>
            </div>
            <div>
              <div className="text-5xl mb-4 text-emerald-600">4</div>
              <h3 className="font-semibold mb-2">Drive Away Happy</h3>
              <p className="text-slate-600">We handle the final details</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-slate-900 text-white py-20 text-center" id="book">
        <h2 className="text-4xl font-bold mb-6">Ready to Buy Your Next Car the Smart Way?</h2>
        <a href="#" className="bg-emerald-600 hover:bg-emerald-700 px-12 py-5 rounded-2xl text-xl font-semibold">Book Your Free Discovery Call</a>
      </div>
    </div>
  );
}