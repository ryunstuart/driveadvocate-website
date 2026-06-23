'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VehicleOnboarding() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    vehicleType: '',
    year: '',
    make: '',
    model: '',
    budget: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('onboardingData');
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  const updateField = (field: string, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    localStorage.setItem('onboardingData', JSON.stringify(updated));
  };

  const handleComplete = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    currentUser.hasCompletedOnboarding = true;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    router.push('/dashboard');
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
          <h1 className="text-4xl font-bold">What vehicle are you looking for?</h1>
          <p className="text-slate-600 mt-3">We'll use this to find the best deals for you</p>
        </div>

        <div className="bg-white rounded-3xl p-10 shadow">
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium mb-4">Vehicle Type</label>
              <div className="grid grid-cols-3 gap-3">
                {['Sedan', 'SUV', 'Truck', 'Electric', 'Luxury', 'Sports'].map((type) => (
                  <button
                    key={type}
                    onClick={() => updateField('vehicleType', type)}
                    className={`p-4 rounded-2xl border-2 transition-all ${formData.vehicleType === type ? 'border-emerald-600 bg-emerald-50 font-medium' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Year</label>
                <input 
                  type="text" 
                  placeholder="2025" 
                  value={formData.year} 
                  onChange={(e) => updateField('year', e.target.value)}
                  className="w-full p-4 border rounded-2xl" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Budget</label>
                <input 
                  type="text" 
                  placeholder="$45,000" 
                  value={formData.budget} 
                  onChange={(e) => updateField('budget', e.target.value)}
                  className="w-full p-4 border rounded-2xl" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Make</label>
                <input 
                  type="text" 
                  placeholder="Toyota" 
                  value={formData.make} 
                  onChange={(e) => updateField('make', e.target.value)}
                  className="w-full p-4 border rounded-2xl" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <input 
                  type="text" 
                  placeholder="Camry" 
                  value={formData.model} 
                  onChange={(e) => updateField('model', e.target.value)}
                  className="w-full p-4 border rounded-2xl" 
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleComplete}
            className="w-full mt-10 bg-emerald-600 text-white py-4 rounded-2xl font-semibold text-lg"
          >
            Find My Deals →
          </button>
        </div>
      </div>
    </div>
  );
}