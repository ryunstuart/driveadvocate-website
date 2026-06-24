'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

interface Deal {
  id: string;
  clientName: string;
  vehicle: string;
  submitted: string;
  status: 'New' | 'In Progress' | 'Follow Up' | 'Complete';
  priority: number;
}

interface DealFileState {
  totalTime: number;
  callLogs: { id: number }[];
  dealerships: { status: string }[];
}

const BASE_DEALS: Deal[] = [
  { id: 'deal-001', clientName: 'Johnathan Reyes', vehicle: '2025 Toyota Tundra Limited', submitted: '2026-06-23', status: 'New', priority: 1 },
  { id: 'deal-002', clientName: 'Maria Gonzalez', vehicle: '2026 Ford F-150 Lariat', submitted: '2026-06-22', status: 'In Progress', priority: 2 },
  { id: 'deal-003', clientName: 'David Chen', vehicle: '2025 Chevrolet Silverado 1500', submitted: '2026-06-22', status: 'Follow Up', priority: 3 },
  { id: 'deal-004', clientName: 'Sarah Patel', vehicle: '2025 Ram 1500 Limited', submitted: '2026-06-21', status: 'In Progress', priority: 4 },
];

function getDealStats(dealId: string): { timeSpent: number; dealershipsContacted: number; callCount: number } {
  if (typeof window === 'undefined') return { timeSpent: 0, dealershipsContacted: 0, callCount: 0 };
  try {
    const saved = localStorage.getItem(`dealfile-${dealId}`);
    if (!saved) return { timeSpent: 0, dealershipsContacted: 0, callCount: 0 };
    const state: DealFileState = JSON.parse(saved);
    const dealershipsContacted = state.dealerships?.filter(d => d.status !== 'Not Called').length || 0;
    return {
      timeSpent: state.totalTime || 0,
      dealershipsContacted,
      callCount: state.callLogs?.length || 0,
    };
  } catch {
    return { timeSpent: 0, dealershipsContacted: 0, callCount: 0 };
  }
}

export default function NegotiationQueue() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [deals, setDeals] = useState<Deal[]>(BASE_DEALS);
  const [liveStats, setLiveStats] = useState<Record<string, { timeSpent: number; dealershipsContacted: number; callCount: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const advocateDeals = JSON.parse(localStorage.getItem('advocateDeals') || '[]');
      const merged = [...BASE_DEALS];
      advocateDeals.forEach((d: any, i: number) => {
        if (!merged.find(m => m.id === d.id)) {
          merged.push({
            id: d.id,
            clientName: d.clientName,
            vehicle: d.vehicle,
            submitted: d.submitted,
            status: d.status || 'New',
            priority: BASE_DEALS.length + i + 1,
          });
        }
      });
      setDeals(merged);
      const stats: Record<string, any> = {};
      merged.forEach(d => { stats[d.id] = getDealStats(d.id); });
      setLiveStats(stats);
    } catch (e) {
      console.error('Failed to load deals', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredDeals = deals
    .filter(deal =>
      deal.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.vehicle.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.priority - b.priority);

  const totalTime = Object.values(liveStats).reduce((sum, s) => sum + s.timeSpent, 0);
  const totalCalls = Object.values(liveStats).reduce((sum, s) => sum + s.callCount, 0);
  const totalDealerships = Object.values(liveStats).reduce((sum, s) => sum + s.dealershipsContacted, 0);

  const formatTime = (mins: number) => {
    if (!mins) return '0m';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const statusColors: Record<string, string> = {
    'New': 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    'Follow Up': 'bg-purple-100 text-purple-700',
    'Complete': 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
  <div>
    <h1 className="text-4xl font-bold">Negotiation Queue</h1>
    <p className="text-slate-500 mt-1">Active client files · sorted by submission date</p>
  </div>
          <button
            onClick={() => router.push('/advocate/intake')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 transition"
          >
            + New Client
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Active Files</div>
            <div className="text-4xl font-bold mt-1">{deals.length}</div>
          </div>
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Total Time</div>
            <div className="text-4xl font-bold mt-1">{formatTime(totalTime)}</div>
          </div>
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Calls Logged</div>
            <div className="text-4xl font-bold mt-1">{totalCalls}</div>
          </div>
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Dealers Contacted</div>
            <div className="text-4xl font-bold mt-1">{totalDealerships}</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by client name or vehicle..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-5 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 bg-white"
          />
        </div>

        {/* Queue Table */}
        <div className="bg-white rounded-3xl shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vehicle</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Submitted</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dealers</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Calls</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                // Loading skeletons
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="px-8 py-5">
                      <div className="flex items-center gap-5 animate-pulse">
                        <div className="w-8 h-5 bg-slate-200 rounded" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-32" />
                          <div className="h-3 bg-slate-100 rounded w-48" />
                        </div>
                        <div className="h-6 w-20 bg-slate-200 rounded-full" />
                        <div className="h-4 w-12 bg-slate-200 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredDeals.length > 0 ? (
                filteredDeals.map((deal) => {
                  const stats = liveStats[deal.id] || { timeSpent: 0, dealershipsContacted: 0, callCount: 0 };
                  return (
                    <tr
                      key={deal.id}
                      onClick={() => router.push(`/negotiation/${deal.id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition"
                    >
                      <td className="px-6 py-5 font-mono font-bold text-emerald-600">#{deal.priority}</td>
                      <td className="px-6 py-5 font-semibold">{deal.clientName}</td>
                      <td className="px-6 py-5 text-slate-600 text-sm">{deal.vehicle}</td>
                      <td className="px-6 py-5 text-sm text-slate-500">{deal.submitted}</td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[deal.status]}`}>
                          {deal.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center font-semibold">{stats.dealershipsContacted}</td>
                      <td className="px-6 py-5 text-center font-semibold">{stats.callCount}</td>
                      <td className="px-6 py-5 text-center font-semibold text-sm">{formatTime(stats.timeSpent)}</td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/negotiation/${deal.id}`); }}
                          className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition"
                        >
                          Open File
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-8 py-16 text-center">
                    {searchTerm ? (
                      <div>
                        <div className="text-4xl mb-3">🔍</div>
                        <div className="font-semibold text-slate-700 mb-1">No results found</div>
                        <div className="text-sm text-slate-400">No deals match "{searchTerm}" — try a different search</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl mb-3">📂</div>
                        <div className="font-semibold text-slate-700 mb-1">Queue is empty</div>
                        <div className="text-sm text-slate-400 mb-4">No active deals yet — add your first client to get started</div>
                        <button
                          onClick={() => router.push('/advocate/intake')}
                          className="px-6 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-medium hover:bg-emerald-700 transition"
                        >
                          + Add First Client
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Sorted oldest to newest · Click any row to open the client file · Stats update from localStorage
        </p>
      </div>
      <Footer />
    </div>
  );
}
