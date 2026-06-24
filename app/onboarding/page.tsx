'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    zipCode: '63301',
    vehicleType: '',
    year: '',
    make: '',
    model: '',
    budget: '',
  });

  // Redirect if already completed
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.hasCompletedOnboarding) {
      router.push('/dashboard');
    }
  }, [router]);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('onboardingData');
    if (saved) setFormData(JSON.parse(saved));
  }, []);

  const updateField = (field: string, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    localStorage.setItem('onboardingData', JSON.stringify(updated));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleComplete = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    currentUser.firstName = formData.firstName;
    currentUser.zipCode = formData.zipCode;
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
          <div className="text-sm text-slate-500">Step {step} of 2</div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold">Let's Get To Know You</h1>
          <p className="text-slate-600 mt-3">This helps us give you the best recommendations</p>
        </div>

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-10 shadow">
            <h2 className="text-2xl font-semibold mb-8">Personal Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input 
                  type="text" 
                  value={formData.firstName} 
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="Ryun" 
                  className="w-full p-4 border border-slate-300 rounded-2xl" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ZIP Code</label>
                <input 
                  type="text" 
                  value={formData.zipCode} 
                  onChange={(e) => updateField('zipCode', e.target.value)}
                  className="w-full p-4 border border-slate-300 rounded-2xl" 
                />
              </div>
            </div>
            <button 
              onClick={nextStep} 
              disabled={!formData.firstName.trim()} 
              className="w-full mt-10 bg-emerald-600 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold"
            >
              Continue to Vehicle
            </button>
          </div>
        )}

        {/* Step 2: Vehicle */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-10 shadow">
            <h2 className="text-2xl font-semibold mb-8">What vehicle are you looking for?</h2>
            
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium mb-4">Vehicle Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Sedan', 'SUV', 'Truck', 'Electric', 'Luxury', 'Sports'].map((type) => (
                    <button
                      key={type}
                      onClick={() => updateField('vehicleType', type)}
                      className={`p-4 rounded-2xl border-2 transition ${formData.vehicleType === type ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
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
                    className="w-full p-4 border border-slate-300 rounded-2xl" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Budget</label>
                  <input 
                    type="text" 
                    placeholder="$45,000" 
                    value={formData.budget} 
                    onChange={(e) => updateField('budget', e.target.value)} 
                    className="w-full p-4 border border-slate-300 rounded-2xl" 
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
                    className="w-full p-4 border border-slate-300 rounded-2xl" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Model</label>
                  <input 
                    type="text" 
                    placeholder="Camry" 
                    value={formData.model} 
                    onChange={(e) => updateField('model', e.target.value)} 
                    className="w-full p-4 border border-slate-300 rounded-2xl" 
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={prevStep} className="flex-1 border py-4 rounded-2xl font-medium">Back</button>
              <button onClick={handleComplete} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-semibold">Complete Setup →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}