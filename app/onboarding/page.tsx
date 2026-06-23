'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const [formData, setFormData] = useState({
    year: '',
    make: '',
    model: '',
    trim: [] as string[],
    colors: { first: '', second: '', third: '' },
    accessories: [] as string[]
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleArrayChange = (field: 'trim' | 'accessories', value: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        [field]: [...formData[field], value]
      });
    } else {
      setFormData({
        ...formData,
        [field]: formData[field].filter(item => item !== value)
      });
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const completeOnboarding = () => {
    console.log('Onboarding Completed:', formData);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow p-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Let's Find Your Perfect Car</h1>
          <p className="text-slate-500">Step {step} of 4</p>
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Vehicle Details</h2>
            <select onChange={(e) => handleChange('year', e.target.value)} className="w-full p-4 border rounded-2xl mb-4">
              <option value="">Year</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
            <select onChange={(e) => handleChange('make', e.target.value)} className="w-full p-4 border rounded-2xl mb-4">
              <option value="">Make</option>
              <option value="Toyota">Toyota</option>
              <option value="Honda">Honda</option>
              <option value="Ford">Ford</option>
            </select>
            <select onChange={(e) => handleChange('model', e.target.value)} className="w-full p-4 border rounded-2xl mb-6">
              <option value="">Model</option>
              <option value="Camry">Camry</option>
              <option value="Accord">Accord</option>
              <option value="F-150">F-150</option>
            </select>
            <button onClick={nextStep} className="w-full bg-emerald-600 text-white py-4 rounded-2xl">Next</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Trim & Colors</h2>
            <div className="mb-6">
              <p className="mb-3 font-medium">Trim Package</p>
              <div className="space-y-2">
                {['LE', 'SE', 'XLE', 'Limited'].map(trim => (
                  <label key={trim} className="flex items-center gap-2">
                    <input type="checkbox" onChange={(e) => handleArrayChange('trim', trim, e.target.checked)} />
                    {trim}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 font-medium">Preferred Colors</p>
              <select onChange={(e) => handleChange('colors.first', e.target.value)} className="w-full p-4 border rounded-2xl mb-4">
                <option value="">1st Choice Color</option>
                <option value="White">White</option>
                <option value="Black">Black</option>
                <option value="Silver">Silver</option>
                <option value="Blue">Blue</option>
              </select>
              <select onChange={(e) => handleChange('colors.second', e.target.value)} className="w-full p-4 border rounded-2xl mb-4">
                <option value="">2nd Choice Color</option>
                <option value="White">White</option>
                <option value="Black">Black</option>
                <option value="Silver">Silver</option>
                <option value="Blue">Blue</option>
              </select>
              <select onChange={(e) => handleChange('colors.third', e.target.value)} className="w-full p-4 border rounded-2xl mb-6">
                <option value="">3rd Choice Color</option>
                <option value="White">White</option>
                <option value="Black">Black</option>
                <option value="Silver">Silver</option>
                <option value="Blue">Blue</option>
              </select>
            </div>
            <button onClick={nextStep} className="w-full bg-emerald-600 text-white py-4 rounded-2xl">Next</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Accessories & Options</h2>
            <div className="space-y-3 mb-8">
              {['Leather Seats', 'Sunroof', 'Navigation System', 'Backup Camera', 'Heated Seats', 'Blind Spot Monitoring', 'Premium Audio'].map(item => (
                <label key={item} className="flex items-center gap-2">
                  <input type="checkbox" onChange={(e) => handleArrayChange('accessories', item, e.target.checked)} />
                  {item}
                </label>
              ))}
            </div>
            <button onClick={nextStep} className="w-full bg-emerald-600 text-white py-4 rounded-2xl">Complete Onboarding</button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold mb-6">You're All Set!</h2>
            <p className="mb-8">Taking you to your dashboard...</p>
          </div>
        )}

        {step > 1 && step < 4 && (
          <button onClick={prevStep} className="mt-6 text-slate-500">Back</button>
        )}
      </div>
    </div>
  );
}