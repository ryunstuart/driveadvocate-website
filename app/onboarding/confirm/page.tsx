'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function Confirm() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>({});
  const [vehicle, setVehicle] = useState<any>({});

  useEffect(() => {
    setProfile(JSON.parse(localStorage.getItem('profileData') || '{}'));
    setVehicle(JSON.parse(localStorage.getItem('vehicleFormData') || '{}'));
  }, []);

  const vehicleSummary = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`.trim();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="max-w-2xl mx-auto px-6 py-12 flex-1 w-full">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">✓</div>
            <span className="text-sm text-slate-400">Your Profile</span>
          </div>
          <div className="w-12 h-px bg-slate-300" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">✓</div>
            <span className="text-sm text-slate-400">Vehicle Build</span>
          </div>
          <div className="w-12 h-px bg-slate-300" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">3</div>
            <span className="text-sm font-semibold text-emerald-600">Confirm</span>
          </div>
        </div>

        {/* Success header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">You're in the queue!</h1>
          <p className="text-slate-500 text-lg">
            Your advocate will review your build and start reaching out to dealerships within 24 hours.
          </p>
        </div>

        {/* Summary card */}
        <div className="bg-white rounded-3xl shadow p-8 mb-6">
          <h2 className="text-lg font-semibold mb-6">Deal Summary</h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500">Client</span>
              <span className="font-semibold">{profile.firstName} {profile.lastName}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500">Vehicle</span>
              <span className="font-semibold text-right max-w-xs">{vehicleSummary || '—'}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500">Exterior</span>
              <span className="font-medium">{vehicle.exteriorColor1} · {vehicle.exteriorColor2} · {vehicle.exteriorColor3}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500">Interior</span>
              <span className="font-medium">{vehicle.interiorColor1} · {vehicle.interiorColor2} · {vehicle.interiorColor3}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500">Budget</span>
              <span className="font-medium">{profile.budget || '—'}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500">Timeline</span>
              <span className="font-medium">{profile.timeline || '—'}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500">Search Radius</span>
              <span className="font-medium">{profile.searchRadius || '25'} miles</span>
            </div>
            {vehicle.accessories?.length > 0 && (
              <div className="py-3">
                <span className="text-slate-500">Accessories</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {vehicle.accessories.map((acc: string) => (
                    <span key={acc} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{acc}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-white rounded-3xl shadow p-8 mb-8">
          <h2 className="text-lg font-semibold mb-5">What happens next</h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'File created', desc: 'Your advocate has your build on file and will review it shortly.', done: true },
              { step: '2', title: 'Dealership outreach', desc: 'We contact dealers within your radius to check availability and pricing.', done: false },
              { step: '3', title: 'You get an update', desc: 'We\'ll reach out with options, pricing, and our recommendation.', done: false },
              { step: '4', title: 'You approve the deal', desc: 'You make the final call — we handle the paperwork and coordination.', done: false },
            ].map(item => (
              <div key={item.step} className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${item.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {item.done ? '✓' : item.step}
                </div>
                <div>
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-4 border border-slate-300 rounded-2xl font-medium hover:bg-slate-50 transition"
          >
            Back to Home
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition"
          >
            View My Dashboard →
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
