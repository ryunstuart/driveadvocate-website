'use client';

import React, { useState } from 'react';

export default function Onboarding() {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow p-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Let's Get Started</h1>
          <p className="text-slate-500">Step {step} of 4</p>
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">What are you looking for?</h2>
            <input type="text" placeholder="e.g. 2025 Toyota Camry" className="w-full p-4 border rounded-2xl mb-6" />
            <button onClick={nextStep} className="w-full bg-emerald-600 text-white py-4 rounded-2xl">Next</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Budget & Timeline</h2>
            <input type="text" placeholder="Budget range" className="w-full p-4 border rounded-2xl mb-6" />
            <input type="text" placeholder="When do you need the car?" className="w-full p-4 border rounded-2xl mb-6" />
            <button onClick={nextStep} className="w-full bg-emerald-600 text-white py-4 rounded-2xl">Next</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Current Situation</h2>
            <textarea placeholder="Do you have a trade-in? Any special needs?" className="w-full p-4 border rounded-2xl h-32 mb-6"></textarea>
            <button onClick={nextStep} className="w-full bg-emerald-600 text-white py-4 rounded-2xl">Complete Onboarding</button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">You're All Set!</h2>
            <p className="mb-8">Redirecting to your dashboard...</p>
            <a href="/dashboard" className="bg-emerald-600 text-white px-10 py-4 rounded-2xl">Go to Dashboard</a>
          </div>
        )}

        {step > 1 && step < 4 && (
          <button onClick={prevStep} className="mt-4 text-slate-500">Back</button>
        )}
      </div>
    </div>
  );
}