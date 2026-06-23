'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    vehicleType: '',
    year: '',
    make: '',
    model: '',
    budget: '',
    zipCode: '63301',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleComplete = () => {
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
          <div className="text-sm text-slate-500">Step {step} of 4</div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold">Let's Build Your Profile</h1>
          <p className="text-slate-600 mt-3">This helps us find the best deals for you</p>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-10 shadow max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-8">What type of vehicle are you looking for?</h2>
            <div className="grid grid-cols-2 gap-4">
              {['Sedan', 'SUV', 'Truck', 'Electric', 'Luxury', 'Sports'].map((type) => (
                <button
                  key={type}
                  onClick={() => updateField('vehicleType', type)}
                  className={`p-6 rounded-3xl border-2 transition ${formData.vehicleType === type ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={nextStep} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-semibold">Continue</button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-10 shadow max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-8">Preferred Year &amp; Budget</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Year</label>
                <input type="text" placeholder="e.g. 2025" value={formData.year} onChange={(e) => updateField('year', e.target.value)} className="w-full p-4 border rounded-2xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Budget</label>
                <input type="text" placeholder="$35,000" value={formData.budget} onChange={(e) => updateField('budget', e.target.value)} className="w-full p-4 border rounded-2xl" />
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={prevStep} className="flex-1 border py-4 rounded-2xl font-medium">Back</button>
              <button onClick={nextStep} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-semibold">Continue</button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="bg-white rounded-3xl p-10 shadow max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-8">Make &amp; Model (Optional)</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Make</label>
                <input type="text" placeholder="Toyota, Honda, etc." value={formData.make} onChange={(e) => updateField('make', e.target.value)} className="w-full p-4 border rounded-2xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <input type="text" placeholder="Camry, Civic, etc." value={formData.model} onChange={(e) => updateField('model', e.target.value)} className="w-full p-4 border rounded-2xl" />
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={prevStep} className="flex-1 border py-4 rounded-2xl font-medium">Back</button>
              <button onClick={nextStep} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-semibold">Continue</button>
            </div>
          </div>
        )}

        {/* Step 4 - Review */}
        {step === 4 && (
          <div className="bg-white rounded-3xl p-10 shadow max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-8">Review Your Preferences</h2>
            <div className="space-y-4 mb-10">
              <div className="flex justify-between py-3 border-b"><span>Vehicle Type</span><span className="font-medium">{formData.vehicleType || 'Not selected'}</span></div>
              <div className="flex justify-between py-3 border-b"><span>Year</span><span className="font-medium">{formData.year || 'Any'}</span></div>
              <div className="flex justify-between py-3 border-b"><span>Budget</span><span className="font-medium">${formData.budget || 'Not set'}</span></div>
              <div className="flex justify-between py-3 border-b"><span>Make</span><span className="font-medium">{formData.make || 'Any'}</span></div>
              <div className="flex justify-between py-3"><span>Model</span><span className="font-medium">{formData.model || 'Any'}</span></div>
            </div>
            <button onClick={handleComplete} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold text-lg">Save &amp; Find Deals →</button>
          </div>
        )}
      </div>
    </div>
  );
}