'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Make { Make_ID: number; Make_Name: string; }
interface Model { Model_ID: number; Model_Name: string; }

const popularMakes = [
  'Toyota', 'Ford', 'Chevrolet', 'Honda', 'Nissan', 'Jeep', 'Ram', 'GMC',
  'BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Hyundai', 'Kia', 'Subaru',
  'Volkswagen', 'Mazda', 'Tesla', 'Dodge', 'Cadillac', 'Porsche', 'Volvo',
  'Buick', 'Lincoln', 'Acura', 'Infiniti', 'Genesis', 'Rivian', 'Lucid'
];

const commonTrims = [
  'Base', 'LE', 'XLE', 'Limited', 'TRD Off-Road', 'TRD Pro', 'Platinum',
  'Lariat', 'King Ranch', 'Raptor', 'SRT', 'GT', 'Premier', 'RS', 'Sport',
  'EX', 'LX', 'SEL', 'SE', 'Titanium', 'Prestige'
];

const exteriorColors = [
  { name: 'White', hex: '#f8f9fa' }, { name: 'Black', hex: '#1f2527' },
  { name: 'Silver', hex: '#c0c0c0' }, { name: 'Gray', hex: '#808080' },
  { name: 'Blue', hex: '#1e40af' }, { name: 'Red', hex: '#b91c1c' },
  { name: 'Green', hex: '#166534' }, { name: 'Brown', hex: '#78350f' },
  { name: 'Midnight Black', hex: '#0a0a0a' }, { name: 'Pearl White', hex: '#f4f4f5' },
];

const interiorColors = [
  { name: 'Black', hex: '#1f2527' }, { name: 'Gray', hex: '#4b5563' },
  { name: 'Beige', hex: '#d2b48c' }, { name: 'Brown', hex: '#5c4033' },
  { name: 'Tan', hex: '#c5a880' }, { name: 'Red', hex: '#991b1b' },
  { name: 'White', hex: '#f8f9fa' }, { name: 'Two-Tone', hex: '#64748b' },
];

const availableAccessories = [
  'Towing Package', 'Sunroof / Moonroof', 'Leather Seats', 'Adaptive Cruise Control',
  'Bed Liner', 'Running Boards', 'Premium Audio', 'Remote Start', 'Heated Seats',
  'Blind Spot Monitoring', '360 Camera', 'Trailer Backup Assist', 'Power Tailgate'
];

export default function VehicleWizard() {
  const router = useRouter();
  const currentYear = 2026;

  const [formData, setFormData] = useState({
    year: currentYear.toString(),
    make: '', model: '', trim: '',
    exteriorColor1: 'White', exteriorColor2: 'Black', exteriorColor3: 'Silver',
    interiorColor1: 'Black', interiorColor2: 'Gray', interiorColor3: 'Beige',
    accessories: [] as string[],
  });

  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [makesError, setMakesError] = useState(false);
  const [modelsError, setModelsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    const profile = JSON.parse(localStorage.getItem('profileData') || '{}');
    if (profile.firstName) setClientName(profile.firstName);

    const saved = localStorage.getItem('vehicleFormData');
    if (saved) {
      const parsed = JSON.parse(saved);
      setFormData({ ...parsed, accessories: parsed.accessories || [] });
    }
  }, []);

  useEffect(() => {
    fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json')
      .then(res => res.json())
      .then(data => {
        const allMakes: Make[] = data.Results || [];
        const prioritized = popularMakes
          .map(name => allMakes.find(m => m.Make_Name.toLowerCase() === name.toLowerCase()))
          .filter(Boolean) as Make[];
        setMakes(prioritized);
        setLoadingMakes(false);
      })
      .catch(() => { setLoadingMakes(false); setMakesError(true); });
  }, []);

  useEffect(() => {
    if (!formData.make || !formData.year) return;
    const makeObj = makes.find(m => m.Make_Name === formData.make);
    if (!makeObj) return;
    setLoadingModels(true);
    fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeIdYear/makeId/${makeObj.Make_ID}/modelyear/${formData.year}?format=json`)
      .then(res => res.json())
      .then(data => {
        const modelList: Model[] = data.Results || [];
        const unique = Array.from(new Map(modelList.map(i => [i.Model_Name, i])).values())
          .sort((a, b) => a.Model_Name.localeCompare(b.Model_Name));
        setModels(unique);
        setLoadingModels(false);
      })
      .catch(() => { setLoadingModels(false); setModelsError(true); });
  }, [formData.make, formData.year, makes]);

  const updateForm = (key: string, value: any) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    localStorage.setItem('vehicleFormData', JSON.stringify(updated));
  };

  const toggleAccessory = (acc: string) => {
    const current = formData.accessories || [];
    updateForm('accessories', current.includes(acc) ? current.filter(a => a !== acc) : [...current, acc]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.make || !formData.model) return;
    setIsSubmitting(true);

    localStorage.setItem('vehicleFormData', JSON.stringify(formData));

    // Create a new deal entry
    const profile = JSON.parse(localStorage.getItem('profileData') || '{}');
    const newDeal = {
      id: `deal-${Date.now()}`,
      clientName: `${profile.firstName} ${profile.lastName}`.trim() || 'New Client',
      vehicle: `${formData.year} ${formData.make} ${formData.model} ${formData.trim}`.trim(),
      vehicleDetails: `${formData.exteriorColor1} Ext • ${formData.interiorColor1} Int`,
      submitted: new Date().toISOString().split('T')[0],
      status: 'New',
      budget: profile.budget || '',
      timeline: profile.timeline || '',
      radius: profile.searchRadius || '25',
    };

    // Save to pending deals in localStorage (advocate will see it in queue)
    const pendingDeals = JSON.parse(localStorage.getItem('pendingDeals') || '[]');
    pendingDeals.push(newDeal);
    localStorage.setItem('pendingDeals', JSON.stringify(pendingDeals));

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    currentUser.hasActiveDeal = true;
    currentUser.activeDealId = newDeal.id;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    setTimeout(() => router.push('/onboarding/confirm'), 600);
  };

  const selectedVehicle = `${formData.year} ${formData.make} ${formData.model} ${formData.trim}`.trim();

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-6">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">✓</div>
            <span className="text-sm text-slate-400">Your Profile</span>
          </div>
          <div className="w-12 h-px bg-slate-300" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">2</div>
            <span className="text-sm font-semibold text-emerald-600">Vehicle Build</span>
          </div>
          <div className="w-12 h-px bg-slate-300" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold">3</div>
            <span className="text-sm text-slate-400">Confirm</span>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">
            {clientName ? `${clientName}, build your perfect vehicle` : 'Build Your Perfect Vehicle'}
          </h1>
          <p className="text-slate-500">New vehicles only · Select your preferences below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">

              {/* Vehicle Config */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-lg font-semibold mb-6">Vehicle Configuration</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Year</label>
                    <select value={formData.year} onChange={e => updateForm('year', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500">
                      <option value={currentYear}>{currentYear}</option>
                      <option value={currentYear - 1}>{currentYear - 1}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Make</label>
                    <select value={formData.make} onChange={e => updateForm('make', e.target.value)} disabled={loadingMakes} className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 disabled:opacity-50">
                      <option value="">{loadingMakes ? 'Loading makes...' : makesError ? 'Failed to load — type make below' : 'Select Make'}</option>
                      {makes.map(m => <option key={m.Make_ID} value={m.Make_Name}>{m.Make_Name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Model</label>
                    <select value={formData.model} onChange={e => updateForm('model', e.target.value)} disabled={loadingModels || !formData.make} className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 disabled:opacity-50">
                      <option value="">{loadingModels ? 'Loading models...' : modelsError ? 'Failed to load — type model below' : 'Select Model'}</option>
                      {models.map(m => <option key={m.Model_ID} value={m.Model_Name}>{m.Model_Name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Trim</label>
                    <select value={formData.trim} onChange={e => updateForm('trim', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500">
                      <option value="">Select Trim</option>
                      {commonTrims.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Exterior Colors */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-lg font-semibold mb-6">Exterior Color Preferences</h2>
                <div className="space-y-6">
                  {[1, 2, 3].map(rank => (
                    <div key={rank}>
                      <label className="block text-sm font-medium text-slate-600 mb-3">
                        {rank === 1 ? '1st Choice (Most Preferred)' : rank === 2 ? '2nd Choice' : '3rd Choice'}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {exteriorColors.map(color => (
                          <button key={color.name} type="button" onClick={() => updateForm(`exteriorColor${rank}`, color.name)}
                            className={`w-11 h-11 rounded-2xl border-4 transition-all hover:scale-110 shadow-sm ${(formData as any)[`exteriorColor${rank}`] === color.name ? 'border-emerald-500 scale-110' : 'border-white'}`}
                            style={{ backgroundColor: color.hex }} title={color.name}
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-600">{(formData as any)[`exteriorColor${rank}`]}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interior Colors */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-lg font-semibold mb-6">Interior Color Preferences</h2>
                <div className="space-y-6">
                  {[1, 2, 3].map(rank => (
                    <div key={rank}>
                      <label className="block text-sm font-medium text-slate-600 mb-3">
                        {rank === 1 ? '1st Choice (Most Preferred)' : rank === 2 ? '2nd Choice' : '3rd Choice'}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {interiorColors.map(color => (
                          <button key={color.name} type="button" onClick={() => updateForm(`interiorColor${rank}`, color.name)}
                            className={`w-11 h-11 rounded-2xl border-4 transition-all hover:scale-110 shadow-sm ${(formData as any)[`interiorColor${rank}`] === color.name ? 'border-emerald-500 scale-110' : 'border-white'}`}
                            style={{ backgroundColor: color.hex }} title={color.name}
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-600">{(formData as any)[`interiorColor${rank}`]}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accessories */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-lg font-semibold mb-6">Desired Accessories</h2>
                <div className="grid grid-cols-2 gap-3">
                  {availableAccessories.map(acc => (
                    <button key={acc} type="button" onClick={() => toggleAccessory(acc)}
                      className={`p-4 text-left border rounded-2xl text-sm transition-all ${
                        formData.accessories.includes(acc)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {formData.accessories.includes(acc) ? '✓ ' : ''}{acc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview Sidebar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow p-8 sticky top-8">
                <h2 className="text-lg font-semibold mb-6">Your Build</h2>

                <div className="space-y-4 text-sm mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <div className="text-xs text-slate-500 mb-1">Vehicle</div>
                    <div className="font-semibold">{selectedVehicle || 'Select make & model above'}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <div className="text-xs text-slate-500 mb-1">Exterior</div>
                    <div className="flex gap-2 mt-1">
                      {[formData.exteriorColor1, formData.exteriorColor2, formData.exteriorColor3].map((c, i) => (
                        <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-lg">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <div className="text-xs text-slate-500 mb-1">Interior</div>
                    <div className="flex gap-2 mt-1">
                      {[formData.interiorColor1, formData.interiorColor2, formData.interiorColor3].map((c, i) => (
                        <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-lg">{c}</span>
                      ))}
                    </div>
                  </div>
                  {formData.accessories.length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <div className="text-xs text-slate-500 mb-2">Accessories ({formData.accessories.length})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.accessories.map(acc => (
                          <span key={acc} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">{acc}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !formData.make || !formData.model}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold transition"
                >
                  {isSubmitting ? 'Saving...' : 'Submit Build →'}
                </button>
                {(!formData.make || !formData.model) && (
                  <p className="text-xs text-center text-slate-400 mt-3">Select a make and model to continue</p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
