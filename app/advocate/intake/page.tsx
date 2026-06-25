'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { dataClient } from '@/app/lib/amplify-data';

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
  'White', 'Black', 'Silver', 'Gray', 'Blue', 'Red', 'Green', 'Brown',
  'Midnight Black', 'Pearl White', 'Magnetic Gray', 'Cavalry Blue',
  'Rapid Red', 'Iconic Silver', 'Area 51', 'Other'
];

const interiorColors = [
  'Black', 'Gray', 'Beige', 'Brown', 'Tan', 'Red', 'White', 'Two-Tone', 'Other'
];

const availableAccessories = [
  'Towing Package', 'Sunroof / Moonroof', 'Leather Seats', 'Adaptive Cruise Control',
  'Bed Liner', 'Running Boards', 'Premium Audio', 'Remote Start', 'Heated Seats',
  'Blind Spot Monitoring', '360 Camera', 'Trailer Backup Assist', 'Power Tailgate'
];

export default function AdvocateIntake() {
  const router = useRouter();
  const currentYear = 2026;

  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    // Client info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    zipCode: '',
    city: '',
    state: '',
    // Deal params
    budget: '',
    timeline: '',
    searchRadius: '25',
    serviceLevel: 'Negotiation Service',
    notes: '',
    // Vehicle
    year: currentYear.toString(),
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

  // Load makes
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
      .catch(() => setLoadingMakes(false));
  }, []);

  // Load models when make changes
  useEffect(() => {
    if (!form.make || !form.year) return;
    const makeObj = makes.find(m => m.Make_Name === form.make);
    if (!makeObj) return;
    setLoadingModels(true);
    fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeIdYear/makeId/${makeObj.Make_ID}/modelyear/${form.year}?format=json`)
      .then(res => res.json())
      .then(data => {
        const modelList: Model[] = data.Results || [];
        const unique = Array.from(new Map(modelList.map(i => [i.Model_Name, i])).values())
          .sort((a, b) => a.Model_Name.localeCompare(b.Model_Name));
        setModels(unique);
        setLoadingModels(false);
      })
      .catch(() => setLoadingModels(false));
  }, [form.make, form.year, makes]);

  const update = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const toggleAccessory = (acc: string) => {
    const current = form.accessories;
    update('accessories', current.includes(acc) ? current.filter(a => a !== acc) : [...current, acc]);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!form.zipCode.trim()) e.zipCode = 'Required';
    if (!form.make) e.make = 'Required';
    if (!form.model) e.model = 'Required';
    if (!form.budget) e.budget = 'Required';
    if (!form.timeline) e.timeline = 'Required';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const { data: existingDeals } = await dataClient.models.Deal.list();
      const priority = (existingDeals?.length || 0) + 1;

      const clientName = `${form.firstName} ${form.lastName}`.trim();
      const clientEmail = form.email.trim().toLowerCase();

      const { data: deal, errors: dealErrors } = await dataClient.models.Deal.create({
        clientId: clientEmail,
        clientName,
        clientEmail,
        status: 'New',
        priority,
        serviceLevel: form.serviceLevel,
        budget: form.budget,
        timeline: form.timeline,
        searchRadius: parseInt(form.searchRadius, 10),
        notes: form.notes || undefined,
        submittedAt: new Date().toISOString(),
        totalTimeMinutes: 0,
      });

      if (dealErrors?.length || !deal) {
        throw new Error(dealErrors?.[0]?.message || 'Failed to create deal');
      }

      const exteriorColors = [form.exteriorColor1, form.exteriorColor2, form.exteriorColor3].filter(Boolean);
      const interiorColors = [form.interiorColor1, form.interiorColor2, form.interiorColor3].filter(Boolean);

      const { errors: vpErrors } = await dataClient.models.VehiclePreference.create({
        dealId: deal.id,
        year: form.year,
        make: form.make,
        model: form.model,
        trim: form.trim || undefined,
        exteriorColors,
        interiorColors,
        accessories: form.accessories.length > 0 ? form.accessories : undefined,
        zipCode: form.zipCode,
        searchRadius: parseInt(form.searchRadius, 10),
      });

      if (vpErrors?.length) {
        throw new Error(vpErrors[0]?.message || 'Failed to create vehicle preference');
      }

      router.push('/negotiation');
    } catch (err: any) {
      console.error('Intake submission failed:', err);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 border rounded-2xl focus:outline-none focus:border-emerald-500 transition text-sm ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-300'
    }`;

  const vehicleSummary = `${form.year} ${form.make} ${form.model} ${form.trim}`.trim();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">New Client Intake</h1>
            <p className="text-slate-500 mt-1">Add a new client and vehicle build to the queue</p>
          </div>
          {vehicleSummary.length > 5 && (
            <div className="hidden md:block text-right">
              <div className="text-xs text-slate-400 mb-1">Building file for</div>
              <div className="text-lg font-semibold">{vehicleSummary}</div>
              {form.firstName && <div className="text-sm text-slate-500">{form.firstName} {form.lastName}</div>}
            </div>
          )}
        </div>

        {submitError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-6 py-4 text-red-700 text-sm flex items-center justify-between">
            <span>{submitError}</span>
            <button onClick={() => setSubmitError('')} className="text-red-500 hover:text-red-700 text-xs font-medium ml-4">Dismiss</button>
          </div>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-6 py-4 text-red-700 text-sm">
            Please fill in all required fields before submitting.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-8">

            {/* LEFT COLUMN */}
            <div className="space-y-6">

              {/* Client Info */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-lg font-semibold mb-6">Client Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">First Name *</label>
                      <input type="text" value={form.firstName} onChange={e => update('firstName', e.target.value)} className={inputClass('firstName')} placeholder="Jane" />
                      {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Last Name *</label>
                      <input type="text" value={form.lastName} onChange={e => update('lastName', e.target.value)} className={inputClass('lastName')} placeholder="Smith" />
                      {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Email *</label>
                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className={inputClass('email')} placeholder="jane@example.com" />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Phone</label>
                    <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className={inputClass('phone')} placeholder="(636) 555-0100" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">ZIP *</label>
                      <input type="text" value={form.zipCode} onChange={e => update('zipCode', e.target.value)} className={inputClass('zipCode')} placeholder="63301" maxLength={5} />
                      {errors.zipCode && <p className="text-xs text-red-500 mt-1">{errors.zipCode}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">City</label>
                      <input type="text" value={form.city} onChange={e => update('city', e.target.value)} className={inputClass('city')} placeholder="St. Charles" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">State</label>
                      <input type="text" value={form.state} onChange={e => update('state', e.target.value)} className={inputClass('state')} placeholder="MO" maxLength={2} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Deal Parameters */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-lg font-semibold mb-6">Deal Parameters</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Service Level</label>
                      <select value={form.serviceLevel} onChange={e => update('serviceLevel', e.target.value)} className={inputClass('serviceLevel')}>
                        <option>Research Package</option>
                        <option>Negotiation Service</option>
                        <option>Full Concierge</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Search Radius</label>
                      <select value={form.searchRadius} onChange={e => update('searchRadius', e.target.value)} className={inputClass('searchRadius')}>
                        <option value="15">15 miles</option>
                        <option value="25">25 miles</option>
                        <option value="50">50 miles</option>
                        <option value="75">75 miles</option>
                        <option value="100">100 miles</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Budget (OTD) *</label>
                    <select value={form.budget} onChange={e => update('budget', e.target.value)} className={inputClass('budget')}>
                      <option value="">Select range</option>
                      <option>Under $25,000</option>
                      <option>$25,000 – $35,000</option>
                      <option>$35,000 – $50,000</option>
                      <option>$50,000 – $65,000</option>
                      <option>$65,000 – $80,000</option>
                      <option>$80,000+</option>
                      <option>Flexible — best deal wins</option>
                    </select>
                    {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Timeline *</label>
                    <select value={form.timeline} onChange={e => update('timeline', e.target.value)} className={inputClass('timeline')}>
                      <option value="">Select timeline</option>
                      <option>ASAP — ready to buy now</option>
                      <option>Within 2 weeks</option>
                      <option>Within 30 days</option>
                      <option>1–3 months</option>
                      <option>Just exploring</option>
                    </select>
                    {errors.timeline && <p className="text-xs text-red-500 mt-1">{errors.timeline}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Advocate Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={e => update('notes', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 h-24 resize-none text-sm"
                      placeholder="Trade-in, financing preference, client concerns, how they found us..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">

              {/* Vehicle Config */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-lg font-semibold mb-6">Vehicle Build</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Year</label>
                      <select value={form.year} onChange={e => update('year', e.target.value)} className={inputClass('year')}>
                        <option value={currentYear}>{currentYear}</option>
                        <option value={currentYear - 1}>{currentYear - 1}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Make *</label>
                      <select value={form.make} onChange={e => update('make', e.target.value)} disabled={loadingMakes} className={inputClass('make')}>
                        <option value="">{loadingMakes ? 'Loading...' : 'Select Make'}</option>
                        {makes.map(m => <option key={m.Make_ID} value={m.Make_Name}>{m.Make_Name}</option>)}
                      </select>
                      {errors.make && <p className="text-xs text-red-500 mt-1">{errors.make}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Model *</label>
                      <select value={form.model} onChange={e => update('model', e.target.value)} disabled={loadingModels || !form.make} className={inputClass('model')}>
                        <option value="">{loadingModels ? 'Loading...' : 'Select Model'}</option>
                        {models.map(m => <option key={m.Model_ID} value={m.Model_Name}>{m.Model_Name}</option>)}
                      </select>
                      {errors.model && <p className="text-xs text-red-500 mt-1">{errors.model}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Trim</label>
                      <select value={form.trim} onChange={e => update('trim', e.target.value)} className={inputClass('trim')}>
                        <option value="">Select Trim</option>
                        {commonTrims.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Exterior Colors */}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-3">Exterior Color Preferences</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map(rank => (
                        <div key={rank}>
                          <div className="text-xs text-slate-400 mb-1">Choice {rank}</div>
                          <select
                            value={(form as any)[`exteriorColor${rank}`]}
                            onChange={e => update(`exteriorColor${rank}`, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                          >
                            {exteriorColors.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interior Colors */}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-3">Interior Color Preferences</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map(rank => (
                        <div key={rank}>
                          <div className="text-xs text-slate-400 mb-1">Choice {rank}</div>
                          <select
                            value={(form as any)[`interiorColor${rank}`]}
                            onChange={e => update(`interiorColor${rank}`, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                          >
                            {interiorColors.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Accessories */}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-3">Accessories</label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableAccessories.map(acc => (
                        <button
                          key={acc}
                          type="button"
                          onClick={() => toggleAccessory(acc)}
                          className={`p-3 text-left border rounded-xl text-xs transition ${
                            form.accessories.includes(acc)
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          {form.accessories.includes(acc) ? '✓ ' : ''}{acc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-lg font-semibold mb-2">Ready to add to queue?</h2>
                {vehicleSummary.length > 5 ? (
                  <p className="text-sm text-slate-500 mb-6">
                    Creating file for <span className="font-semibold text-slate-700">{form.firstName || 'client'}</span> — <span className="font-semibold text-slate-700">{vehicleSummary}</span>
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 mb-6">Fill in the required fields to create the deal file.</p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold transition"
                >
                  {isSubmitting ? 'Creating File...' : 'Add to Negotiation Queue →'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full mt-3 py-3 border border-slate-200 rounded-2xl text-sm text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
