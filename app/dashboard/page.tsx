'use client';

import React from 'react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-[#f4f4f4] border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="DriveAdvocate" className="h-9" />
            <span className="text-2xl font-bold text-slate-900">DriveAdvocate</span>
          </div>
          <div className="text-sm text-slate-500">Dashboard</div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-slate-900 mb-3">Good afternoon 👋</h1>
          <p className="text-xl text-slate-600">Your Advocate is working on your deal.</p>
        </div>

        {/* Current Car Being Negotiated */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="aspect-video bg-slate-200 relative">
            <img 
              src="https://images.unsplash.com/photo-1609521263047-f8f205293f24?q=80&w=2070" 
              alt="2025 Toyota Tundra"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur px-5 py-2 rounded-2xl">
              <p className="font-semibold">2025 Toyota Tundra</p>
              <p className="text-sm text-slate-600">Limited TRD • $62,500 target</p>
            </div>
          </div>

          <div className="p-8">
            <div className="flex justify-between items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  NEGOTIATION IN PROGRESS
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-emerald-600">87%</div>
                <p className="text-sm text-slate-500">Complete</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm text-slate-500">Est. Savings</p>
                <p className="text-2xl font-semibold text-emerald-600">$3,850</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Days Active</p>
                <p className="text-2xl font-semibold">11</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Next Update</p>
                <p className="text-2xl font-semibold">Tomorrow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}