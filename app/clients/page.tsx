'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { dataClient } from '@/app/lib/amplify-data';

interface ClientRow {
  id: string;
  clientName: string;
  clientEmail: string;
  vehicle: string;
  budget: string;
  status: string;
  submitted: string;
  timeMinutes: number;
}

const STATUS_DISPLAY: Record<string, string> = {
  'New': 'New', 'InProgress': 'In Progress', 'FollowUp': 'Follow Up',
  'OfferReceived': 'Offer Received', 'Complete': 'Complete', 'Dead': 'Dead',
};

const STATUS_COLORS: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Follow Up': 'bg-purple-100 text-purple-700',
  'Offer Received': 'bg-orange-100 text-orange-700',
  'Complete': 'bg-emerald-100 text-emerald-700',
  'Dead': 'bg-slate-100 text-slate-500',
};

const ALL_STATUSES = ['All', 'New', 'In Progress', 'Follow Up', 'Offer Received', 'Complete', 'Dead'];
type SortKey = 'submitted' | 'status' | 'clientName';

function formatTime(mins: number) {
  if (!mins) return '0m';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function ClientsPage() {
  const router = useRouter();

  useEffect(() => { getCurrentUser().catch(() => router.push('/login')); }, [router]);

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<SortKey>('submitted');

  useEffect(() => {
    async function load() {
      try {
        const [dealsResult, vpsResult] = await Promise.all([
          dataClient.models.Deal.list(),
          dataClient.models.VehiclePreference.list(),
        ]);

        const vpMap = new Map<string, string>();
        for (const vp of vpsResult.data || []) {
          vpMap.set(vp.dealId, [vp.year, vp.make, vp.model, vp.trim].filter(Boolean).join(' ') || 'Vehicle TBD');
        }

        const rows: ClientRow[] = (dealsResult.data || []).map(d => ({
          id: d.id,
          clientName: d.clientName,
          clientEmail: d.clientEmail || '',
          vehicle: vpMap.get(d.id) || 'Vehicle TBD',
          budget: d.budget || '—',
          status: STATUS_DISPLAY[d.status || 'New'] || d.status || 'New',
          submitted: d.submittedAt ? d.submittedAt.split('T')[0] : d.createdAt?.split('T')[0] || '',
          timeMinutes: d.totalTimeMinutes || 0,
        }));

        setClients(rows);
      } catch (err) {
        console.error('Failed to load clients', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = clients
    .filter(c => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.clientName.toLowerCase().includes(q) || c.vehicle.toLowerCase().includes(q) || c.clientEmail.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'clientName') return a.clientName.localeCompare(b.clientName);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return b.submitted.localeCompare(a.submitted);
    });

  const activeCount = clients.filter(c => c.status !== 'Complete' && c.status !== 'Dead').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">

        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Clients</h1>
            <p className="text-slate-500 mt-1">{activeCount} active client{activeCount !== 1 ? 's' : ''} · {clients.length} total</p>
          </div>
          <button
            onClick={() => router.push('/advocate/intake')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 transition"
          >
            + New Client
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, vehicle, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 max-w-md px-5 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 bg-white text-sm"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 bg-white text-sm"
          >
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortKey)}
            className="px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 bg-white text-sm"
          >
            <option value="submitted">Sort: Newest First</option>
            <option value="clientName">Sort: Name A–Z</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vehicle</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Budget</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Submitted</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-5">
                      <div className="flex items-center gap-5 animate-pulse">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-36" />
                          <div className="h-3 bg-slate-100 rounded w-48" />
                        </div>
                        <div className="h-6 w-20 bg-slate-200 rounded-full" />
                        <div className="h-4 w-16 bg-slate-200 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/negotiation/${c.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="px-6 py-5">
                      <div className="font-semibold">{c.clientName}</div>
                      {c.clientEmail && <div className="text-xs text-slate-400 mt-0.5">{c.clientEmail}</div>}
                    </td>
                    <td className="px-6 py-5 text-slate-600 text-sm">{c.vehicle}</td>
                    <td className="px-6 py-5 text-sm text-slate-600">{c.budget}</td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || 'bg-slate-100 text-slate-600'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500">{c.submitted}</td>
                    <td className="px-6 py-5 text-center text-sm font-semibold">{formatTime(c.timeMinutes)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center">
                    {search || statusFilter !== 'All' ? (
                      <div>
                        <div className="text-4xl mb-3">🔍</div>
                        <div className="font-semibold text-slate-700 mb-1">No matching clients</div>
                        <div className="text-sm text-slate-400">Try adjusting your search or filter</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl mb-3">👥</div>
                        <div className="font-semibold text-slate-700 mb-1">No clients yet</div>
                        <div className="text-sm text-slate-400 mb-4">Add your first client to get started</div>
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

      </div>
      <Footer />
    </div>
  );
}
