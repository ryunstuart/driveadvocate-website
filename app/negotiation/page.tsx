'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { dataClient } from '@/app/lib/amplify-data';

interface Deal {
  id: string;
  clientName: string;
  vehicle: string;
  submitted: string;
  status: string;
  priority: number;
}

interface DealFileState {
  totalTime: number;
  callLogs: { id: number }[];
  dealerships: { status: string }[];
}

const STATUS_DISPLAY: Record<string, string> = {
  'New': 'New', 'InProgress': 'In Progress', 'FollowUp': 'Follow Up',
  'OfferReceived': 'Offer Received', 'Complete': 'Complete', 'Dead': 'Dead',
};

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

  useEffect(() => { getCurrentUser().catch(() => router.push('/login')); }, [router]);

  const [searchTerm, setSearchTerm] = useState('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [liveStats, setLiveStats] = useState<Record<string, { timeSpent: number; dealershipsContacted: number; callCount: number }>>({});
  const [loading, setLoading] = useState(true);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const prevDealsRef = useRef<Deal[]>([]);

  useEffect(() => {
    async function loadDeals() {
      try {
        const { data: appSyncDeals } = await dataClient.models.Deal.list();
        const mapped: Deal[] = await Promise.all(
          appSyncDeals.map(async (d, i) => {
            let vehicle = 'Vehicle TBD';
            try {
              const { data: vps } = await dataClient.models.VehiclePreference.list({
                filter: { dealId: { eq: d.id } },
              });
              if (vps.length > 0) {
                const vp = vps[0];
                vehicle = [vp.year, vp.make, vp.model, vp.trim].filter(Boolean).join(' ') || 'Vehicle TBD';
              }
            } catch {}
            const submitted = d.submittedAt
              ? d.submittedAt.split('T')[0]
              : d.createdAt?.split('T')[0] || '';
            return {
              id: d.id, clientName: d.clientName, vehicle, submitted,
              status: STATUS_DISPLAY[d.status || 'New'] || d.status || 'New',
              priority: d.priority ?? i + 1,
            };
          })
        );
        mapped.sort((a, b) => a.priority - b.priority);
        setDeals(mapped);
        const stats: Record<string, any> = {};
        mapped.forEach(d => { stats[d.id] = getDealStats(d.id); });
        setLiveStats(stats);
      } catch (e) {
        console.error('Failed to load deals from AppSync', e);
      } finally {
        setLoading(false);
      }
    }
    loadDeals();
  }, []);

  const filteredDeals = deals
    .filter(deal =>
      deal.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.vehicle.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.priority - b.priority);

  const syncPriorities = useCallback(async (updatedDeals: Deal[]) => {
    setSaveStatus('saving');
    try {
      await Promise.all(
        updatedDeals.map(d =>
          dataClient.models.Deal.update({ id: d.id, priority: d.priority })
        )
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2000);
    } catch (err) {
      console.error('Failed to sync priorities', err);
      setSaveStatus('error');
      setDeals(prevDealsRef.current);
      setTimeout(() => setSaveStatus(prev => prev === 'error' ? 'idle' : prev), 3000);
    }
  }, []);

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    if (saveStatus === 'saving') { e.preventDefault(); return; }
    setDragId(dealId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDragOver = (e: React.DragEvent, dealId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dealId !== dragId) setDragOverId(dealId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    if (!dragId || dragId === targetId) { setDragId(null); return; }

    prevDealsRef.current = [...deals];

    const draggedDeal = deals.find(d => d.id === dragId);
    const targetDeal = deals.find(d => d.id === targetId);
    if (!draggedDeal || !targetDeal) { setDragId(null); return; }

    const reordered = deals.filter(d => d.id !== dragId);
    const targetIndex = reordered.findIndex(d => d.id === targetId);
    reordered.splice(targetIndex, 0, draggedDeal);

    const updated = reordered.map((d, i) => ({ ...d, priority: i + 1 }));
    setDeals(updated);
    setDragId(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => syncPriorities(updated), 500);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDragOverId(null);
  };

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
    'Offer Received': 'bg-orange-100 text-orange-700',
    'Complete': 'bg-emerald-100 text-emerald-700',
    'Dead': 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Negotiation Queue</h1>
            <p className="text-slate-500 mt-1">Active client files · drag to reorder priority</p>
          </div>
          <div className="flex items-center gap-4">
            {saveStatus === 'saving' && (
              <span className="text-sm text-slate-500 flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-sm text-emerald-600 font-medium">Saved</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-600 font-medium">Failed to save — reverted</span>
            )}
            <button
              onClick={() => router.push('/advocate/intake')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 transition"
            >
              + New Client
            </button>
          </div>
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
                <th className="w-10 px-2 py-4"></th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vehicle</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Submitted</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dealers</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Calls</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                <th className="text-right px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={10} className="px-8 py-5">
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
                  const isDragging = dragId === deal.id;
                  const isDragOver = dragOverId === deal.id;
                  return (
                    <tr
                      key={deal.id}
                      draggable
                      onDragStart={e => handleDragStart(e, deal.id)}
                      onDragOver={e => handleDragOver(e, deal.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={e => handleDrop(e, deal.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => router.push(`/negotiation/${deal.id}`)}
                      className={`transition cursor-pointer ${
                        isDragging ? 'opacity-40 bg-slate-50' :
                        isDragOver ? 'border-t-2 border-t-emerald-500 bg-emerald-50/30' :
                        'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-2 py-5 text-center">
                        <span
                          className={`text-slate-300 text-lg select-none ${saveStatus === 'saving' ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:text-slate-500'}`}
                          onMouseDown={e => e.stopPropagation()}
                        >
                          ⠿
                        </span>
                      </td>
                      <td className="px-4 py-5 font-mono font-bold text-emerald-600">#{deal.priority}</td>
                      <td className="px-4 py-5 font-semibold">{deal.clientName}</td>
                      <td className="px-4 py-5 text-slate-600 text-sm">{deal.vehicle}</td>
                      <td className="px-4 py-5 text-sm text-slate-500">{deal.submitted}</td>
                      <td className="px-4 py-5 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[deal.status] || 'bg-slate-100 text-slate-600'}`}>
                          {deal.status}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-center font-semibold">{stats.dealershipsContacted}</td>
                      <td className="px-4 py-5 text-center font-semibold">{stats.callCount}</td>
                      <td className="px-4 py-5 text-center font-semibold text-sm">{formatTime(stats.timeSpent)}</td>
                      <td className="px-4 py-5 text-right">
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
                  <td colSpan={10} className="px-8 py-16 text-center">
                    {searchTerm ? (
                      <div>
                        <div className="text-4xl mb-3">🔍</div>
                        <div className="font-semibold text-slate-700 mb-1">No results found</div>
                        <div className="text-sm text-slate-400">No deals match &ldquo;{searchTerm}&rdquo; — try a different search</div>
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
          Drag rows to reorder priority · Click any row to open the client file
        </p>
      </div>
      <Footer />
    </div>
  );
}
