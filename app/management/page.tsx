'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { dataClient } from '@/app/lib/amplify-data';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import DrillDownPanel from '@/app/components/DrillDownPanel';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  CartesianGrid, Legend, ScatterChart, Scatter, LineChart, Line, ReferenceLine,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DealRecord { id: string; clientName: string; clientEmail: string; status: string; budget: string; timeline: string; serviceLevel: string; totalTimeMinutes: number; submittedAt: string; createdAt: string; advocateId: string; priority: number; }
interface CallLogRecord { id: string; dealId: string; dealershipName: string; outcome: string; rating: number; createdAt: string; }
interface OfferRecord { id: string; dealId: string; dealershipName: string; quotedPrice: number; msrp: number; status: string; createdAt: string; }

const STATUS_DISPLAY: Record<string, string> = { New: 'New', InProgress: 'In Progress', FollowUp: 'Follow Up', OfferReceived: 'Offer Received', Complete: 'Complete', Dead: 'Dead' };
const STATUS_COLORS_HEX: Record<string, string> = { New: '#3b82f6', 'In Progress': '#f59e0b', 'Follow Up': '#8b5cf6', 'Offer Received': '#f97316', Complete: '#059669', Dead: '#94a3b8' };
const SERVICE_PRICES: Record<string, number> = { 'Research Package': 149, 'Negotiation Service': 999, 'Full Concierge': 2250 };
const EMERALD = '#059669';
const SLATE = '#0f172a';
const TABS = ['Overview', 'Pipeline', 'Advocates', 'Clients', 'Revenue'] as const;
type TabType = typeof TABS[number];

type DateRange = '7d' | '30d' | '90d' | 'year' | 'all';

function getRangeStart(range: DateRange): Date | null {
  const now = new Date();
  if (range === '7d') return new Date(now.getTime() - 7 * 86400000);
  if (range === '30d') return new Date(now.getTime() - 30 * 86400000);
  if (range === '90d') return new Date(now.getTime() - 90 * 86400000);
  if (range === 'year') return new Date(now.getFullYear(), 0, 1);
  return null;
}

function formatTime(mins: number) { if (!mins) return '0m'; if (mins < 60) return `${mins}m`; return `${Math.floor(mins / 60)}h ${mins % 60}m`; }
function daysBetween(a: string, b: Date) { return Math.floor((b.getTime() - new Date(a).getTime()) / 86400000); }

// ─── Component ───────────────────────────────────────────────────────────────

export default function ManagementDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('Overview');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [deals, setDeals] = useState<DealRecord[]>([]);
  const [callLogs, setCallLogs] = useState<CallLogRecord[]>([]);
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [drillDown, setDrillDown] = useState<{ open: boolean; title: string; items: any[]; type: string }>({ open: false, title: '', items: [], type: '' });

  useEffect(() => {
    (async () => {
      try {
        const session = await fetchAuthSession();
        const groups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[]) || [];
        if (!groups.includes('admins')) { router.push('/dashboard'); return; }
      } catch { router.push('/login'); return; }

      try {
        const [d, c, o] = await Promise.all([
          dataClient.models.Deal.list(),
          dataClient.models.CallLog.list(),
          dataClient.models.Offer.list(),
        ]);
        setDeals((d.data || []).map((r: any) => ({ ...r, status: STATUS_DISPLAY[r.status] || r.status || 'New' })));
        setCallLogs(c.data || []);
        setOffers(o.data || []);
      } catch (err) { console.error('Failed to load management data', err); }
      setLoading(false);
    })();
  }, [router]);

  const rangeStart = getRangeStart(dateRange);
  const filtered = useMemo(() => {
    if (!rangeStart) return deals;
    return deals.filter(d => new Date(d.submittedAt || d.createdAt) >= rangeStart);
  }, [deals, rangeStart]);

  const filteredCalls = useMemo(() => {
    if (!rangeStart) return callLogs;
    return callLogs.filter(c => new Date(c.createdAt) >= rangeStart);
  }, [callLogs, rangeStart]);

  const filteredOffers = useMemo(() => {
    if (!rangeStart) return offers;
    return offers.filter(o => new Date(o.createdAt) >= rangeStart);
  }, [offers, rangeStart]);

  // ─── Computed Metrics ─────────────────────────────────────────────

  const totalDeals = filtered.length;
  const closedDeals = filtered.filter(d => d.status === 'Complete').length;
  const closeRate = totalDeals > 0 ? Math.round((closedDeals / totalDeals) * 100) : 0;
  const avgTime = totalDeals > 0 ? Math.round(filtered.reduce((s, d) => s + (d.totalTimeMinutes || 0), 0) / totalDeals) : 0;
  const estRevenue = filtered.reduce((s, d) => s + (SERVICE_PRICES[d.serviceLevel || ''] || 0), 0);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1; });
    return counts;
  }, [filtered]);

  const pipelineData = ['New', 'In Progress', 'Follow Up', 'Offer Received', 'Complete'].map(s => ({
    name: s, value: statusCounts[s] || 0, fill: STATUS_COLORS_HEX[s],
  }));

  const vehicleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(d => {
      const name = d.clientName ? `${d.budget || 'Deal'}` : 'Unknown';
      counts[d.serviceLevel || 'Unknown'] = (counts[d.serviceLevel || 'Unknown'] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { submitted: number; closed: number; revenue: number }> = {};
    filtered.forEach(d => {
      const m = (d.submittedAt || d.createdAt || '').slice(0, 7);
      if (!m) return;
      if (!months[m]) months[m] = { submitted: 0, closed: 0, revenue: 0 };
      months[m].submitted++;
      if (d.status === 'Complete') { months[m].closed++; months[m].revenue += SERVICE_PRICES[d.serviceLevel || ''] || 0; }
    });
    return Object.entries(months).sort().map(([month, data]) => ({ month, ...data }));
  }, [filtered]);

  const budgetSegments = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(d => { counts[d.budget || 'Not set'] = (counts[d.budget || 'Not set'] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const timelineSegments = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(d => { counts[d.timeline || 'Not set'] = (counts[d.timeline || 'Not set'] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const tierSegments = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(d => { counts[d.serviceLevel || 'Not set'] = (counts[d.serviceLevel || 'Not set'] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const revenueByTier = useMemo(() => {
    const tiers: Record<string, number> = {};
    filtered.filter(d => d.status === 'Complete').forEach(d => {
      const tier = d.serviceLevel || 'Unknown';
      tiers[tier] = (tiers[tier] || 0) + (SERVICE_PRICES[tier] || 0);
    });
    return Object.entries(tiers).map(([name, revenue]) => ({ name, revenue }));
  }, [filtered]);

  const projectedRevenue = useMemo(() => {
    const pipeline = filtered.filter(d => d.status !== 'Complete' && d.status !== 'Dead');
    const pipelineValue = pipeline.reduce((s, d) => s + (SERVICE_PRICES[d.serviceLevel || ''] || 0), 0);
    return { pipelineValue, projected: Math.round(pipelineValue * (closeRate / 100 || 0.5)) };
  }, [filtered, closeRate]);

  const openDrillDown = (title: string, items: any[], type: string) => setDrillDown({ open: true, title, items, type });
  const now = new Date();

  const PIE_COLORS = ['#059669', '#0f172a', '#3b82f6', '#f59e0b', '#8b5cf6', '#f97316', '#ef4444', '#94a3b8'];

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading management dashboard...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header variant="authenticated" />

      {/* Dark header */}
      <div className="bg-slate-900 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-end justify-between">
          <div>
            <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">Management</div>
            <h1 className="text-2xl font-bold">DriveAdvocate Intelligence</h1>
          </div>
          <select value={dateRange} onChange={e => setDateRange(e.target.value as DateRange)} className="bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-2 text-sm">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="year">This year</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm font-medium border-b-2 transition ${tab === t ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">

        {/* ═══ TAB: OVERVIEW ═══ */}
        {tab === 'Overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'Total Deals', value: totalDeals, prefix: '', suffix: '' },
                { title: 'Close Rate', value: `${closeRate}%`, prefix: '', suffix: '' },
                { title: 'Est. Revenue', value: `$${estRevenue.toLocaleString()}`, prefix: '', suffix: '' },
                { title: 'Avg Time/Deal', value: formatTime(avgTime), prefix: '', suffix: '' },
              ].map(kpi => (
                <div key={kpi.title} className="bg-white rounded-3xl shadow p-6 cursor-pointer hover:shadow-lg transition">
                  <div className="text-sm text-slate-500 mb-1">{kpi.title}</div>
                  <div className="text-3xl font-bold">{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* Pipeline Funnel */}
            <div className="bg-white rounded-3xl shadow p-8">
              <h2 className="text-lg font-semibold mb-6">Deal Pipeline</h2>
              <div className="flex items-end gap-2 h-48">
                {pipelineData.map((stage, i) => (
                  <div key={stage.name} className="flex-1 flex flex-col items-center cursor-pointer group" onClick={() => openDrillDown(`${stage.name} (${stage.value})`, filtered.filter(d => d.status === stage.name), 'deals')}>
                    <div className="text-xs text-slate-500 mb-1 group-hover:text-emerald-600 transition">{stage.value}</div>
                    <div className="w-full rounded-t-xl transition-all group-hover:opacity-80" style={{ backgroundColor: stage.fill, height: `${Math.max((stage.value / Math.max(totalDeals, 1)) * 160, 8)}px` }} />
                    <div className="text-xs text-slate-600 mt-2 text-center font-medium">{stage.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deal Volume Trend */}
            {monthlyData.length > 0 && (
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-lg font-semibold mb-6">Deal Volume Trend</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip />
                    <Area dataKey="submitted" stroke={EMERALD} fill={EMERALD} fillOpacity={0.15} name="Submitted" />
                    <Area dataKey="closed" stroke={SLATE} fill={SLATE} fillOpacity={0.15} name="Closed" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Service Tier Distribution */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-lg font-semibold mb-6">By Service Tier</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={tierSegments} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {tierSegments.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-lg font-semibold mb-6">By Budget Range</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={budgetSegments} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${value}`}>
                      {budgetSegments.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: PIPELINE ═══ */}
        {tab === 'Pipeline' && (
          <div className="space-y-8">
            {/* Kanban columns */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['New', 'In Progress', 'Follow Up', 'Offer Received', 'Complete'].map(status => {
                const statusDeals = filtered.filter(d => d.status === status);
                return (
                  <div key={status} className="bg-white rounded-3xl shadow p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS_HEX[status] }} />
                      <span className="text-sm font-semibold">{status}</span>
                      <span className="text-xs text-slate-400 ml-auto">{statusDeals.length}</span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {statusDeals.map(deal => {
                        const days = daysBetween(deal.submittedAt || deal.createdAt, now);
                        return (
                          <div key={deal.id} onClick={() => openDrillDown(deal.clientName, [deal], 'deal-detail')}
                            className={`p-3 rounded-2xl border cursor-pointer hover:shadow transition text-xs ${
                              days > 14 ? 'border-red-200 bg-red-50' : days > 7 ? 'border-amber-200 bg-amber-50' : 'border-slate-200'
                            }`}>
                            <div className="font-semibold text-sm">{deal.clientName}</div>
                            <div className="text-slate-500 mt-0.5">{days}d open</div>
                          </div>
                        );
                      })}
                      {statusDeals.length === 0 && <div className="text-xs text-slate-400 text-center py-4">None</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Days in Stage Scatter */}
            <div className="bg-white rounded-3xl shadow p-8">
              <h2 className="text-lg font-semibold mb-6">Days in Stage</h2>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="days" name="Days Open" tick={{ fontSize: 12 }} label={{ value: 'Days Since Submission', position: 'bottom', fontSize: 12 }} />
                  <YAxis dataKey="stage" name="Stage" tick={{ fontSize: 12 }} domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tickFormatter={(v: number) => ['', 'New', 'In Prog', 'Follow', 'Offer', 'Done'][v] || ''} />
                  <Tooltip />
                  <Scatter data={filtered.filter(d => d.status !== 'Dead').map(d => ({
                    days: daysBetween(d.submittedAt || d.createdAt, now),
                    stage: ['New', 'In Progress', 'Follow Up', 'Offer Received', 'Complete'].indexOf(d.status) + 1,
                    name: d.clientName,
                  }))} fill={EMERALD} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ═══ TAB: ADVOCATES ═══ */}
        {tab === 'Advocates' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl shadow p-8">
              <h2 className="text-lg font-semibold mb-6">Advocate Performance</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {['Ryun Stuart', 'Keith'].map(name => {
                  const advDeals = filtered;
                  const advCalls = filteredCalls;
                  const advClosed = advDeals.filter(d => d.status === 'Complete').length;
                  const advActive = advDeals.filter(d => d.status !== 'Complete' && d.status !== 'Dead').length;
                  return (
                    <div key={name} className="border border-slate-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">{name[0]}</div>
                        <div>
                          <div className="font-semibold">{name}</div>
                          <div className="text-xs text-slate-500">Advocate</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">{advActive}</div>
                          <div className="text-xs text-slate-500">Active</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{advClosed}</div>
                          <div className="text-xs text-slate-500">Closed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{advCalls.length}</div>
                          <div className="text-xs text-slate-500">Calls</div>
                        </div>
                      </div>

                      {/* Activity heatmap */}
                      <div className="mt-6">
                        <div className="text-xs text-slate-500 mb-2">Activity (last 12 weeks)</div>
                        <div className="flex gap-1 flex-wrap">
                          {Array.from({ length: 84 }, (_, i) => {
                            const date = new Date(now.getTime() - (83 - i) * 86400000);
                            const dayStr = date.toISOString().slice(0, 10);
                            const count = advCalls.filter(c => c.createdAt?.slice(0, 10) === dayStr).length;
                            return (
                              <div key={i} className="w-3 h-3 rounded-sm" title={`${dayStr}: ${count} calls`}
                                style={{ backgroundColor: count > 0 ? `rgba(5,150,105,${Math.min(count / 5, 1)})` : '#e2e8f0' }} />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: CLIENTS ═══ */}
        {tab === 'Clients' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: 'By Budget', data: budgetSegments },
                { title: 'By Timeline', data: timelineSegments },
                { title: 'By Service Tier', data: tierSegments },
              ].map(chart => (
                <div key={chart.title} className="bg-white rounded-3xl shadow p-8">
                  <h2 className="text-lg font-semibold mb-4">{chart.title}</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={chart.data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value"
                        label={({ name, percent }) => `${name.length > 15 ? name.slice(0, 15) + '...' : name} ${(percent * 100).toFixed(0)}%`}>
                        {chart.data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} cursor="pointer"
                          onClick={() => openDrillDown(`${chart.title}: ${chart.data[i].name}`, filtered.filter(d => {
                            if (chart.title.includes('Budget')) return (d.budget || 'Not set') === chart.data[i].name;
                            if (chart.title.includes('Timeline')) return (d.timeline || 'Not set') === chart.data[i].name;
                            return (d.serviceLevel || 'Not set') === chart.data[i].name;
                          }), 'deals')} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ))}

              {/* Client acquisition trend */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-lg font-semibold mb-4">Client Acquisition</h2>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line dataKey="submitted" stroke={EMERALD} strokeWidth={2} dot={{ r: 4 }} name="New Clients" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-sm">No data for selected period</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: REVENUE ═══ */}
        {tab === 'Revenue' && (
          <div className="space-y-8">
            {/* Revenue KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-3xl shadow p-6">
                <div className="text-sm text-slate-500 mb-1">Total Revenue (Est.)</div>
                <div className="text-3xl font-bold text-emerald-600">${estRevenue.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-3xl shadow p-6">
                <div className="text-sm text-slate-500 mb-1">Pipeline Value</div>
                <div className="text-3xl font-bold">${projectedRevenue.pipelineValue.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-3xl shadow p-6">
                <div className="text-sm text-slate-500 mb-1">Projected ({closeRate}% close)</div>
                <div className="text-3xl font-bold text-emerald-600">${projectedRevenue.projected.toLocaleString()}</div>
              </div>
            </div>

            {/* Revenue by tier */}
            <div className="bg-white rounded-3xl shadow p-8">
              <h2 className="text-lg font-semibold mb-6">Revenue by Service Tier</h2>
              {revenueByTier.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueByTier}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill={EMERALD} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">No closed deals in selected period</div>
              )}
            </div>

            {/* Revenue trend */}
            {monthlyData.length > 0 && (
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-lg font-semibold mb-6">Monthly Revenue Trend</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                    <Area dataKey="revenue" stroke={EMERALD} fill={EMERALD} fillOpacity={0.15} name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <p className="text-xs text-slate-400 text-center">Revenue estimates based on service tier pricing. Actual collected revenue may differ.</p>
          </div>
        )}
      </div>

      {/* Drill-Down Panel */}
      <DrillDownPanel isOpen={drillDown.open} title={drillDown.title} onClose={() => setDrillDown(p => ({ ...p, open: false }))}>
        {drillDown.type === 'deals' && (
          <div className="space-y-3">
            {drillDown.items.map((d: DealRecord) => (
              <div key={d.id} onClick={() => router.push(`/negotiation/${d.id}`)} className="p-4 border border-slate-200 rounded-2xl cursor-pointer hover:border-emerald-300 transition">
                <div className="font-semibold">{d.clientName}</div>
                <div className="text-sm text-slate-500 mt-0.5">{d.serviceLevel || 'No tier'} · {daysBetween(d.submittedAt || d.createdAt, now)}d ago</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${STATUS_COLORS_HEX[d.status]}20`, color: STATUS_COLORS_HEX[d.status] }}>{d.status}</span>
                  {d.budget && <span className="text-xs text-slate-400">{d.budget}</span>}
                </div>
              </div>
            ))}
            {drillDown.items.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No deals</div>}
          </div>
        )}
        {drillDown.type === 'deal-detail' && drillDown.items[0] && (() => {
          const d = drillDown.items[0] as DealRecord;
          const dealCalls = callLogs.filter(c => c.dealId === d.id);
          const dealOffers = offers.filter(o => o.dealId === d.id);
          return (
            <div className="space-y-6">
              <div>
                <div className="text-xs text-slate-500 mb-1">Status</div>
                <span className="text-sm px-3 py-1 rounded-full font-medium" style={{ backgroundColor: `${STATUS_COLORS_HEX[d.status]}20`, color: STATUS_COLORS_HEX[d.status] }}>{d.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Days open</span><div className="font-semibold">{daysBetween(d.submittedAt || d.createdAt, now)}</div></div>
                <div><span className="text-slate-500">Time on file</span><div className="font-semibold">{formatTime(d.totalTimeMinutes || 0)}</div></div>
                <div><span className="text-slate-500">Calls logged</span><div className="font-semibold">{dealCalls.length}</div></div>
                <div><span className="text-slate-500">Offers</span><div className="font-semibold">{dealOffers.length}</div></div>
                <div><span className="text-slate-500">Service</span><div className="font-semibold">{d.serviceLevel || '—'}</div></div>
                <div><span className="text-slate-500">Budget</span><div className="font-semibold">{d.budget || '—'}</div></div>
              </div>
              <button onClick={() => router.push(`/negotiation/${d.id}`)} className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition text-sm">
                Open Full Deal File
              </button>
            </div>
          );
        })()}
      </DrillDownPanel>

      <Footer />
    </div>
  );
}
