'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface Make {
  Make_ID: number;
  Make_Name: string;
}

interface Model {
  Model_ID: number;
  Model_Name: string;
}

export default function VehicleWizard() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    year: '2025',
    make: '',
    model: '',
    trim: '',
    exteriorColor1: 'White',
    exteriorColor2: 'Black',
    exteriorColor3: 'Silver',
    interiorColor1: 'Black',
    interiorColor2: 'Gray',
    interiorColor3: 'Beige',
    accessories: [] as string[],
  });

  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [makeSearch, setMakeSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');

  const [hasExistingData, setHasExistingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const exteriorColors = ['White', 'Black', 'Silver', 'Gray', 'Blue', 'Red', 'Green', 'Brown', 'Midnight Black', 'Pearl White'];
  const interiorColors = ['Black', 'Gray', 'Beige', 'Brown', 'Tan', 'Red', 'White', 'Two-Tone'];

  const availableAccessories = [
    'Towing Package', 'Sunroof / Moonroof', 'Leather Seats', 'Adaptive Cruise Control',
    'Bed Liner', 'Running Boards', 'Premium Audio', 'Remote Start', 'Heated Seats',
    'Blind Spot Monitoring', '360 Camera', 'Trailer Backup Assist', 'Power Tailgate'
  ];

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

  // Load Makes - Limited to 60
  useEffect(() => {
    fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json')
      .then(res => res.json())
      .then(data => {
        const results: Make[] = data.Results || [];
        const sortedMakes = results
          .sort((a, b) => a.Make_Name.localeCompare(b.Make_Name))
          .slice(0, 60);
        setMakes(sortedMakes);
        setLoadingMakes(false);
      })
      .catch(() => setLoadingMakes(false));
  }, []);

  // Load Models
  useEffect(() => {
    if (!formData.make || !formData.year) return;

    const makeObj = makes.find(m => m.Make_Name === formData.make);
    if (!makeObj) return;

    setLoadingModels(true);
    fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeIdYear/makeId/${makeObj.Make_ID}/modelyear/${formData.year}?format=json`)
      .then(res => res.json())
      .then(data => {
        let modelList: Model[] = data.Results || [];
        const uniqueModels = Array.from(
          new Map(modelList.map(item => [item.Model_Name, item])).values()
        ).sort((a, b) => a.Model_Name.localeCompare(b.Model_Name));

        setModels(uniqueModels);
        if (uniqueModels.length > 0 && !formData.model) {
          updateForm('model', uniqueModels[0].Model_Name);
        }
        setLoadingModels(false);
      })
      .catch(() => setLoadingModels(false));
  }, [formData.make, formData.year, makes]);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('vehicleFormData');
    if (saved) {
      const parsed = JSON.parse(saved);
      setFormData({ ...parsed, accessories: parsed.accessories || [] });
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

  const filteredMakes = useMemo(() => 
    makes.filter(m => m.Make_Name.toLowerCase().includes(makeSearch.toLowerCase())), 
    [makes, makeSearch]
  );

  const filteredModels = useMemo(() => 
    models.filter(m => m.Model_Name.toLowerCase().includes(modelSearch.toLowerCase())), 
    [models, modelSearch]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    localStorage.setItem('vehicleFormData', JSON.stringify(formData));

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    currentUser.hasActiveDeal = true;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    setTimeout(() => router.push('/dashboard'), 600);
  };

  const selectedVehicle = `${formData.year} ${formData.make} ${formData.model} ${formData.trim}`.trim();

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Build Your Perfect Vehicle</h1>
          <p className="text-slate-600">Real NHTSA data • Clean interface</p>
        </div>

        {hasExistingData && (
          <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <p className="text-emerald-700 font-medium">Loaded your previous selections</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-8">
              {/* Vehicle Configuration */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-xl font-semibold mb-6">Vehicle Configuration</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-3">Year</label>
                    <select value={formData.year} onChange={(e) => updateForm('year', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-2xl">
                      {Array.from({ length: 15 }, (_, i) => 2026 - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-3">Make</label>
                    <input 
                      type="text" 
                      placeholder="Search makes..." 
                      value={makeSearch}
                      onChange={(e) => setMakeSearch(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl mb-2 text-sm"
                    />
                    <select 
                      value={formData.make} 
                      onChange={(e) => { updateForm('make', e.target.value); setMakeSearch(''); }}
                      className="w-full px-4 py-3 border border-slate-300 rounded-2xl" 
                      disabled={loadingMakes}
                    >
                      <option value="">Select Make</option>
                      {filteredMakes.map(make => (
                        <option key={make.Make_ID} value={make.Make_Name}>{make.Make_Name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-3">Model</label>
                    <input 
                      type="text" 
                      placeholder="Search models..." 
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl mb-2 text-sm"
                    />
                    <select 
                      value={formData.model} 
                      onChange={(e) => { updateForm('model', e.target.value); setModelSearch(''); }}
                      disabled={loadingModels || !formData.make} 
                      className="w-full px-4 py-3 border border-slate-300 rounded-2xl"
                    >
                      <option value="">Select Model</option>
                      {filteredModels.map(model => (
                        <option key={model.Model_ID} value={model.Model_Name}>{model.Model_Name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-3">Trim / Package</label>
                    <input 
                      type="text" 
                      value={formData.trim} 
                      onChange={(e) => updateForm('trim', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-2xl" 
                      placeholder="Limited TRD, Lariat, etc." 
                    />
                  </div>
                </div>
              </div>

              {/* Exterior Colors */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-xl font-semibold mb-6">Exterior Color Preferences</h2>
                <div className="space-y-6">
                  {[1,2,3].map(rank => (
                    <div key={rank}>
                      <label className="block text-sm font-medium text-slate-600 mb-3">
                        {rank}st Choice {rank === 1 && '(Most Preferred)'}
                      </label>
                      <select 
                        value={(formData as any)[`exteriorColor${rank}`]}
                        onChange={(e) => updateForm(`exteriorColor${rank}`, e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-2xl"
                      >
                        {exteriorColors.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interior Colors */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-xl font-semibold mb-6">Interior Color Preferences</h2>
                <div className="space-y-6">
                  {[1,2,3].map(rank => (
                    <div key={rank}>
                      <label className="block text-sm font-medium text-slate-600 mb-3">
                        {rank}st Choice {rank === 1 && '(Most Preferred)'}
                      </label>
                      <select 
                        value={(formData as any)[`interiorColor${rank}`]}
                        onChange={(e) => updateForm(`interiorColor${rank}`, e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-2xl"
                      >
                        {interiorColors.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accessories */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-xl font-semibold mb-6">Desired Accessories</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableAccessories.map(acc => (
                    <button key={acc} type="button" onClick={() => toggleAccessory(acc)}
                      className={`p-4 text-left border rounded-2xl text-sm transition-all ${
                        (formData.accessories || []).includes(acc) 
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}>
                      {acc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview Sidebar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow p-8 sticky top-8">
                <h2 className="text-xl font-semibold mb-6">Build Preview</h2>
                
                <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden mb-6">
                  <img src={getVehicleImage()} alt={selectedVehicle} className="w-full h-full object-cover" />
                </div>

                <div className="space-y-4 text-sm">
                  <div><span className="font-medium">Vehicle:</span> {selectedVehicle || 'Select make & model'}</div>
                  <div><span className="font-medium">Exterior:</span> {formData.exteriorColor1} → {formData.exteriorColor2} → {formData.exteriorColor3}</div>
                  <div><span className="font-medium">Interior:</span> {formData.interiorColor1} → {formData.interiorColor2} → {formData.interiorColor3}</div>
                  
                  {formData.accessories.length > 0 && (
                    <div>
                      <span className="font-medium">Accessories ({formData.accessories.length})</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.accessories.map(acc => (
                          <span key={acc} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{acc}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={isSubmitting || !formData.make || !formData.model}
                  className="mt-10 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white py-4 rounded-2xl text-lg font-semibold transition">
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