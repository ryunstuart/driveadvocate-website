'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ── SWAP THIS URL when your Calendly account is ready ──────────────────────
const CALENDLY_URL = 'https://calendly.com/stuartbrothersllc';
// ───────────────────────────────────────────────────────────────────────────

const SERVICES = [
  {
    name: 'Research Package',
    price: '$149',
    description: 'Expert market report, target prices, and inventory shortlist.',
    features: ['Market price analysis', 'Dealer inventory search', 'Target price recommendation', 'Written report delivered'],
    highlight: false,
  },
  {
    name: 'Negotiation Service',
    price: '$999',
    description: 'Full dealer negotiation, locked OTD price, and coordination.',
    features: ['Everything in Research', 'Direct dealer negotiation', 'OTD price locked in', 'Paperwork coordination', 'Dedicated advocate'],
    highlight: true,
  },
  {
    name: 'Full Concierge',
    price: '$2,250',
    description: 'End-to-end service including sourcing, negotiation, and delivery.',
    features: ['Everything in Negotiation', 'Vehicle sourcing', 'Trade-in handling', 'Financing review', 'Delivery coordination'],
    highlight: false,
  },
];

export default function BookPage() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [calendlyLoaded, setCalendlyLoaded] = useState(false);

  // Load Calendly widget script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.onload = () => setCalendlyLoaded(true);
    document.head.appendChild(script);

    const link = document.createElement('link');
    link.href = 'https://assets.calendly.com/assets/external/widget.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  const calendlyUrlWithService = selectedService
    ? `${CALENDLY_URL}?a1=${encodeURIComponent(selectedService)}`
    : CALENDLY_URL;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-[#f4f4f4] border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="DriveAdvocate" className="h-9" />
            <span className="text-xl font-bold">DriveAdvocate</span>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-slate-500 hover:text-slate-700 transition"
          >
            ← Back to Home
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Page header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Book Your Free Discovery Call</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            A 20-minute call to understand your needs, answer your questions, and match you with the right service level.
          </p>
        </div>

        {/* Service selector */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-center mb-6 text-slate-700">
            Which service are you interested in? <span className="text-slate-400 font-normal">(optional)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SERVICES.map(service => (
              <button
                key={service.name}
                onClick={() => setSelectedService(selectedService === service.name ? null : service.name)}
                className={`text-left p-6 rounded-3xl border-2 transition ${
                  selectedService === service.name
                    ? 'border-emerald-500 bg-emerald-50'
                    : service.highlight
                    ? 'border-emerald-200 bg-white hover:border-emerald-400'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {service.highlight && (
                  <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Most Popular</div>
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-800">{service.name}</h3>
                  <span className={`text-lg font-bold shrink-0 ${selectedService === service.name ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {service.price}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4">{service.description}</p>
                <ul className="space-y-1">
                  {service.features.map(f => (
                    <li key={f} className="text-xs text-slate-600 flex items-center gap-2">
                      <span className="text-emerald-500 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {selectedService === service.name && (
                  <div className="mt-4 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <span>✓</span> Selected
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Calendly embed */}
        <div className="bg-white rounded-3xl shadow overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-xl font-semibold">Pick a Time That Works for You</h2>
            {selectedService && (
              <p className="text-sm text-emerald-600 mt-1">
                You selected: <strong>{selectedService}</strong> — we'll discuss this on the call
              </p>
            )}
          </div>

          {/* Calendly inline widget */}
          <div
            className="calendly-inline-widget"
            data-url={calendlyUrlWithService}
            style={{ minWidth: '320px', height: '700px' }}
          />

          {/* Fallback if Calendly hasn't loaded */}
          {!calendlyLoaded && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400 text-sm">Loading calendar...</p>
              </div>
            </div>
          )}
        </div>

        {/* Reassurance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 text-center">
          <div>
            <div className="text-2xl mb-2">🆓</div>
            <h3 className="font-semibold text-sm mb-1">Free Call</h3>
            <p className="text-xs text-slate-500">No obligation — just a conversation about your next car</p>
          </div>
          <div>
            <div className="text-2xl mb-2">⏱️</div>
            <h3 className="font-semibold text-sm mb-1">20 Minutes</h3>
            <p className="text-xs text-slate-500">Quick and focused — we respect your time</p>
          </div>
          <div>
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-semibold text-sm mb-1">No Pressure</h3>
            <p className="text-xs text-slate-500">We'll only work together if it's the right fit</p>
          </div>
        </div>
      </div>
    </div>
  );
}
