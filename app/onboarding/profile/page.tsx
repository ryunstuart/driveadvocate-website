'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    firstName: 'Ryun',
    lastName: 'Stuart',
    email: 'ryun.stuart@gmail.com',
    phone: '636-387-3228',
    zipCode: '63301',
    city: 'St. Charles',
    state: 'MO',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('profileData', JSON.stringify(formData));
    
    // Mark user as having completed profile
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    currentUser.profileCompleted = true;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    router.push('/onboarding/vehicle');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Create Your Profile</h1>
          <p className="text-slate-600">This helps us personalize your deals and communication</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-10 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">ZIP Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-lg font-semibold transition"
          >
            Continue to Vehicle Preferences →
          </button>
        </form>
      </div>
    </div>
  );
}