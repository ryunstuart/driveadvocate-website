'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
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
  callLogs: any[];
  dealerships: { status: string }[];
  offers: any[];
  dealStatus: string;
}

const STATUS_DISPLAY: Record<string, string> = {
  'New': 'New',
  'InProgress': 'In Progress',
  'FollowUp': 'Follow Up',
  'OfferReceived': 'Offer Received',
  'Complete': 'Complete',
  'Dead': 'Dead',
};

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
  if (!mins) return '0m';
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
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [pendingDeals, setPendingDeals] = useState<any[]>([]);

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
              id: d.id,
              clientName: d.clientName,
              vehicle,
              submitted,
              status: STATUS_DISPLAY[d.status || 'New'] || d.status || 'New',
              priority: d.priority ?? i + 1,
            };
          })
        );
        mapped.sort((a, b) => a.priority - b.priority);
        setDeals(mapped);

        const s: Record<string, any> = {};
        mapped.forEach(d => { s[d.id] = getDealStats(d.id); });
        setStats(s);
      } catch (e) {
        console.error('Failed to load deals from AppSync', e);
      }
    }
    loadDeals();
  }, []);

  const totalTime = Object.values(stats).reduce((sum: number, s: any) => sum + (s.timeSpent || 0), 0);
  const totalCalls = Object.values(stats).reduce((sum: number, s: any) => sum + (s.callCount || 0), 0);
  const newDeals = deals.filter(d => d.status === 'New').length;
  const inProgress = deals.filter(d => d.status === 'In Progress').length;
  const firstPriorityDeal = deals.find(d => d.status === 'New') || deals.find(d => d.status === 'Follow Up') || deals[0];

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

      <div className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">{getGreeting()}, {user.firstName || 'Advocate'}</h1>
            <p className="text-slate-500 mt-1">Here's where things stand today</p>
          </div>
          <button onClick={() => router.push('/advocate/intake')} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 transition">
            + New Client
          </button>
        </div>

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
          <div className="lg:col-span-2 space-y-6">
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

            <div className="bg-white rounded-3xl shadow overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-lg">Active Queue</h2>
                <button onClick={() => router.push('/negotiation')} className="text-sm text-emerald-600 hover:underline">View full queue →</button>
              </div>
              <div className="divide-y divide-slate-100">
                {deals.map(deal => {
                  const s = stats[deal.id] || {};
                  return (
                    <div key={deal.id} onClick={() => router.push(`/negotiation/${deal.id}`)} className="px-8 py-5 hover:bg-slate-50 cursor-pointer transition flex items-center gap-5">
                      <div className="font-mono font-bold text-emerald-600 text-lg w-8 shrink-0">#{deal.priority}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{deal.clientName}</div>
                        <div className="text-sm text-slate-500 truncate">{deal.vehicle}</div>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${statusColors[deal.status] || 'bg-slate-100 text-slate-600'}`}>{deal.status}</span>
                      <div className="text-right shrink-0 hidden md:block">
                        <div className="text-sm font-semibold">{s.callCount || 0} calls</div>
                        <div className="text-xs text-slate-400">{formatTime(s.timeSpent || 0)}</div>
                      </div>
                      <div className="text-slate-300 shrink-0">→</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow p-6">
              <h3 className="font-semibold mb-4">Queue Breakdown</h3>
              <div className="space-y-3">
                {(['New', 'In Progress', 'Follow Up', 'Offer Received', 'Complete'] as const).map(status => (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[status]}`}>{status}</span>
                    <span className="font-semibold">{deals.filter(d => d.status === status).length}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button onClick={() => router.push('/negotiation')} className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-sm font-medium">📋 Open Negotiation Queue</button>
                <button onClick={() => router.push('/clients')} className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-sm font-medium">👥 View All Clients</button>
                <button onClick={() => router.push('/advocate/intake')} className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-sm font-medium">➕ Add New Client</button>
                <button onClick={() => router.push(`/negotiation/${firstPriorityDeal?.id}`)} className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-sm font-medium">🔥 Open Priority #1 File</button>
              </div>
            </div>

            <div className="bg-emerald-600 rounded-3xl p-6 text-white">
              <h3 className="font-semibold mb-2">Today's Focus</h3>
              <p className="text-emerald-100 text-sm mb-4">
                {newDeals > 0 ? `You have ${newDeals} new file${newDeals > 1 ? 's' : ''} that haven't been touched yet.` : 'All files contacted. Follow up on open leads.'}
              </p>
              <button onClick={() => router.push(`/negotiation/${firstPriorityDeal?.id}`)} className="w-full py-2.5 bg-white text-emerald-700 rounded-2xl text-sm font-semibold hover:bg-emerald-50 transition">
                {newDeals > 0 ? 'Start Next New File →' : 'Review Follow-Ups →'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── CLIENT DASHBOARD ─────────────────────────────────────────────────────────
function ClientDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<any>({});
  const [profile, setProfile] = useState<any>({});
  const [dealStatus, setDealStatus] = useState<string>('New');
  const [offers, setOffers] = useState<any[]>([]);

  const fetchDealData = async (dealId: string) => {
    try {
      const [dealResult, offersResult] = await Promise.all([
        dataClient.models.Deal.get({ id: dealId }),
        dataClient.models.Offer.list({ filter: { dealId: { eq: dealId } } }),
      ]);

      if (dealResult.data) {
        const s = dealResult.data.status || 'New';
        setDealStatus(STATUS_DISPLAY[s] || s);
      }

      if (offersResult.data) {
        setOffers(offersResult.data.map(o => {
          const price = o.quotedPrice;
          const msrp = o.msrp || 0;
          const disc = msrp && price ? msrp - price : 0;
          return {
            dealershipName: o.dealershipName,
            price: '$' + price.toLocaleString('en-US', { minimumFractionDigits: 0 }),
            msrp: msrp ? '$' + msrp.toLocaleString('en-US', { minimumFractionDigits: 0 }) : '',
            discount: disc > 0 ? `$${disc.toLocaleString('en-US')} below MSRP` : '',
            notes: o.notes || '',
            status: o.status || 'Pending',
          };
        }));
      }
    } catch (err) {
      console.error('Failed to fetch deal data from AppSync', err);
    }
  };

  useEffect(() => {
    setVehicle(JSON.parse(localStorage.getItem('vehicleFormData') || '{}'));
    setProfile(JSON.parse(localStorage.getItem('profileData') || '{}'));

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const activeDealId = currentUser.activeDealId;

    if (activeDealId) {
      fetchDealData(activeDealId);
      const pollInterval = setInterval(() => fetchDealData(activeDealId), 60000);
      return () => clearInterval(pollInterval);
    }
  }, []);

  const vehicleSummary = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.trim || ''}`.trim();
  const bestOffer = offers.find(o => o.status === 'Best');

  const getSteps = () => {
    const statusOrder = ['New', 'In Progress', 'Follow Up', 'Offer Received', 'Complete'];
    const idx = statusOrder.indexOf(dealStatus);
    return [
      { label: 'Profile & vehicle submitted', done: true, active: false },
      { label: 'File assigned to advocate', done: true, active: false },
      { label: 'Dealerships being contacted', done: idx >= 1, active: idx === 1 },
      { label: 'Follow up in progress', done: idx >= 2, active: idx === 2 },
      { label: 'Best offer identified', done: idx >= 3, active: idx === 3 },
      { label: 'Deal approved & complete', done: idx >= 4, active: false },
    ];
  };

  const headerConfig: Record<string, any> = {
    'New': { bg: 'from-slate-800 to-slate-700', badge: 'File Created', badgeColor: 'text-blue-400', title: 'Getting Started', subtitle: 'Your advocate is reviewing your submission' },
    'In Progress': { bg: 'from-slate-800 to-slate-700', badge: 'Negotiation Active', badgeColor: 'text-emerald-400', title: 'Dealers Being Contacted', subtitle: 'Your advocate is reaching out to dealerships now' },
    'Follow Up': { bg: 'from-slate-800 to-slate-700', badge: 'Follow Up', badgeColor: 'text-amber-400', title: 'Following Up on Leads', subtitle: 'Waiting on responses from dealerships' },
    'Offer Received': { bg: 'from-emerald-800 to-emerald-700', badge: 'Offer Received', badgeColor: 'text-emerald-300', title: 'We Have an Offer!', subtitle: 'Your advocate has found a deal worth reviewing' },
    'Complete': { bg: 'from-slate-900 to-slate-800', badge: 'Deal Complete', badgeColor: 'text-emerald-400', title: 'Congratulations!', subtitle: 'Your deal has been finalized' },
    'Dead': { bg: 'from-slate-700 to-slate-600', badge: 'Closed', badgeColor: 'text-slate-400', title: 'Deal Closed', subtitle: 'This deal has been closed — contact us to start a new one' },
  };

  const hc = headerConfig[dealStatus] || headerConfig['New'];
  const steps = getSteps();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />

      <div className="max-w-4xl mx-auto px-6 py-10 flex-1 w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">{getGreeting()}, {profile.firstName || user.firstName || 'there'} 👋</h1>
          <p className="text-slate-500 mt-1">
            {dealStatus === 'Complete' ? 'Your deal is done — enjoy your new vehicle!' :
             dealStatus === 'Offer Received' ? 'Your advocate has found an offer for you.' :
             'Your advocate is working on your deal.'}
          </p>
        </div>

        {/* Status header card */}
        <div className={`bg-gradient-to-r ${hc.bg} rounded-3xl overflow-hidden mb-6`}>
          <div className="px-8 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {dealStatus !== 'Complete' && dealStatus !== 'Dead' && (
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  )}
                  <span className={`text-sm font-medium uppercase tracking-wide ${hc.badgeColor}`}>{hc.badge}</span>
                </div>
                <h2 className="text-white text-2xl font-bold">{hc.title}</h2>
                <p className="text-slate-300 text-sm mt-1">{hc.subtitle}</p>
                {vehicleSummary && <p className="text-slate-400 text-sm mt-2">{vehicleSummary}</p>}
              </div>
              {bestOffer && (
                <div className="text-right shrink-0 bg-white/10 rounded-2xl px-5 py-3">
                  <div className="text-xs text-slate-300 mb-1">Best Offer</div>
                  <div className="text-2xl font-bold text-white">{bestOffer.price}</div>
                  {bestOffer.discount && <div className="text-xs text-emerald-300 mt-0.5">{bestOffer.discount}</div>}
                </div>
              )}
            </div>
          </div>
          <div className="bg-black/20 px-8 py-4">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-xs text-slate-400 mb-1">Budget</div>
                <div className="text-white font-medium text-sm">{profile.budget || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Timeline</div>
                <div className="text-white font-medium text-sm">{profile.timeline || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Search Radius</div>
                <div className="text-white font-medium text-sm">{profile.searchRadius || '25'} miles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Offer received callout */}
        {dealStatus === 'Offer Received' && bestOffer && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-6 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Best Offer Found</div>
                <div className="text-2xl font-bold text-slate-900">{bestOffer.dealershipName}</div>
                <div className="text-3xl font-bold text-emerald-600 mt-1">{bestOffer.price}</div>
                {bestOffer.msrp && <div className="text-sm text-slate-400 line-through">{bestOffer.msrp} MSRP</div>}
                {bestOffer.discount && <div className="text-sm text-emerald-600 font-medium mt-0.5">{bestOffer.discount}</div>}
                {bestOffer.notes && <div className="text-sm text-slate-500 mt-2">{bestOffer.notes}</div>}
              </div>
              <span className="text-3xl">🎉</span>
            </div>
            <div className="mt-4 pt-4 border-t border-emerald-200">
              <p className="text-sm text-slate-600">Your advocate will contact you shortly to walk through this offer and next steps.</p>
            </div>
          </div>
        )}

        {/* Complete callout */}
        {dealStatus === 'Complete' && (
          <div className="bg-slate-900 rounded-3xl p-8 mb-6 text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-white mb-2">Deal Complete!</h3>
            <p className="text-slate-300 text-sm mb-4">
              {bestOffer
                ? `You got ${bestOffer.dealershipName} at ${bestOffer.price}${bestOffer.discount ? ` — ${bestOffer.discount}` : ''}.`
                : 'Your deal has been finalized. Enjoy your new vehicle!'}
            </p>
            <p className="text-slate-400 text-xs">Thank you for choosing DriveAdvocate.</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Progress steps */}
          <div className="bg-white rounded-3xl shadow p-6">
            <h3 className="font-semibold mb-5">Deal Progress</h3>
            <div className="space-y-4">
              {steps.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    item.done ? 'bg-emerald-500 text-white' :
                    item.active ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-600' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {item.done ? '✓' : ''}
                  </div>
                  <span className={`text-sm ${
                    item.done ? 'text-slate-700 font-medium' :
                    item.active ? 'text-emerald-600 font-semibold' :
                    'text-slate-400'
                  }`}>
                    {item.label}
                    {item.active && <span className="ml-2 text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">In progress</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Build summary */}
          <div className="bg-white rounded-3xl shadow p-6">
            <h3 className="font-semibold mb-5">Your Build</h3>
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
              <div className="flex justify-between">
                <span className="text-slate-500">Budget</span>
                <span className="font-medium">{profile.budget || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Radius</span>
                <span className="font-medium">{profile.searchRadius || '25'} miles</span>
              </div>
              {vehicle.accessories?.length > 0 && (
                <div>
                  <span className="text-slate-500 block mb-2">Accessories</span>
                  <div className="flex flex-wrap gap-1.5">
                    {vehicle.accessories.map((acc: string) => (
                      <span key={acc} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{acc}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {dealStatus !== 'Complete' && (
          <div className="bg-slate-800 rounded-3xl p-8 text-white text-center">
            <h3 className="text-xl font-semibold mb-2">Have questions about your deal?</h3>
            <p className="text-slate-300 text-sm mb-6">Your advocate will reach out soon. In the meantime you can reach us directly.</p>
            <a href="mailto:info@driveadvocate.com" className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-medium transition">
              Contact Your Advocate
            </a>
          </div>
        )}

        {dealStatus === 'Complete' && (
          <div className="bg-emerald-600 rounded-3xl p-8 text-white text-center">
            <h3 className="text-xl font-semibold mb-2">Ready for another vehicle?</h3>
            <p className="text-emerald-100 text-sm mb-6">We'd love to help you find your next deal.</p>
            <button
              onClick={() => router.push('/onboarding/profile')}
              className="inline-block bg-white text-emerald-700 px-8 py-3 rounded-2xl font-semibold hover:bg-emerald-50 transition"
            >
              Start a New Deal
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
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
    setIsAdvocate(currentUser.isAdvocate === true);
  }, [router]);

  const handleLogout = async () => {
    try { await signOut(); } catch {}
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading your dashboard...</p>
      </div>
    </div>
  );

  return isAdvocate
    ? <AdvocateDashboard user={user} onLogout={handleLogout} />
    : <ClientDashboard user={user} onLogout={handleLogout} />;
}
