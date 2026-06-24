'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VehicleWizard() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    vehicleType: 'Truck',
    preferredYear: '2025',
    maxBudget: '65000',
    make: 'Toyota',
    model: 'Tundra',
  });

  // Check if user has existing data
  const [hasExistingData, setHasExistingData] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('vehicleFormData');
    if (saved) {
      setFormData(JSON.parse(saved));
      setHasExistingData(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    localStorage.setItem('vehicleFormData', JSON.stringify(updated));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('vehicleFormData', JSON.stringify(formData));
    
    // Mark that user has started the deal flow
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    currentUser.hasActiveDeal = true;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">What vehicle are you looking for?</h1>
          <p className="text-slate-600">We'll use this to find the best deals for you</p>
        </div>

        {hasExistingData && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <p className="text-emerald-700 font-medium">We found your previous selections</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-10">
          {/* Vehicle Type */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-600 mb-3">Vehicle Type</label>
            <div className="grid grid-cols-3 gap-3">
              {['Sedan', 'SUV', 'Truck', 'Electric', 'Luxury', 'Sports'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    const updated = { ...formData, vehicleType: type };
                    setFormData(updated);
                    localStorage.setItem('vehicleFormData', JSON.stringify(updated));
                  }}
                  className={`py-4 rounded-2xl border transition-all ${
                    formData.vehicleType === type 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Preferred Year</label>
              <input
                type="text"
                name="preferredYear"
                value={formData.preferredYear}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Max Budget</label>
              <input
                type="text"
                name="maxBudget"
                value={formData.maxBudget}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-10">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Make</label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Model</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-lg font-semibold transition"
          >
            {hasExistingData ? 'Continue with My Selections →' : 'Find My Deals →'}
          </button>
        </form>
      </div>
    </div>
  );
}