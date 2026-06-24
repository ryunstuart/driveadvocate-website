'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Deal {
  id: string;
  clientName: string;
  vehicle: string;
  submitted: string;
  status: 'New' | 'In Progress' | 'Follow Up';
  dealershipsContacted: number;
  timeSpent: number; // in minutes
  priority: number;
}

export default function NegotiationQueue() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Sample data - we'll replace with real data later
  const [deals, setDeals] = useState<Deal[]>([
    {
      id: 'deal-001',
      clientName: 'Johnathan Reyes',
      vehicle: '2025 Toyota Tundra Limited',
      submitted: '2026-06-23',
      status: 'New',
      dealershipsContacted: 0,
      timeSpent: 0,
      priority: 1,
    },
    {
      id: 'deal-002',
      clientName: 'Maria Gonzalez',
      vehicle: '2026 Ford F-150 Lariat',
      submitted: '2026-06-22',
      status: 'In Progress',
      dealershipsContacted: 3,
      timeSpent: 47,
      priority: 2,
    },
    {
      id: 'deal-003',
      clientName: 'David Chen',
      vehicle: '2025 Chevrolet Silverado 1500',
      submitted: '2026-06-22',
      status: 'Follow Up',
      dealershipsContacted: 5,
      timeSpent: 92,
      priority: 3,
    },
    {
      id: 'deal-004',
      clientName: 'Sarah Patel',
      vehicle: '2025 Ram 1500 Limited',
      submitted: '2026-06-21',
      status: 'In Progress',
      dealershipsContacted: 2,
      timeSpent: 31,
      priority: 4,
    },
  ]);

  const filteredDeals = deals
    .filter(deal =>
      deal.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.vehicle.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.priority - b.priority);

  const totalActive = deals.length;
  const totalTime = deals.reduce((sum, d) => sum + d.timeSpent, 0);
  const avgTime = totalActive > 0 ? Math.round(totalTime / totalActive) : 0;

  const openDeal = (dealId: string) => {
    router.push(`/negotiation/${dealId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Negotiation Queue</h1>
            <p className="text-slate-600 mt-1">Performance Matrix • Active Client Files</p>
          </div>
          <button 
            onClick={() => router.push('/onboarding/vehicle')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 transition"
          >
            + New Client Build
          </button>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Active Deals</div>
            <div className="text-4xl font-bold mt-1">{totalActive}</div>
          </div>
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Total Time Worked</div>
            <div className="text-4xl font-bold mt-1">{totalTime} <span className="text-2xl">min</span></div>
          </div>
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Avg Time per Deal</div>
            <div className="text-4xl font-bold mt-1">{avgTime} <span className="text-2xl">min</span></div>
          </div>
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Queue Position</div>
            <div className="text-4xl font-bold mt-1">FIFO</div>
            <div className="text-xs text-slate-500 mt-1">Oldest submissions first</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search clients or vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-5 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Queue Table */}
        <div className="bg-white rounded-3xl shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-8 py-4 text-sm font-medium text-slate-600">#</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Client</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Vehicle</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Submitted</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-slate-600">Status</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-slate-600">Dealerships</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-slate-600">Time</th>
                <th className="text-right px-8 py-4 text-sm font-medium text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeals.length > 0 ? (
                filteredDeals.map((deal, index) => (
                  <tr 
                    key={deal.id} 
                    onClick={() => openDeal(deal.id)}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="px-8 py-5 font-mono text-lg font-semibold text-emerald-600">
                      #{deal.priority}
                    </td>
                    <td className="px-6 py-5 font-medium">{deal.clientName}</td>
                    <td className="px-6 py-5 text-slate-700">{deal.vehicle}</td>
                    <td className="px-6 py-5 text-sm text-slate-500">{deal.submitted}</td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-block px-4 py-1 rounded-full text-xs font-medium ${
                        deal.status === 'New' ? 'bg-blue-100 text-blue-700' :
                        deal.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {deal.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center font-medium">{deal.dealershipsContacted}</td>
                    <td className="px-6 py-5 text-center font-medium">{deal.timeSpent} min</td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openDeal(deal.id); }}
                        className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition"
                      >
                        Open File
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-8 py-12 text-center text-slate-500">
                    No deals found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-500 mt-4 text-center">
          Queue is sorted by submission order (oldest first). Click any row to open the client file.
        </p>
      </div>
    </div>
  );
}