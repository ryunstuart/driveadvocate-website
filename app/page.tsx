'use client';

import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="bg-[#f4f4f4] text-slate-900 sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="DriveAdvocate" className="h-10" />
            <span className="text-2xl font-bold">DriveAdvocate</span>
          </div>
          <nav className="flex gap-8 text-sm font-medium">
            <a href="#how" className="hover:text-emerald-600 transition">How It Works</a>
            <a href="#pricing" className="hover:text-emerald-600 transition">Pricing</a>
            <a href="#book" className="hover:text-emerald-600 transition">Book a Call</a>
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

      {/* Why Us */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Why Choose DriveAdvocate</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 bg-white rounded-2xl shadow">Expert Negotiation - We fight for the best price and remove junk fees.</div>
          <div className="p-8 bg-white rounded-2xl shadow">Total Convenience - We handle research, paperwork, and coordination.</div>
          <div className="p-8 bg-white rounded-2xl shadow">Complete Transparency - We work only for you with clear updates.</div>
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-6xl mx-auto px-6 py-20 bg-slate-50" id="pricing">
        <h2 className="text-4xl font-bold text-center mb-12">Our Services</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow text-center">
            <h3 className="text-2xl font-semibold mb-2">Research Package</h3>
            <p className="text-5xl font-bold text-emerald-600 mb-4">$149</p>
            <p className="text-slate-600 mb-6">Expert market report, target prices, and inventory shortlist.</p>
            <button className="w-full bg-slate-900 text-white py-3 rounded-2xl">Choose Research</button>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow text-center border-2 border-emerald-600 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-1 rounded-full text-sm">Most Popular</div>
            <h3 className="text-2xl font-semibold mb-2">Negotiation Service</h3>
            <p className="text-5xl font-bold text-emerald-600 mb-4">$999</p>
            <p className="text-slate-600 mb-6">Full dealer negotiation, locked OTD price, and coordination.</p>
            <button className="w-full bg-emerald-600 text-white py-3 rounded-2xl">Choose Negotiation</button>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow text-center">
            <h3 className="text-2xl font-semibold mb-2">Full Concierge</h3>
            <p className="text-5xl font-bold text-emerald-600 mb-4">$2,250</p>
            <p className="text-slate-600 mb-6">End-to-end service including sourcing and delivery.</p>
            <button className="w-full bg-slate-900 text-white py-3 rounded-2xl">Choose Concierge</button>
          </div>
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

      {/* Legal Disclaimer */}
      <div className="bg-slate-100 py-12 text-center text-sm text-slate-500 border-t">
        <div className="max-w-4xl mx-auto px-6">
          <p><strong>Legal Disclaimer:</strong> DriveAdvocate provides advocacy and negotiation services only. We do not guarantee specific savings or outcomes. Actual results vary. See our full Service Agreement for details.</p>
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