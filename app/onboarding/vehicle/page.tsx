'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VehicleWizard() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    year: '2025',
    make: 'Toyota',
    model: 'Tundra',
    trim: 'Limited TRD',
    accessories: [] as string[],
  });

  const [hasExistingData, setHasExistingData] = useState(false);

  // Mock data - will be replaced by database later
  const years = ['2026', '2025', '2024', '2023', '2022'];
  const makes = ['Toyota', 'Ford', 'Chevrolet', 'Ram', 'GMC', 'Honda'];
  const models: Record<string, string[]> = {
    'Toyota': ['Tundra', 'Tacoma', '4Runner', 'Camry', 'RAV4'],
    'Ford': ['F-150', 'Super Duty', 'Explorer'],
    'Chevrolet': ['Silverado', 'Tahoe', 'Colorado'],
    'Ram': ['1500', '2500'],
  };
  const trims: Record<string, string[]> = {
    'Tundra': ['SR', 'SR5', 'Limited', 'Limited TRD', 'Platinum', '1794 Edition'],
    'Tacoma': ['SR', 'TRD Sport', 'TRD Off-Road', 'Limited'],
  };

  const availableAccessories = [
    'Towing Package',
    'Sunroof / Moonroof',
    'Leather Seats',
    'Adaptive Cruise Control',
    'Bed Liner',
    'Running Boards',
    'Premium Audio',
    'Remote Start',
    'All-Weather Floor Mats',
    'Power Deployable Running Boards'
  ];

  useEffect(() => {
    const saved = localStorage.getItem('vehicleFormData');
    if (saved) {
      const parsed = JSON.parse(saved);
      setFormData({
        ...parsed,
        accessories: parsed.accessories || []
      });
      setHasExistingData(true);
    }
  }, []);

  const updateForm = (key: string, value: any) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    localStorage.setItem('vehicleFormData', JSON.stringify(updated));
  };

  const toggleAccessory = (accessory: string) => {
    const current = formData.accessories || [];
    let updatedAccessories: string[];

    if (current.includes(accessory)) {
      updatedAccessories = current.filter(a => a !== accessory);
    } else {
      updatedAccessories = [...current, accessory];
    }

    updateForm('accessories', updatedAccessories);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('vehicleFormData', JSON.stringify(formData));

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    currentUser.hasActiveDeal = true;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Build Your Perfect Vehicle</h1>
          <p className="text-slate-600">Select the exact configuration we're negotiating for</p>
        </div>

        {hasExistingData && (
          <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <p className="text-emerald-700 font-medium">Loading your previous selections...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-10 space-y-10">
          {/* Year, Make, Model, Trim Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-3">Year</label>
              <div className="grid grid-cols-3 gap-2">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => updateForm('year', y)}
                    className={`py-3 rounded-2xl border text-center transition-all ${
                      formData.year === y ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-medium' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Make */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-3">Make</label>
              <select
                value={formData.make}
                onChange={(e) => {
                  updateForm('make', e.target.value);
                  updateForm('model', models[e.target.value]?.[0] || '');
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600"
              >
                {makes.map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-3">Model</label>
              <select
                value={formData.model}
                onChange={(e) => updateForm('model', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600"
              >
                {(models[formData.make] || []).map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            {/* Trim */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-3">Trim</label>
              <select
                value={formData.trim}
                onChange={(e) => updateForm('trim', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600"
              >
                {(trims[formData.model] || ['Base']).map(trim => (
                  <option key={trim} value={trim}>{trim}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Accessories */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-4">Desired Accessories / Options</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableAccessories.map((acc) => (
                <button
                  key={acc}
                  type="button"
                  onClick={() => toggleAccessory(acc)}
                  className={`p-4 text-left border rounded-2xl transition-all text-sm ${
                    (formData.accessories || []).includes(acc)
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-lg font-semibold transition"
          >
            Start Negotiating This Build →
          </button>
        </form>
      </div>
    </div>
  );
}