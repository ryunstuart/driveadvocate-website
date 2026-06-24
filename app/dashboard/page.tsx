'use client';

import React from 'react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation - Matching homepage */}
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
          <p className="text-xl text-slate-600">Here's what's happening with your deal.</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-3xl shadow-xl p-10 mb-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                ACTIVE DEAL
              </div>
              <h2 className="text-3xl font-semibold mt-4">2025 Toyota Tundra</h2>
              <p className="text-slate-600 mt-1">$62,500 • Pending Negotiation</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-emerald-600">87%</div>
              <p className="text-sm text-slate-500">Complete</p>
            </div>
          </div>

          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-2 bg-emerald-600 rounded-full w-[87%]"></div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-8 hover:shadow-xl transition cursor-pointer">
            <h3 className="font-semibold text-lg mb-3">View My Deal</h3>
            <p className="text-slate-600">See current offers and negotiation status</p>
          </div>

          <div className="bg-white rounded-3xl p-8 hover:shadow-xl transition cursor-pointer">
            <h3 className="font-semibold text-lg mb-3">Update Preferences</h3>
            <p className="text-slate-600">Change budget, vehicle type, or features</p>
          </div>

          <div className="bg-white rounded-3xl p-8 hover:shadow-xl transition cursor-pointer">
            <h3 className="font-semibold text-lg mb-3">Message Advocate</h3>
            <p className="text-slate-600">Talk directly with your negotiator</p>
          </div>
        </div>
      </div>
    </div>
  );
}