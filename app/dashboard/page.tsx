'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Advocate emails — swap for real auth later
const ADVOCATE_EMAILS = ['ryun.stuart@gmail.com', 'advocate@driveadvocate.com'];

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
  callLogs: any[];
  dealerships: { status: string }[];
}

const BASE_DEALS: Deal[] = [
  { id: 'deal-001', clientName: 'Johnathan Reyes', vehicle: '2025 Toyota Tundra Limited', submitted: '2026-06-23', status: 'New', priority: 1 },
  { id: 'deal-002', clientName: 'Maria Gonzalez', vehicle: '2026 Ford F-150 Lariat', submitted: '2026-06-22', status: 'In Progress', priority: 2 },
  { id: 'deal-003', clientName: 'David Chen', vehicle: '2025 Chevrolet Silverado 1500', submitted: '2026-06-22', status: 'Follow Up', priority: 3 },
  { id: 'deal-004', clientName: 'Sarah Patel', vehicle: '2025 Ram 1500 Limited', submitted: '2026-06-21', status: 'In Progress', priority: 4 },
];

function getDealStats(dealId: string) {
  try {
    const saved = localStorage.getItem(`dealfile-${dealId}`);
    if (!saved) return { timeSpent: 0, dealershipsContacted: 0, callCount: 0 };
    const state: DealFileState = JSON.parse(saved);
    return {
      timeSpent: state.totalTime || 0,
      dealershipsContacted: state.dealerships?.filter(d => d.status !== 'Not Called').length || 0,
      callCount: state.callLogs?.length || 0,
    };
  } catch { return { timeSpent: 0, dealershipsContacted: 0, callCount: 0 }; }
}

function formatTime(mins: number) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── ADVOCATE DASHBOARD ───────────────────────────────────────────────────────
function AdvocateDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const router = useRouter();
  const [deals] = useState<Deal[]>(BASE_DEALS);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [pendingDeals, setPendingDeals] = useState<any[]>([]);

  useEffect(() => {
    const s: Record<string, any> = {};
    BASE_DEALS.forEach(d => { s[d.id] = getDealStats(d.id); });
    setStats(s);
    setPendingDeals(JSON.parse(localStorage.getItem('pendingDeals') || '[]'));
  }, []);

  const totalTime = Object.values(stats).reduce((sum: number, s: any) => sum + (s.timeSpent || 0), 0);
  const totalCalls = Object.values(stats).reduce((sum: number, s: any) => sum + (s.callCount || 0), 0);
  const newDeals = deals.filter(d => d.status === 'New').length;
  const inProgress = deals.filter(d => d.status === 'In Progress').length;

  const statusColors: Record<string, string> = {
    'New': 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    'Follow Up': 'bg-purple-100 text-purple-700',
    'Complete': 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="DriveAdvocate" className="h-9" />
            <span className="text-xl font-bold">DriveAdvocate</span>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium ml-1">Advocate</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/negotiation')} className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition">
              Queue
            </button>
            <button onClick={onLogout} className="text-sm text-slate-400 hover:text-slate-600 transition">
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">{getGreeting()}, {user.firstName || 'Advocate'}</h1>
            <p className="text-slate-500 mt-1">Here's where things stand today</p>
          </div>
          <button
            onClick={() => router.push('/onboarding/profile')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 transition"
          >
            + New Client
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Active Files</div>
            <div className="text-4xl font-bold mt-1">{deals.length}</div>
          </div>
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Need Attention</div>
            <div className="text-4xl font-bold mt-1 text-amber-500">{newDeals + inProgress}</div>
          </div>
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Calls Logged</div>
            <div className="text-4xl font-bold mt-1">{totalCalls}</div>
          </div>
          <div className="bg-white rounded-3xl shadow p-6">
            <div className="text-sm text-slate-500">Time This Week</div>
            <div className="text-4xl font-bold mt-1">{formatTime(totalTime)}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Active queue */}
          <div className="lg:col-span-2 space-y-6">

            {/* Pending new submissions */}
            {pendingDeals.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
                <h2 className="font-semibold text-amber-800 mb-4">
                  🔔 {pendingDeals.length} new submission{pendingDeals.length > 1 ? 's' : ''} waiting
                </h2>
                <div className="space-y-3">
                  {pendingDeals.map((deal: any) => (
                    <div key={deal.id} className="bg-white rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{deal.clientName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{deal.vehicle}</div>
                        {deal.budget && <div className="text-xs text-slate-400 mt-0.5">Budget: {deal.budget} · {deal.timeline}</div>}
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">New</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deal queue */}
            <div className="bg-white rounded-3xl shadow overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-lg">Active Queue</h2>
                <button onClick={() => router.push('/negotiation')} className="text-sm text-emerald-600 hover:underline">
                  View full queue →
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {deals.map(deal => {
                  const s = stats[deal.id] || {};
                  return (
                    <div
                      key={deal.id}
                      onClick={() => router.push(`/negotiation/${deal.id}`)}
                      className="px-8 py-5 hover:bg-slate-50 cursor-pointer transition flex items-center gap-6"
                    >
                      <div className="font-mono font-bold text-emerald-600 text-lg w-8">#{deal.priority}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{deal.clientName}</div>
                        <div className="text-sm text-slate-500 truncate">{deal.vehicle}</div>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${statusColors[deal.status]}`}>
                        {deal.status}
                      </span>
                      <div className="text-right shrink-0 hidden md:block">
                        <div className="text-sm font-semibold">{s.callCount || 0} calls</div>
                        <div className="text-xs text-slate-400">{formatTime(s.timeSpent || 0)}</div>
                      </div>
                      <div className="text-slate-300">→</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Status breakdown */}
            <div className="bg-white rounded-3xl shadow p-6">
              <h3 className="font-semibold mb-4">Queue Breakdown</h3>
              <div className="space-y-3">
                {(['New', 'In Progress', 'Follow Up', 'Complete'] as const).map(status => {
                  const count = deals.filter(d => d.status === status).length;
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status]}`}>{status}</span>
                      </div>
                      <span className="font-semibold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-3xl shadow p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button onClick={() => router.push('/negotiation')} className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-sm font-medium">
                  📋 Open Negotiation Queue
                </button>
                <button onClick={() => router.push('/onboarding/profile')} className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-sm font-medium">
                  ➕ Add New Client
                </button>
                <button onClick={() => router.push('/negotiation/deal-001')} className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-sm font-medium">
                  🔥 Open Priority #1 File
                </button>
              </div>
            </div>

            {/* Today's focus */}
            <div className="bg-emerald-600 rounded-3xl p-6 text-white">
              <h3 className="font-semibold mb-2">Today's Focus</h3>
              <p className="text-emerald-100 text-sm mb-4">
                {newDeals > 0
                  ? `You have ${newDeals} new file${newDeals > 1 ? 's' : ''} that haven't been touched yet.`
                  : 'All files have been contacted. Follow up on open leads.'}
              </p>
              <button
                onClick={() => router.push(`/negotiation/${deals.find(d => d.status === 'New')?.id || deals[0].id}`)}
                className="w-full py-2.5 bg-white text-emerald-700 rounded-2xl text-sm font-semibold hover:bg-emerald-50 transition"
              >
                {newDeals > 0 ? 'Start Next New File →' : 'Review Follow-Ups →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT DASHBOARD ─────────────────────────────────────────────────────────
function ClientDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<any>({});
  const [profile, setProfile] = useState<any>({});

  useEffect(() => {
    setVehicle(JSON.parse(localStorage.getItem('vehicleFormData') || '{}'));
    setProfile(JSON.parse(localStorage.getItem('profileData') || '{}'));
  }, []);

  const vehicleSummary = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.trim || ''}`.trim();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="DriveAdvocate" className="h-9" />
            <span className="text-xl font-bold">DriveAdvocate</span>
          </div>
          <button onClick={onLogout} className="text-sm text-slate-400 hover:text-slate-600 transition">
            Log out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">{getGreeting()}, {profile.firstName || user.firstName || 'there'} 👋</h1>
          <p className="text-slate-500 mt-1">Your advocate is working on your deal.</p>
        </div>

        {/* Deal status card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="text-emerald-400 text-sm font-medium uppercase tracking-wide">Negotiation Active</span>
                </div>
                <h2 className="text-white text-2xl font-bold">{vehicleSummary || 'Your Vehicle'}</h2>
                {vehicle.exteriorColor1 && (
                  <p className="text-slate-300 text-sm mt-1">
                    {vehicle.exteriorColor1} Ext · {vehicle.interiorColor1} Int
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-white">In Progress</div>
                <div className="text-slate-400 text-sm mt-1">Dealerships being contacted</div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-sm text-slate-500 mb-1">Budget</div>
                <div className="font-semibold">{profile.budget || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Timeline</div>
                <div className="font-semibold text-sm">{profile.timeline || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Search Radius</div>
                <div className="font-semibold">{profile.searchRadius || '25'} miles</div>
              </div>
            </div>
          </div>
        </div>

        {/* What's happening */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-3xl shadow p-6">
            <h3 className="font-semibold mb-4">What's happening</h3>
            <div className="space-y-4">
              {[
                { done: true, label: 'Profile & vehicle submitted' },
                { done: true, label: 'File assigned to advocate' },
                { done: false, label: 'Dealerships being contacted' },
                { done: false, label: 'Best offer identified' },
                { done: false, label: 'You approve the deal' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${item.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {item.done ? '✓' : ''}
                  </div>
                  <span className={`text-sm ${item.done ? 'text-slate-700' : 'text-slate-400'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow p-6">
            <h3 className="font-semibold mb-4">Your build</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle</span>
                <span className="font-medium text-right max-w-[180px]">{vehicleSummary || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Exterior</span>
                <span className="font-medium">{vehicle.exteriorColor1 || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Interior</span>
                <span className="font-medium">{vehicle.interiorColor1 || '—'}</span>
              </div>
              {vehicle.accessories?.length > 0 && (
                <div>
                  <span className="text-slate-500">Accessories</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {vehicle.accessories.map((acc: string) => (
                      <span key={acc} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{acc}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-slate-800 rounded-3xl p-8 text-white text-center">
          <h3 className="text-xl font-semibold mb-2">Have questions about your deal?</h3>
          <p className="text-slate-300 text-sm mb-6">Your advocate will reach out soon. In the meantime you can reach us directly.</p>
          <a href="mailto:hello@driveadvocate.com" className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-medium transition">
            Contact Your Advocate
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT: detect role and render correct dashboard ───────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdvocate, setIsAdvocate] = useState(false);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.email) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    setIsAdvocate(ADVOCATE_EMAILS.includes(currentUser.email.toLowerCase()));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-400">Loading...</div>
    </div>
  );

  return isAdvocate
    ? <AdvocateDashboard user={user} onLogout={handleLogout} />
    : <ClientDashboard user={user} onLogout={handleLogout} />;
}
