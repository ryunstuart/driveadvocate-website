'use client';

import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-6xl font-bold mb-6">
            Your Voice at the Dealership Table
          </h1>
          <p className="text-2xl text-slate-300 mb-10 max-w-3xl mx-auto">
            Professional car buying advocates who negotiate for you.<br />
            Skip the stress and get the deal you deserve.
          </p>
          <div className="flex justify-center gap-4">
            <a href="#book" className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-xl text-lg font-semibold">
              Book a Free Discovery Call
            </a>
            <a href="#how" className="border border-white hover:bg-white hover:text-slate-900 text-white px-8 py-4 rounded-xl text-lg font-semibold">
              See How It Works
            </a>
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
          <div className="p-8 bg-white rounded-2xl shadow">
            <h3 className="text-2xl font-semibold mb-3">Expert Negotiation</h3>
            <p className="text-slate-600">We fight for the best price and remove junk fees.</p>
          </div>
          <div className="p-8 bg-white rounded-2xl shadow">
            <h3 className="text-2xl font-semibold mb-3">Total Convenience</h3>
            <p className="text-slate-600">We handle research, paperwork, and coordination.</p>
          </div>
          <div className="p-8 bg-white rounded-2xl shadow">
            <h3 className="text-2xl font-semibold mb-3">Complete Transparency</h3>
            <p className="text-slate-600">We work only for you. Clear updates every step.</p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-slate-900 text-white py-20 text-center" id="book">
        <h2 className="text-4xl font-bold mb-6">Ready to Buy Your Next Car the Smart Way?</h2>
        <a href="https://calendly.com" className="bg-emerald-600 hover:bg-emerald-700 px-12 py-5 rounded-2xl text-xl font-semibold">
          Book Your Free Discovery Call
        </a>
      </div>
    </div>
  );
}