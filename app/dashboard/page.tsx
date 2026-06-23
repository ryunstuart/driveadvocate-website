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
            <a href="#" className="block px-4 py-3 rounded-xl hover:bg-slate-800">Account</a>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Welcome back, [Client Name]</h1>

            {/* Current Deal Status */}
            <div className="bg-white rounded-3xl p-8 shadow mb-8">
              <p className="text-emerald-600 font-medium">Current Deal</p>
              <p className="text-4xl font-bold mt-2">2025 Toyota Camry</p>
              <p className="text-slate-500">Status: In Negotiation • Target OTD $32,450</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="bg-white p-8 rounded-3xl shadow text-center">
                <p className="font-medium mb-4">Negotiated Worksheet</p>
                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl">Download PDF</button>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow text-center">
                <p className="font-medium mb-4">Message Advocate</p>
                <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl">Open Chat</button>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow text-center">
                <p className="font-medium mb-4">Schedule Call</p>
                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl">Book Time</button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-3xl p-8 shadow">
              <h3 className="font-semibold mb-6">Recent Activity</h3>
              <div className="space-y-4">
                <p className="text-sm">Dealer response received • 2 hours ago</p>
                <p className="text-sm">Research report sent • Yesterday</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}