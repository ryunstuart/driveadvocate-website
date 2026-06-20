'use client';

import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
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
          <div className="p-8 bg-white rounded-2xl shadow">Expert Negotiation - We fight for the best price.</div>
          <div className="p-8 bg-white rounded-2xl shadow">Total Convenience - We handle everything.</div>
          <div className="p-8 bg-white rounded-2xl shadow">Complete Transparency - We work only for you.</div>
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