'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    phone: '',
    zipCode: '63301',
  });

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.hasCompletedOnboarding) {
      router.push('/dashboard');
    }
  }, [router]);

  const updateField = (field: string, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    localStorage.setItem('onboardingData', JSON.stringify(updated));
  };

  const handleContinue = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    currentUser.firstName = formData.firstName;
    currentUser.zipCode = formData.zipCode;
    currentUser.hasCompletedOnboarding = true;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    router.push('/onboarding/vehicle');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-[#f4f4f4] border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="DriveAdvocate" className="h-9" />
            <div className="font-bold text-xl">DriveAdvocate</div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold">Build Your Profile</h1>
          <p className="text-slate-600 mt-3">Tell us a bit about yourself</p>
        </div>

        <div className="bg-white rounded-3xl p-10 shadow">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <input type="text" value={formData.firstName} onChange={(e) => updateField('firstName', e.target.value)} placeholder="Ryun" className="w-full p-4 border border-slate-300 rounded-2xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="(636) 387-3228" className="w-full p-4 border border-slate-300 rounded-2xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ZIP Code</label>
              <input type="text" value={formData.zipCode} onChange={(e) => updateField('zipCode', e.target.value)} className="w-full p-4 border border-slate-300 rounded-2xl" />
            </div>
          </div>

          <button 
            onClick={handleContinue}
            disabled={!formData.firstName.trim()}
            className="w-full mt-10 bg-emerald-600 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold"
          >
            Continue to Vehicle Preferences →
          </button>
        </div>
      </div>
    </div>
  );
}