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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data - ready for real database population
  const years = ['2026', '2025', '2024', '2023', '2022', '2021'];
  const makes = ['Toyota', 'Ford', 'Chevrolet', 'Ram', 'GMC', 'Honda', 'Nissan'];
  
  const models: Record<string, string[]> = {
    'Toyota': ['Tundra', 'Tacoma', '4Runner', 'Camry', 'RAV4', 'Highlander'],
    'Ford': ['F-150', 'Super Duty', 'Explorer', 'Maverick'],
    'Chevrolet': ['Silverado', 'Tahoe', 'Colorado', 'Traverse'],
    'Ram': ['1500', '2500', '3500'],
    'GMC': ['Sierra', 'Yukon'],
  };

  const trims: Record<string, string[]> = {
    'Tundra': ['SR', 'SR5', 'Limited', 'Limited TRD', 'Platinum', '1794 Edition'],
    'Tacoma': ['SR', 'TRD Sport', 'TRD Off-Road', 'Limited'],
    'F-150': ['XL', 'XLT', 'Lariat', 'King Ranch', 'Platinum'],
  };

  const availableAccessories = [
    'Towing Package', 'Sunroof / Moonroof', 'Leather Seats', 'Adaptive Cruise Control',
    'Bed Liner', 'Running Boards', 'Premium Audio', 'Remote Start',
    'All-Weather Floor Mats', 'Power Deployable Running Boards', 'Heated Seats',
    'Blind Spot Monitoring', '360 Camera', 'Trailer Backup Assist'
  ];

  // Mock image mapping (will be replaced by real DB URLs)
  const getVehicleImage = () => {
    const key = `${formData.make}-${formData.model}`.toLowerCase();
    const images: Record<string, string> = {
      'toyota-tundra': 'https://picsum.photos/id/1015/800/450',
      'toyota-tacoma': 'https://picsum.photos/id/1074/800/450',
      'ford-f-150': 'https://picsum.photos/id/201/800/450',
      'chevrolet-silverado': 'https://picsum.photos/id/133/800/450',
    };
    return images[key] || 'https://picsum.photos/id/1075/800/450';
  };

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
    const updatedAccessories = current.includes(accessory)
      ? current.filter(a => a !== accessory)
      : [...current, accessory];

    updateForm('accessories', updatedAccessories);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    localStorage.setItem('vehicleFormData', JSON.stringify(formData));

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    currentUser.hasActiveDeal = true;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Small delay for better UX
    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  const selectedVehicle = `${formData.year} ${formData.make} ${formData.model} ${formData.trim}`;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Build Your Perfect Vehicle</h1>
          <p className="text-slate-600 max-w-md mx-auto">We'll negotiate the best price on this exact build</p>
        </div>

        {hasExistingData && (
          <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <p className="text-emerald-700 font-medium">Loaded your previous selections</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left Column - Selections */}
            <div className="lg:col-span-3 space-y-8">
              {/* Vehicle Selection */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-xl font-semibold mb-6">Vehicle Configuration</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Year & Make */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-3">Year</label>
                      <div className="grid grid-cols-3 gap-2">
                        {years.map((y) => (
                          <button key={y} type="button" onClick={() => updateForm('year', y)}
                            className={`py-3 rounded-2xl border text-center transition-all ${formData.year === y ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-medium' : 'border-slate-200 hover:border-slate-300'}`}>
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-3">Make</label>
                      <select value={formData.make} onChange={(e) => {
                        updateForm('make', e.target.value);
                        updateForm('model', models[e.target.value]?.[0] || '');
                      }}
                        className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600">
                        {makes.map(make => <option key={make} value={make}>{make}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Model & Trim */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-3">Model</label>
                      <select value={formData.model} onChange={(e) => updateForm('model', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600">
                        {(models[formData.make] || []).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-3">Trim</label>
                      <select value={formData.trim} onChange={(e) => updateForm('trim', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600">
                        {(trims[formData.model] || ['Base']).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accessories */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-xl font-semibold mb-6">Desired Options & Accessories</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableAccessories.map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => toggleAccessory(acc)}
                      className={`p-4 text-left border rounded-2xl transition-all text-sm ${
                        (formData.accessories || []).includes(acc)
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow p-8 sticky top-8">
                <h2 className="text-xl font-semibold mb-6">Your Build Preview</h2>
                
                <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden mb-6">
                  <img 
                    src={getVehicleImage()} 
                    alt={selectedVehicle}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div className="text-2xl font-bold">{selectedVehicle}</div>
                  
                  {formData.accessories.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-500 mb-2">Selected Accessories ({formData.accessories.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.accessories.map(acc => (
                          <span key={acc} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                            {acc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-10 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white py-4 rounded-2xl text-lg font-semibold transition flex items-center justify-center gap-3"
                >
                  {isSubmitting ? 'Saving Build...' : 'Start Negotiating This Build →'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}