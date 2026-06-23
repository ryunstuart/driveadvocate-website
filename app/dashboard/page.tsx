'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Dashboard() {
  const router = useRouter();

  const user = {
    name: "Ryun",
    preferredVehicle: "2025 Toyota Camry SE",
    status: "Looking for Best Deal",
    savedDeals: 3,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Matching Homepage Style */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              DA
            </div>
            <div>
              <div className="font-bold text-2xl tracking-tight">DriveAdvocate</div>
              <div className="text-[10px] text-slate-500 -mt-1">Your Voice at the Dealership</div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-8 text-sm font-medium">
            <a href="#" className="text-slate-600 hover:text-emerald-600 transition">Find Cars</a>
            <a href="#" className="text-slate-600 hover:text-emerald-600 transition">My Preferences</a>
            <a href="#" className="text-slate-600 hover:text-emerald-600 transition">Saved Deals</a>
            <a href="#" className="text-slate-600 hover:text-emerald-600 transition">Negotiation Tools</a>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/onboarding')}
              className="text-emerald-600 hover:underline text-sm font-medium"
            >
              Edit Preferences
            </button>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-medium text-sm">Ryun Stuart</div>
                <div className="text-xs text-emerald-600">Member</div>
              </div>
              <div className="w-9 h-9 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-semibold">
                RS
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold">Welcome back, {user.name} 👋</h1>
          <p className="text-slate-600 mt-2">Here's what's happening with your car search</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-3xl p-8 mb-8 shadow">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-emerald-600 font-medium">Current Search</div>
              <div className="text-3xl font-semibold mt-2">{user.preferredVehicle}</div>
              <div className="mt-1 text-slate-500">{user.status}</div>
            </div>
            <button 
              onClick={() => router.push('/search')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl transition"
            >
              Find New Deals
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-3xl p-8 shadow">
            <div className="text-4xl font-bold text-emerald-600">{user.savedDeals}</div>
            <div className="text-slate-600 mt-2">Saved Deals</div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow">
            <div className="text-4xl font-bold">87%</div>
            <div className="text-slate-600 mt-2">Avg. Savings Target</div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow">
            <div className="text-4xl font-bold">12</div>
            <div className="text-slate-600 mt-2">Dealers Contacted</div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-3xl p-8 shadow">
          <h2 className="text-2xl font-semibold mb-6">Next Steps</h2>
          <div className="space-y-6">
            <div className="flex gap-6 items-start">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div className="flex-1">
                <div className="font-medium">Review Dealer Quotes</div>
                <div className="text-slate-500">3 new quotes match your preferences</div>
              </div>
              <button className="ml-auto text-emerald-600 hover:underline">View →</button>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div className="flex-1">
                <div className="font-medium">Submit Your Offer</div>
                <div className="text-slate-500">We recommend starting 8-12% below MSRP</div>
              </div>
              <button className="ml-auto text-emerald-600 hover:underline">Prepare Offer →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}