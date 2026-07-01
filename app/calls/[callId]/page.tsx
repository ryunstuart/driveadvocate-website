'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { dataClient } from '@/app/lib/amplify-data';
import { parseAppSyncResult } from '@/app/lib/parse-result';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import FinancialWizard, { FinancialProfileData } from '@/app/components/FinancialWizard';
import VehicleWizardModal from '@/app/components/VehicleWizardModal';

export default function PreCallPrep() {
  const router = useRouter();
  const { callId } = useParams();
  const [call, setCall] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showCallWorkflow, setShowCallWorkflow] = useState(false);
  const [financialComplete, setFinancialComplete] = useState(false);
  const [vehicleComplete, setVehicleComplete] = useState(false);
  const [showFinancialWizard, setShowFinancialWizard] = useState(false);
  const [showVehicleWizard, setShowVehicleWizard] = useState(false);
  const [financialProfile, setFinancialProfile] = useState<FinancialProfileData | null>(null);
  const [vehiclePrefs, setVehiclePrefs] = useState<any>(null);
  const [enrollmentSent, setEnrollmentSent] = useState(false);


  useEffect(() => { getCurrentUser().catch(() => router.push('/login')); }, [router]);

  useEffect(() => {
    (async () => {
      try {
        const result = await dataClient.queries.getCallById({ callId: callId as string });
        const data = result.data || null;
        if (data && data.clientEmail && (!data.clientPhone || !data.clientZip)) {
          try {
            const clientResult = await dataClient.models.Client.list({ filter: { email: { eq: data.clientEmail } } });
            const client = clientResult.data?.[0];
            if (client?.phone && !data.clientPhone) data.clientPhone = client.phone;
            if (client?.zipCode && !data.clientZip) data.clientZip = client.zipCode;
          } catch {}
        }
        setCall(data);
        setNotes(data?.notes || '');
      } catch {}
      setLoading(false);
    })();
  }, [callId]);

  const updateStatus = async (status: string) => {
    await dataClient.mutations.updateCall({ callId: callId as string, status });
    setCall((p: any) => ({ ...p, status }));
  };

  const saveNotes = async () => {
    setSaving(true);
    await dataClient.mutations.updateCall({ callId: callId as string, notes });
    setSaving(false);
  };

  const handleInProgress = async () => {
    await updateStatus('in_progress');
    setShowCallWorkflow(true);
  };

  const handleSendEnrollment = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const { data: deal } = await dataClient.models.Deal.create({
        clientId: call.clientEmail,
        clientName: call.clientName,
        clientEmail: call.clientEmail,
        status: 'Pending',
        financialProfile: financialProfile ? JSON.stringify(financialProfile) : undefined,
        callId: callId as string,
        submittedAt: new Date().toISOString(),
        totalTimeMinutes: 0,
      });

      if (deal && vehiclePrefs) {
        await dataClient.models.VehiclePreference.create({
          dealId: deal.id,
          make: vehiclePrefs.make, model: vehiclePrefs.model,
          year: vehiclePrefs.year, trim: vehiclePrefs.trim,
          condition: vehiclePrefs.condition,
          zipCode: call.clientZip || '',
          searchRadius: 100,
          colorCombos: vehiclePrefs.colorCombos?.map((c: any) => `${c.exterior}/${c.interior}`).filter(Boolean) ?? [],
          exteriorColors: vehiclePrefs.exteriorColors ?? [],
          interiorColors: vehiclePrefs.interiorColors ?? [],
        });
      }

      if (deal) {
        await dataClient.mutations.sendEnrollmentLink({
          callId: callId as string,
          dealId: deal.id,
        });
      }

      await updateStatus('completed');
      setShowCallWorkflow(false);
      setEnrollmentSent(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err) {
      console.error('Enrollment failed:', err);
    }
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

        {enrollmentSent && (
          <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-xl z-50 flex items-center gap-3">
            <span className="text-xl">✓</span>
            <div><div className="font-semibold">Enrollment link sent!</div><div className="text-sm opacity-90">Returning to dashboard...</div></div>
          </div>
        )}

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
                {call.status === 'scheduled' ? (
                  <button onClick={handleInProgress} className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition">
                    Start Call → In Progress
                  </button>
                ) : (
                  ['in_progress', 'completed', 'no_show'].map(s => (
                    <button key={s} onClick={() => updateStatus(s)} className={`w-full py-2 px-4 rounded-xl text-sm font-medium transition ${call.status === s ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {s.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </button>
                  ))
                )}
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
                <button onClick={() => setShowCallWorkflow(true)} className="p-4 border-2 border-emerald-500 bg-emerald-50 rounded-2xl text-left transition hover:bg-emerald-100">
                  <div className="text-2xl mb-1">📋</div><div className="font-semibold text-sm text-emerald-700">Call Workflow</div><div className="text-xs text-slate-500">Financial + Vehicle wizards</div>
                </button>
                <button onClick={() => updateStatus('no_show')} className="p-4 border-2 border-slate-200 hover:border-red-300 rounded-2xl text-left transition">
                  <div className="text-2xl mb-1">✗</div><div className="font-semibold text-sm">No Show</div><div className="text-xs text-slate-500">Client didn't show</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call Workflow Modal */}
      {showCallWorkflow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-slate-500 mb-1">Call workflow</div>
                <h2 className="text-xl font-bold">{call.clientName}</h2>
              </div>
              {call.status === 'in_progress' && (
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" /><span className="text-sm text-emerald-600 font-medium">Live</span></div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className={`p-4 rounded-2xl border-2 transition ${financialComplete ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${financialComplete ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{financialComplete ? '✓' : '1'}</div>
                    <div><div className="font-semibold text-sm">Financial Analysis</div><div className="text-xs text-slate-500">Credit, budget, buy vs lease</div></div>
                  </div>
                  {!financialComplete && <button onClick={() => setShowFinancialWizard(true)} className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-emerald-700 transition">Start →</button>}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border-2 transition ${vehicleComplete ? 'border-emerald-500 bg-emerald-50' : financialComplete ? 'border-slate-200' : 'border-slate-100 opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${vehicleComplete ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{vehicleComplete ? '✓' : '2'}</div>
                    <div><div className="font-semibold text-sm">Vehicle Preferences</div><div className="text-xs text-slate-500">Make, model, trim, condition</div></div>
                  </div>
                  {financialComplete && !vehicleComplete && <button onClick={() => setShowVehicleWizard(true)} className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-emerald-700 transition">Start →</button>}
                </div>
              </div>
            </div>

            {financialComplete && vehicleComplete ? (
              <button onClick={handleSendEnrollment} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold transition">
                Send Enrollment Link → Complete Call
              </button>
            ) : (
              <button onClick={() => setShowCallWorkflow(false)} className="w-full py-3 text-slate-500 hover:text-slate-700 text-sm transition">
                Skip — Complete Later
              </button>
            )}
          </div>
        </div>
      )}

      {/* Financial Wizard */}
      {showFinancialWizard && (
        <FinancialWizard
          clientName={call.clientName}
          vehiclePrice={45000}
          onSave={(profile) => { setFinancialProfile(profile); setFinancialComplete(true); setShowFinancialWizard(false); }}
          onClose={() => setShowFinancialWizard(false)}
        />
      )}

      {/* Vehicle Wizard Modal */}
      {showVehicleWizard && (
        <VehicleWizardModal
          clientZip={call.clientZip}
          onComplete={(prefs) => { setVehiclePrefs(prefs); setVehicleComplete(true); setShowVehicleWizard(false); }}
          onClose={() => setShowVehicleWizard(false)}
        />
      )}

      <Footer />
    </div>
  );
}
