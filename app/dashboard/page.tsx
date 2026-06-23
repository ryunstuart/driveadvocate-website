'use client';

import React from 'react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-slate-900 text-white p-6 min-h-screen">
          <div className="flex items-center gap-3 mb-10">
            <img src="/logo.png" alt="Logo" className="h-8" />
            <span className="text-2xl font-bold">DriveAdvocate</span>
          </div>
          <nav className="space-y-2">
            <a href="/dashboard" className="block px-4 py-3 rounded-xl bg-slate-800">Dashboard</a>
            <a href="#" className="block px-4 py-3 rounded-xl hover:bg-slate-800">My Deals</a>
            <a href="#" className="block px-4 py-3 rounded-xl hover:bg-slate-800">Documents</a>
            <a href="#" className="block px-4 py-3 rounded-xl hover:bg-slate-800">Messages</a>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">Client Dashboard</h1>
          
          <div className="bg-white rounded-3xl p-8 shadow mb-8">
            <p className="text-emerald-600 font-medium">Current Deal Status</p>
            <p className="text-5xl font-bold mt-4">In Negotiation</p>
            <p className="text-slate-500">2025 Toyota Camry • Target $32,450</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <button className="block w-full bg-slate-900 text-white py-4 rounded-2xl mb-4">Download Negotiated Worksheet</button>
              <button className="block w-full bg-emerald-600 text-white py-4 rounded-2xl">Message Advocate</button>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <p className="text-slate-600">Dealer response received 2 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}