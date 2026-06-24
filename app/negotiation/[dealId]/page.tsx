'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Fix for static export + dynamic route
export async function generateStaticParams() {
  return [];
}

interface Dealership {
  id: number;
  name: string;
  distance: number;
  phone: string;
  status: 'Not Called' | 'Called' | 'Follow Up';
  lastCalled?: string;
}

interface CallLog {
  id: number;
  dealershipName: string;
  timestamp: string;
  notes: string;
  rating: number;
}

export default function ClientDealFile() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.dealId as string;

  // Mock client + vehicle data (we'll connect to real data later)
  const [clientName] = useState('Johnathan Reyes');
  const [vehicle] = useState('2025 Toyota Tundra Limited');
  const [vehicleDetails] = useState('4x4 CrewMax • Midnight Black • Black Leather');

  // Dealerships (mock data)
  const [dealerships, setDealerships] = useState<Dealership[]>([
    { id: 1, name: 'Toyota of St. Charles', distance: 4.2, phone: '(636) 555-0123', status: 'Not Called' },
    { id: 2, name: 'Suntrup Toyota', distance: 7.8, phone: '(314) 555-0199', status: 'Not Called' },
    { id: 3, name: 'Lou Fusz Toyota', distance: 12.1, phone: '(314) 555-0145', status: 'Called' },
    { id: 4, name: 'Frank Leta Toyota', distance: 15.4, phone: '(636) 555-0177', status: 'Not Called' },
    { id: 5, name: 'Toyota South', distance: 22.6, phone: '(618) 555-0133', status: 'Follow Up' },
  ]);

  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [totalTime, setTotalTime] = useState(12); // minutes
  const [isWorking, setIsWorking] = useState(false);
  const [selectedDealership, setSelectedDealership] = useState<Dealership | null>(null);
  const [callNotes, setCallNotes] = useState('');
  const [callRating, setCallRating] = useState(3);

  const calledCount = dealerships.filter(d => d.status !== 'Not Called').length;

  // Simple timer
  const toggleTimer = () => {
    setIsWorking(!isWorking);
    if (!isWorking) {
      const interval = setInterval(() => {
        setTotalTime(prev => prev + 1);
      }, 60000);
    }
  };

  const openCallModal = (dealership: Dealership) => {
    setSelectedDealership(dealership);
    setCallNotes('');
    setCallRating(3);
  };

  const logCall = () => {
    if (!selectedDealership) return;

    const newLog: CallLog = {
      id: Date.now(),
      dealershipName: selectedDealership.name,
      timestamp: new Date().toLocaleString(),
      notes: callNotes,
      rating: callRating,
    };

    setCallLogs([newLog, ...callLogs]);

    // Update dealership status
    setDealerships(prev =>
      prev.map(d =>
        d.id === selectedDealership.id
          ? { ...d, status: 'Called', lastCalled: new Date().toLocaleDateString() }
          : d
      )
    );

    setSelectedDealership(null);
    setCallNotes('');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button 
              onClick={() => router.push('/negotiation')}
              className="text-emerald-600 hover:underline mb-2 text-sm"
            >
              ← Back to Queue
            </button>
            <h1 className="text-3xl font-bold">{clientName}</h1>
            <p className="text-slate-600">{vehicle} • {vehicleDetails}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white rounded-2xl shadow px-6 py-3 text-center">
              <div className="text-xs text-slate-500">TIME WORKED</div>
              <div className="text-3xl font-bold">{totalTime} <span className="text-lg">min</span></div>
            </div>
            <button
              onClick={toggleTimer}
              className={`px-6 py-3 rounded-2xl font-medium transition ${isWorking 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
            >
              {isWorking ? 'Stop Timer' : 'Start Working'}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Dealerships */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Nearby Dealerships</h2>
                <div className="text-sm text-slate-500">
                  {calledCount} of {dealerships.length} contacted
                </div>
              </div>

              <div className="space-y-3">
                {dealerships.map((dealer) => (
                  <div 
                    key={dealer.id} 
                    className="flex items-center justify-between border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 transition"
                  >
                    <div>
                      <div className="font-semibold">{dealer.name}</div>
                      <div className="text-sm text-slate-500">{dealer.distance} miles away • {dealer.phone}</div>
                      {dealer.lastCalled && (
                        <div className="text-xs text-emerald-600 mt-1">Last called: {dealer.lastCalled}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1 rounded-full text-xs font-medium ${
                        dealer.status === 'Not Called' ? 'bg-slate-100 text-slate-600' :
                        dealer.status === 'Called' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {dealer.status}
                      </span>

                      <button 
                        onClick={() => openCallModal(dealer)}
                        className="px-5 py-2 bg-emerald-600 text-white text-sm rounded-2xl hover:bg-emerald-700 transition"
                      >
                        Log Call
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow p-8">
              <h3 className="font-semibold mb-4">File Summary</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Deal ID</span>
                  <span className="font-mono">{dealId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status</span>
                  <span className="font-medium text-emerald-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Dealerships Contacted</span>
                  <span className="font-semibold">{calledCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Time</span>
                  <span className="font-semibold">{totalTime} minutes</span>
                </div>
              </div>
            </div>

            {/* Call Log */}
            <div className="bg-white rounded-3xl shadow p-8">
              <h3 className="font-semibold mb-4">Call Log ({callLogs.length})</h3>
              {callLogs.length > 0 ? (
                <div className="space-y-4 text-sm">
                  {callLogs.map((log) => (
                    <div key={log.id} className="border-l-4 border-emerald-500 pl-4">
                      <div className="font-medium">{log.dealershipName}</div>
                      <div className="text-xs text-slate-500">{log.timestamp} • Rating: {log.rating}/5</div>
                      {log.notes && <div className="mt-1 text-slate-700">{log.notes}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No calls logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Call Logging Modal */}
      {selectedDealership && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-8">
            <h3 className="text-xl font-semibold mb-2">Log Call</h3>
            <p className="text-slate-600 mb-6">{selectedDealership.name}</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Notes / Outcome</label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl p-4 h-28 resize-none"
                  placeholder="Price quoted, availability, next steps..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Rating (for future prioritization)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(r => (
                    <button
                      key={r}
                      onClick={() => setCallRating(r)}
                      className={`w-10 h-10 rounded-2xl border text-sm font-medium transition ${
                        callRating === r 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : 'border-slate-300 hover:bg-slate-100'
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
                className="flex-1 py-3 border border-slate-300 rounded-2xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={logCall}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700"
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