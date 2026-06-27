'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function PreCallPrep() {
  const router = useRouter();
  const { callId } = useParams();
  const [call, setCall] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getCurrentUser().catch(() => router.push('/login')); }, [router]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/calls?callId=${callId}`);
      if (res.ok) {
        const data = await res.json();
        setCall(data.call);
        setNotes(data.call?.notes || '');
      }
      setLoading(false);
    })();
  }, [callId]);

  const updateStatus = async (status: string) => {
    await fetch('/api/calls', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callId, status }) });
    setCall((p: any) => ({ ...p, status }));
  };

  const saveNotes = async () => {
    setSaving(true);
    await fetch('/api/calls', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callId, notes }) });
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="flex-1 flex items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
    </div>
  );

  if (!call) return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="flex-1 flex items-center justify-center text-slate-500">Call not found</div>
    </div>
  );

  const callTime = new Date(call.scheduledAt);
  const minutesUntil = Math.round((callTime.getTime() - Date.now()) / 60000);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="max-w-4xl mx-auto px-6 py-8 flex-1 w-full">
        <button onClick={() => router.push('/dashboard')} className="text-emerald-600 hover:underline text-sm mb-6 block">← Back to Dashboard</button>

        <div className="bg-slate-900 text-white rounded-3xl p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-sm mb-1">Discovery Call</div>
              <h1 className="text-3xl font-bold">{call.clientName}</h1>
              <div className="text-slate-300 mt-1">
                {callTime.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                {minutesUntil > 0 && minutesUntil <= 60 && <span className="ml-2 text-emerald-400 font-medium">· in {minutesUntil}m</span>}
              </div>
            </div>
            {call.clientPhone && (
              <a href={`tel:${call.clientPhone}`} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-semibold transition">Call Now</a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 space-y-4">
            <div className="bg-white rounded-3xl shadow p-6">
              <h2 className="font-bold mb-4">Client Info</h2>
              <div className="space-y-3 text-sm">
                <div><div className="text-slate-500">Phone</div><a href={`tel:${call.clientPhone}`} className="font-medium text-emerald-600 hover:underline">{call.clientPhone}</a></div>
                <div><div className="text-slate-500">Email</div><div className="font-medium break-all">{call.clientEmail}</div></div>
                <div><div className="text-slate-500">ZIP</div><div className="font-medium">{call.clientZip || 'Not provided'}</div></div>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow p-6">
              <h2 className="font-bold mb-4">Call Status</h2>
              <div className="space-y-2">
                {['scheduled', 'in_progress', 'completed', 'no_show'].map(s => (
                  <button key={s} onClick={() => updateStatus(s)} className={`w-full py-2 px-4 rounded-xl text-sm font-medium transition ${call.status === s ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {s.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-3xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Call Notes</h2>
                <button onClick={saveNotes} disabled={saving} className="text-sm text-emerald-600 hover:underline font-medium">{saving ? 'Saving...' : 'Save Notes'}</button>
              </div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes} placeholder="Add notes during or after the call..." className="w-full h-32 border border-slate-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-emerald-500 transition" />
            </div>
            <div className="bg-white rounded-3xl shadow p-6">
              <h2 className="font-bold mb-4">Next Steps</h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => updateStatus('completed')} className="p-4 border-2 border-slate-200 hover:border-emerald-500 rounded-2xl text-left transition">
                  <div className="text-2xl mb-1">✓</div><div className="font-semibold text-sm">Mark Completed</div><div className="text-xs text-slate-500">Call finished successfully</div>
                </button>
                <button onClick={() => updateStatus('no_show')} className="p-4 border-2 border-slate-200 hover:border-red-300 rounded-2xl text-left transition">
                  <div className="text-2xl mb-1">✗</div><div className="font-semibold text-sm">No Show</div><div className="text-xs text-slate-500">Client didn't show</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
