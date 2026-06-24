'use client';

import React from 'react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Navigation Bar */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="DriveAdvocate" className="h-10" />
            <h1 className="text-4xl font-bold text-slate-900">DriveAdvocate</h1>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold mb-2">Welcome back, Ryun!</h2>
            <p className="text-slate-600">Your active deal flow is working correctly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-slate-200 rounded-2xl p-8">
              <h3 className="font-semibold text-xl mb-4">Current Deal Status</h3>
              <p className="text-emerald-600 font-medium">Active Deal ✓</p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-8">
              <h3 className="font-semibold text-xl mb-4">Next Steps</h3>
              <p className="text-slate-600">Your vehicle search is ready.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}