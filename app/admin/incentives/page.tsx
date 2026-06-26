'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

const ADMIN_EMAILS = ['ryun@driveadvocate.com', 'keith@driveadvocate.com'];
const INCENTIVE_TYPES = [
  'Customer Cash', 'Dealer Cash', 'Military Discount', 'Loyalty Cash', 'Conquest Cash',
  'APR Special', 'Lease Cash', 'College Graduate', 'First Responder', 'Trade-In Bonus',
];
const REGIONS = ['National', 'Midwest', 'Northeast', 'Southeast', 'Southwest', 'West Coast'];

interface Incentive {
  makeModel: string; type: string; amount: number; canStack: boolean;
  stackNotes?: string; region: string; expiresAt: string;
  aprRate?: number; aprMonths?: number; notes?: string;
  updatedBy?: string; updatedAt?: string;
}

export default function IncentivesAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [activeOnly, setActiveOnly] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Incentive | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    make: '', model: '', year: '2026', type: 'Customer Cash', amount: '',
    aprRate: '', aprMonths: '', region: 'National', expiresAt: '',
    canStack: true, stackNotes: '', notes: '',
  });

  useEffect(() => {
    (async () => {
      try {
        await getCurrentUser();
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (!user.isAdmin && !ADMIN_EMAILS.includes(user.email?.toLowerCase())) {
          router.push('/dashboard'); return;
        }
      } catch { router.push('/login'); return; }
      await loadIncentives();
      setLoading(false);
    })();
  }, [router]);

  const loadIncentives = async () => {
    const res = await fetch('/api/incentives');
    const data = await res.json();
    setIncentives(data.incentives || []);
  };

  const handleSave = async () => {
    if (!form.make || !form.model || !form.type || !form.amount) return;
    setSaving(true);
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const item: any = {
      makeModel: `${form.make}#${form.model}#${form.year}`,
      type: form.type,
      amount: parseFloat(form.amount),
      canStack: form.canStack,
      stackNotes: form.stackNotes || undefined,
      region: form.region,
      expiresAt: form.expiresAt,
      notes: form.notes || undefined,
      updatedBy: user.email || '',
      updatedAt: new Date().toISOString(),
    };
    if (form.type === 'APR Special') {
      item.aprRate = parseFloat(form.aprRate) || undefined;
      item.aprMonths = parseInt(form.aprMonths) || undefined;
    }
    await fetch('/api/incentives', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    await loadIncentives();
    setSaving(false);
    setShowModal(false);
    resetForm();
  };

  const handleDelete = async (makeModel: string, type: string) => {
    await fetch(`/api/incentives?makeModel=${encodeURIComponent(makeModel)}&type=${encodeURIComponent(type)}`, { method: 'DELETE' });
    await loadIncentives();
  };

  const openEdit = (inc: Incentive) => {
    const [make, model, year] = inc.makeModel.split('#');
    setForm({
      make, model, year: year || '2026', type: inc.type,
      amount: String(inc.amount), aprRate: String(inc.aprRate || ''),
      aprMonths: String(inc.aprMonths || ''), region: inc.region,
      expiresAt: inc.expiresAt, canStack: inc.canStack,
      stackNotes: inc.stackNotes || '', notes: inc.notes || '',
    });
    setEditing(inc);
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({ make: '', model: '', year: '2026', type: 'Customer Cash', amount: '', aprRate: '', aprMonths: '', region: 'National', expiresAt: '', canStack: true, stackNotes: '', notes: '' });
    setEditing(null);
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = incentives.filter(inc => {
    if (activeOnly && inc.expiresAt < today) return false;
    if (typeFilter !== 'All' && inc.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return inc.makeModel.toLowerCase().includes(q) || inc.type.toLowerCase().includes(q);
    }
    return true;
  });

  const expiringThisWeek = incentives.filter(i => {
    const exp = new Date(i.expiresAt);
    const week = new Date(Date.now() + 7 * 86400000);
    return exp >= new Date(today) && exp <= week;
  }).length;

  const uniqueMakes = [...new Set(incentives.map(i => i.makeModel.split('#')[0]))].length;
  const lastUpdate = incentives.reduce((latest, i) => i.updatedAt && i.updatedAt > latest ? i.updatedAt : latest, '');

  const inputClass = 'w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 text-sm';

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Incentives Manager</h1>
            <p className="text-slate-500 mt-1">Update monthly manufacturer rebates and incentives</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 transition">+ Add Incentive</button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Active Incentives</div>
            <div className="text-3xl font-bold mt-1">{incentives.filter(i => i.expiresAt >= today).length}</div>
          </div>
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Expiring This Week</div>
            <div className="text-3xl font-bold mt-1 text-amber-600">{expiringThisWeek}</div>
          </div>
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Makes Covered</div>
            <div className="text-3xl font-bold mt-1">{uniqueMakes}</div>
          </div>
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Last Updated</div>
            <div className="text-sm font-medium mt-2">{lastUpdate ? new Date(lastUpdate).toLocaleDateString() : '—'}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input type="text" placeholder="Search by make/model..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 max-w-md px-5 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 bg-white text-sm" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-4 py-3 border border-slate-300 rounded-2xl bg-white text-sm">
            <option value="All">All Types</option>
            {INCENTIVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} className="rounded" />
            Active only
          </label>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Make</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Model</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Year</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="text-right px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="text-center px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Stack</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Expires</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Region</th>
                <th className="text-right px-5 py-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? filtered.map(inc => {
                const [make, model, year] = inc.makeModel.split('#');
                const daysUntilExp = Math.ceil((new Date(inc.expiresAt).getTime() - Date.now()) / 86400000);
                const isExpired = daysUntilExp < 0;
                return (
                  <tr key={`${inc.makeModel}-${inc.type}`} className={isExpired ? 'bg-red-50 opacity-60' : daysUntilExp <= 7 ? 'bg-amber-50' : ''}>
                    <td className={`px-5 py-4 font-semibold text-sm ${isExpired ? 'line-through' : ''}`}>{make}</td>
                    <td className="px-5 py-4 text-sm">{model}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{year}</td>
                    <td className="px-5 py-4 text-sm">{inc.type}</td>
                    <td className="px-5 py-4 text-sm text-right font-semibold text-emerald-700">
                      {inc.type === 'APR Special' ? `${inc.aprRate}% / ${inc.aprMonths}mo` : `$${inc.amount.toLocaleString()}`}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-medium ${inc.canStack ? 'text-emerald-600' : 'text-amber-600'}`}>{inc.canStack ? '✓ Yes' : '✗ No'}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{inc.expiresAt}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{inc.region}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => openEdit(inc)} className="text-xs text-emerald-600 hover:underline mr-3">Edit</button>
                      <button onClick={() => handleDelete(inc.makeModel, inc.type)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={9} className="px-8 py-16 text-center text-slate-400 text-sm">No incentives found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-6">{editing ? 'Edit Incentive' : 'Add Incentive'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-600 mb-1">Make</label><input type="text" value={form.make} onChange={e => setForm(p => ({ ...p, make: e.target.value }))} className={inputClass} placeholder="Ford" /></div>
              <div><label className="block text-sm font-medium text-slate-600 mb-1">Model</label><input type="text" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} className={inputClass} placeholder="F-150" /></div>
              <div><label className="block text-sm font-medium text-slate-600 mb-1">Year</label><select value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} className={inputClass}><option>2025</option><option>2026</option></select></div>
              <div><label className="block text-sm font-medium text-slate-600 mb-1">Type</label><select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inputClass}>{INCENTIVE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-600 mb-1">Amount ($)</label><input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className={inputClass} placeholder="1000" /></div>
              <div><label className="block text-sm font-medium text-slate-600 mb-1">Region</label><select value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className={inputClass}>{REGIONS.map(r => <option key={r}>{r}</option>)}</select></div>
              {form.type === 'APR Special' && (
                <>
                  <div><label className="block text-sm font-medium text-slate-600 mb-1">APR Rate (%)</label><input type="number" step="0.1" value={form.aprRate} onChange={e => setForm(p => ({ ...p, aprRate: e.target.value }))} className={inputClass} placeholder="0.9" /></div>
                  <div><label className="block text-sm font-medium text-slate-600 mb-1">APR Months</label><input type="number" value={form.aprMonths} onChange={e => setForm(p => ({ ...p, aprMonths: e.target.value }))} className={inputClass} placeholder="60" /></div>
                </>
              )}
              <div className="col-span-2"><label className="block text-sm font-medium text-slate-600 mb-1">Expires</label><input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} className={inputClass} /></div>
              <div className="col-span-2 flex items-center gap-3">
                <button type="button" onClick={() => setForm(p => ({ ...p, canStack: !p.canStack }))} className={`relative w-12 h-7 rounded-full transition-colors ${form.canStack ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${form.canStack ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
                <span className="text-sm text-slate-600">Can stack with other incentives</span>
              </div>
              {!form.canStack && <div className="col-span-2"><label className="block text-sm font-medium text-slate-600 mb-1">Stack Notes</label><input type="text" value={form.stackNotes} onChange={e => setForm(p => ({ ...p, stackNotes: e.target.value }))} className={inputClass} placeholder="Cannot combine with 0% APR" /></div>}
              <div className="col-span-2"><label className="block text-sm font-medium text-slate-600 mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className={`${inputClass} h-20 resize-none`} placeholder="Must finance through Ford Motor Credit" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 py-3 border border-slate-300 rounded-2xl hover:bg-slate-50 text-sm font-medium">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.make || !form.model || !form.amount} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:bg-slate-300 text-sm font-semibold">{saving ? 'Saving...' : 'Save Incentive'}</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
