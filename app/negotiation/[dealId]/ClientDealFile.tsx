'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Dealership {
  id: number;
  name: string;
  distance: number;
  phone: string;
  status: 'Not Called' | 'Called' | 'Follow Up' | 'No Inventory';
  lastCalled?: string;
  lastOutcome?: string;
  lastRating?: number;
  contactName?: string;
}

interface CallLog {
  id: number;
  dealershipId: number;
  dealershipName: string;
  contactName: string;
  timestamp: string;
  outcome: string;
  notes: string;
  rating: number;
}

interface DealFileState {
  totalTime: number;
  callLogs: CallLog[];
  dealerships: Dealership[];
  lastSaved: string;
}

const OUTCOMES = [
  'Vehicle in stock — price quoted',
  'Vehicle in stock — no price yet',
  'Vehicle incoming — ETA given',
  'Vehicle not in stock',
  'Left voicemail',
  'No answer',
  'Spoke to manager',
  'Sent email follow-up',
  'Deal agreed — pending approval',
];

const RATING_LABELS: Record<number, string> = {
  1: 'Very Poor',
  2: 'Below Average',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

// Mock deal data keyed by dealId — replace with API calls later
const MOCK_DEALS: Record<string, { clientName: string; vehicle: string; vehicleDetails: string; dealerships: Dealership[] }> = {
  'deal-001': {
    clientName: 'Johnathan Reyes',
    vehicle: '2025 Toyota Tundra Limited',
    vehicleDetails: '4x4 CrewMax • Midnight Black • Black Leather',
    dealerships: [
      { id: 1, name: 'Toyota of St. Charles', distance: 4.2, phone: '(636) 555-0123', status: 'Not Called' },
      { id: 2, name: 'Suntrup Toyota', distance: 7.8, phone: '(314) 555-0199', status: 'Not Called' },
      { id: 3, name: 'Lou Fusz Toyota', distance: 12.1, phone: '(314) 555-0145', status: 'Not Called' },
      { id: 4, name: 'Frank Leta Toyota', distance: 15.4, phone: '(636) 555-0177', status: 'Not Called' },
      { id: 5, name: 'Toyota South', distance: 22.6, phone: '(618) 555-0133', status: 'Not Called' },
    ],
  },
  'deal-002': {
    clientName: 'Maria Gonzalez',
    vehicle: '2026 Ford F-150 Lariat',
    vehicleDetails: '4x4 SuperCrew • Rapid Red • Medium Dark Ash',
    dealerships: [
      { id: 1, name: 'Bommarito Ford', distance: 6.1, phone: '(636) 555-0211', status: 'Not Called' },
      { id: 2, name: 'Plaza Ford', distance: 9.4, phone: '(314) 555-0244', status: 'Not Called' },
      { id: 3, name: 'O\'Fallon Ford', distance: 11.2, phone: '(636) 555-0288', status: 'Not Called' },
      { id: 4, name: 'Auffenberg Ford', distance: 18.7, phone: '(618) 555-0255', status: 'Not Called' },
    ],
  },
  'deal-003': {
    clientName: 'David Chen',
    vehicle: '2025 Chevrolet Silverado 1500',
    vehicleDetails: 'LTZ Z71 • Northsky Blue • Jet Black',
    dealerships: [
      { id: 1, name: 'Mungenast Chevrolet', distance: 5.3, phone: '(314) 555-0301', status: 'Not Called' },
      { id: 2, name: 'Bommarito Chevrolet', distance: 8.9, phone: '(636) 555-0322', status: 'Not Called' },
      { id: 3, name: 'Thoroughbred Chevrolet', distance: 14.2, phone: '(636) 555-0355', status: 'Not Called' },
    ],
  },
  'deal-004': {
    clientName: 'Sarah Patel',
    vehicle: '2025 Ram 1500 Limited',
    vehicleDetails: 'Crew Cab 4x4 • Diamond Black • Black/Brown',
    dealerships: [
      { id: 1, name: 'Suntrup Buick GMC', distance: 7.1, phone: '(314) 555-0401', status: 'Not Called' },
      { id: 2, name: 'Laura Buick GMC', distance: 10.5, phone: '(636) 555-0422', status: 'Not Called' },
      { id: 3, name: 'Auffenberg Chrysler Dodge Jeep Ram', distance: 16.3, phone: '(618) 555-0455', status: 'Not Called' },
    ],
  },
};

export default function ClientDealFile() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.dealId as string;

  const deal = MOCK_DEALS[dealId] || MOCK_DEALS['deal-001'];

  // Load persisted state from localStorage
  const loadState = useCallback((): DealFileState | null => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(`dealfile-${dealId}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [dealId]);

  const saved = loadState();

  const [dealerships, setDealerships] = useState<Dealership[]>(
    saved?.dealerships || deal.dealerships
  );
  const [callLogs, setCallLogs] = useState<CallLog[]>(saved?.callLogs || []);
  const [totalTime, setTotalTime] = useState<number>(saved?.totalTime || 0);
  const [isWorking, setIsWorking] = useState(false);

  // Modal state
  const [selectedDealership, setSelectedDealership] = useState<Dealership | null>(null);
  const [contactName, setContactName] = useState('');
  const [outcome, setOutcome] = useState(OUTCOMES[0]);
  const [callNotes, setCallNotes] = useState('');
  const [callRating, setCallRating] = useState(3);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-start timer when file opens
  useEffect(() => {
    setIsWorking(true);
    timerRef.current = setInterval(() => {
      setTotalTime(prev => prev + 1);
    }, 60000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Persist state to localStorage on any change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const state: DealFileState = {
      totalTime,
      callLogs,
      dealerships,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(`dealfile-${dealId}`, JSON.stringify(state));
  }, [totalTime, callLogs, dealerships, dealId]);

  const toggleTimer = () => {
    if (isWorking) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsWorking(false);
    } else {
      timerRef.current = setInterval(() => {
        setTotalTime(prev => prev + 1);
      }, 60000);
      setIsWorking(true);
    }
  };

  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const openCallModal = (dealership: Dealership) => {
    setSelectedDealership(dealership);
    setContactName('');
    setOutcome(OUTCOMES[0]);
    setCallNotes('');
    setCallRating(3);
  };

  const logCall = () => {
    if (!selectedDealership) return;

    const newLog: CallLog = {
      id: Date.now(),
      dealershipId: selectedDealership.id,
      dealershipName: selectedDealership.name,
      contactName,
      timestamp: new Date().toLocaleString(),
      outcome,
      notes: callNotes,
      rating: callRating,
    };

    setCallLogs(prev => [newLog, ...prev]);

    // Determine new status from outcome
    const newStatus: Dealership['status'] =
      outcome.includes('voicemail') || outcome.includes('No answer') || outcome.includes('follow-up')
        ? 'Follow Up'
        : outcome.includes('not in stock')
        ? 'No Inventory'
        : 'Called';

    setDealerships(prev =>
      prev.map(d =>
        d.id === selectedDealership.id
          ? {
              ...d,
              status: newStatus,
              lastCalled: new Date().toLocaleDateString(),
              lastOutcome: outcome,
              lastRating: callRating,
              contactName,
            }
          : d
      )
    );

    setSelectedDealership(null);
  };

  const calledCount = dealerships.filter(d => d.status !== 'Not Called').length;
  const activeCount = dealerships.filter(d => d.status === 'Called' || d.status === 'Follow Up').length;

  const statusColors: Record<Dealership['status'], string> = {
    'Not Called': 'bg-slate-100 text-slate-600',
    'Called': 'bg-emerald-100 text-emerald-700',
    'Follow Up': 'bg-amber-100 text-amber-700',
    'No Inventory': 'bg-red-100 text-red-600',
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <button
              onClick={() => router.push('/negotiation')}
              className="text-emerald-600 hover:underline mb-2 text-sm flex items-center gap-1"
            >
              ← Back to Queue
            </button>
            <h1 className="text-3xl font-bold">{deal.clientName}</h1>
            <p className="text-slate-600 mt-1">{deal.vehicle} • {deal.vehicleDetails}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-mono text-slate-400">{dealId}</span>
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Active</span>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-3">
            <div className={`bg-white rounded-2xl shadow px-6 py-4 text-center border-2 transition ${isWorking ? 'border-emerald-400' : 'border-transparent'}`}>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Time on File</div>
              <div className="text-3xl font-bold font-mono">{formatTime(totalTime)}</div>
              {isWorking && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-xs text-emerald-600 font-medium">Tracking</span>
                </div>
              )}
            </div>
            <button
              onClick={toggleTimer}
              className={`px-5 py-3 rounded-2xl font-medium transition text-sm ${
                isWorking
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isWorking ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left: Dealership List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Dealerships</h2>
                <div className="text-sm text-slate-500">{calledCount} of {dealerships.length} contacted</div>
              </div>

              <div className="space-y-3">
                {dealerships.map((dealer) => (
                  <div
                    key={dealer.id}
                    className={`border rounded-2xl p-5 transition ${
                      dealer.status === 'Not Called'
                        ? 'border-slate-200 hover:border-emerald-300'
                        : dealer.status === 'Called'
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : dealer.status === 'Follow Up'
                        ? 'border-amber-200 bg-amber-50/30'
                        : 'border-red-200 bg-red-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="font-semibold">{dealer.name}</div>
                          <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${statusColors[dealer.status]}`}>
                            {dealer.status}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500 mt-1">{dealer.distance} mi • {dealer.phone}</div>
                        {dealer.lastCalled && (
                          <div className="text-xs text-slate-500 mt-1.5">
                            <span className="font-medium">Last contact:</span> {dealer.lastCalled}
                            {dealer.contactName && <span> · {dealer.contactName}</span>}
                            {dealer.lastOutcome && <span> · {dealer.lastOutcome}</span>}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => openCallModal(dealer)}
                        className="ml-4 px-5 py-2 bg-emerald-600 text-white text-sm rounded-2xl hover:bg-emerald-700 transition shrink-0"
                      >
                        Log Call
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Call Log */}
            <div className="bg-white rounded-3xl shadow p-8">
              <h2 className="text-xl font-semibold mb-6">Call Log <span className="text-slate-400 font-normal text-base">({callLogs.length})</span></h2>

              {callLogs.length > 0 ? (
                <div className="space-y-4">
                  {callLogs.map((log) => (
                    <div key={log.id} className="flex gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <div className="mt-1 shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          log.rating >= 4 ? 'bg-emerald-100 text-emerald-700' :
                          log.rating >= 3 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {log.rating}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="font-semibold text-sm">{log.dealershipName}</div>
                          <div className="text-xs text-slate-400 shrink-0">{log.timestamp}</div>
                        </div>
                        {log.contactName && (
                          <div className="text-xs text-slate-500 mt-0.5">Contact: {log.contactName}</div>
                        )}
                        <div className="text-xs font-medium text-emerald-700 mt-1">{log.outcome}</div>
                        {log.notes && (
                          <div className="text-sm text-slate-600 mt-1.5 bg-slate-50 rounded-xl p-3">{log.notes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-4xl mb-3">📞</div>
                  <p className="text-sm">No calls logged yet. Click "Log Call" on a dealership to get started.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: File Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow p-8">
              <h3 className="font-semibold mb-5">File Summary</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Deal ID</span>
                  <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{dealId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-medium text-emerald-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dealerships</span>
                  <span className="font-semibold">{dealerships.length} in range</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contacted</span>
                  <span className="font-semibold">{calledCount} of {dealerships.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Leads</span>
                  <span className="font-semibold text-amber-600">{activeCount}</span>
                </div>
                <div className="border-t border-slate-100 pt-4 flex justify-between">
                  <span className="text-slate-500">Time on File</span>
                  <span className="font-semibold">{formatTime(totalTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Calls Logged</span>
                  <span className="font-semibold">{callLogs.length}</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="bg-white rounded-3xl shadow p-8">
              <h3 className="font-semibold mb-4">Outreach Progress</h3>
              <div className="space-y-3">
                {dealerships.map(d => (
                  <div key={d.id} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      d.status === 'Called' ? 'bg-emerald-500' :
                      d.status === 'Follow Up' ? 'bg-amber-400' :
                      d.status === 'No Inventory' ? 'bg-red-400' :
                      'bg-slate-200'
                    }`} />
                    <div className="text-sm truncate flex-1">{d.name}</div>
                    <div className="text-xs text-slate-400 shrink-0">{d.distance}mi</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${dealerships.length > 0 ? (calledCount / dealerships.length) * 100 : 0}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-2 text-right">{calledCount}/{dealerships.length} contacted</div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-3xl shadow p-8">
              <h3 className="font-semibold mb-4">Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-sm font-medium">
                  📋 Copy Deal Summary
                </button>
                <button className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-sm font-medium">
                  📧 Send Client Update
                </button>
                <button className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition text-sm font-medium">
                  🏁 Mark Deal Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call Log Modal */}
      {selectedDealership && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-xl font-semibold">Log Call</h3>
              <p className="text-slate-500 mt-1">{selectedDealership.name} · {selectedDealership.phone}</p>
            </div>

            <div className="space-y-5">
              {/* Contact name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contact Name <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="e.g. Mike from internet sales"
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Outcome */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Outcome</label>
                <select
                  value={outcome}
                  onChange={e => setOutcome(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 bg-white"
                >
                  {OUTCOMES.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 h-28 resize-none text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Price quoted, VIN, availability date, anything worth noting..."
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dealer Rating <span className="text-slate-400 font-normal">— {RATING_LABELS[callRating]}</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(r => (
                    <button
                      key={r}
                      onClick={() => setCallRating(r)}
                      className={`flex-1 py-2.5 rounded-2xl border text-sm font-semibold transition ${
                        callRating === r
                          ? r >= 4 ? 'bg-emerald-600 text-white border-emerald-600'
                          : r === 3 ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-red-500 text-white border-red-500'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setSelectedDealership(null)}
                className="flex-1 py-3 border border-slate-300 rounded-2xl hover:bg-slate-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={logCall}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 text-sm font-medium"
              >
                Save Call Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
