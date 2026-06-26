'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function Profile() {
  const router = useRouter();

  useEffect(() => { getCurrentUser().catch(() => router.push('/login')); }, [router]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    zipCode: '',
    city: '',
    state: '',
    searchRadius: '25',
    budget: '',
    timeline: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Required';
    if (!formData.email.trim()) newErrors.email = 'Required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Required';
    if (!formData.budget) newErrors.budget = 'Required';
    if (!formData.timeline) newErrors.timeline = 'Required';
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    localStorage.setItem('profileData', JSON.stringify(formData));

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    currentUser.profileCompleted = true;
    currentUser.firstName = formData.firstName;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    router.push('/onboarding/vehicle');
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 border rounded-2xl focus:outline-none focus:border-emerald-500 transition ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-300'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="max-w-2xl mx-auto px-6 py-12 flex-1 w-full">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">1</div>
            <span className="text-sm font-semibold text-emerald-600">Your Profile</span>
          </div>
          <div className="w-12 h-px bg-slate-300" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold">2</div>
            <span className="text-sm text-slate-400">Vehicle Build</span>
          </div>
          <div className="w-12 h-px bg-slate-300" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold">3</div>
            <span className="text-sm text-slate-400">Confirm</span>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Tell Us About Yourself</h1>
          <p className="text-slate-500">This helps us personalize your deal and find the right dealerships</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl shadow p-8 space-y-6">
            <h2 className="text-lg font-semibold text-slate-700">Contact Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass('firstName')} placeholder="Jane" />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass('lastName')} placeholder="Smith" />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass('email')} placeholder="jane@example.com" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Phone Number <span className="text-slate-400 font-normal">(optional)</span></label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass('phone')} placeholder="(636) 555-0100" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">ZIP Code</label>
                <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} className={inputClass('zipCode')} placeholder="63301" maxLength={5} />
                {errors.zipCode && <p className="text-xs text-red-500 mt-1">{errors.zipCode}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass('city')} placeholder="St. Charles" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">State</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} className={inputClass('state')} placeholder="MO" maxLength={2} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow p-8 space-y-6">
            <h2 className="text-lg font-semibold text-slate-700">Deal Parameters</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Search Radius</label>
                <select name="searchRadius" value={formData.searchRadius} onChange={handleChange} className={inputClass('searchRadius')}>
                  <option value="15">15 miles</option>
                  <option value="25">25 miles</option>
                  <option value="50">50 miles</option>
                  <option value="75">75 miles</option>
                  <option value="100">100 miles</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Total Budget (OTD)</label>
                <select name="budget" value={formData.budget} onChange={handleChange} className={inputClass('budget')}>
                  <option value="">Select range</option>
                  <option value="Under $25,000">Under $25,000</option>
                  <option value="$25,000 – $35,000">$25,000 – $35,000</option>
                  <option value="$35,000 – $50,000">$35,000 – $50,000</option>
                  <option value="$50,000 – $65,000">$50,000 – $65,000</option>
                  <option value="$65,000 – $80,000">$65,000 – $80,000</option>
                  <option value="$80,000+">$80,000+</option>
                  <option value="Flexible">Flexible — best deal wins</option>
                </select>
                {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Purchase Timeline</label>
              <select name="timeline" value={formData.timeline} onChange={handleChange} className={inputClass('timeline')}>
                <option value="">When do you need this?</option>
                <option value="ASAP — ready to buy now">ASAP — ready to buy now</option>
                <option value="Within 2 weeks">Within 2 weeks</option>
                <option value="Within 30 days">Within 30 days</option>
                <option value="1–3 months">1–3 months</option>
                <option value="Just exploring">Just exploring for now</option>
              </select>
              {errors.timeline && <p className="text-xs text-red-500 mt-1">{errors.timeline}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Additional Notes <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 h-24 resize-none text-sm"
                placeholder="Anything else we should know — trade-in, financing preference, specific concerns..."
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-lg font-semibold transition"
          >
            Continue to Vehicle Build →
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
