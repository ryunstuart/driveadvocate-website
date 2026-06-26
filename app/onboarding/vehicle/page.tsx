'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { dataClient } from '@/app/lib/amplify-data';

// ─── Vehicle Type Definitions ────────────────────────────────────────────────

interface VehicleType { id: string; label: string; icon: string; bodyTypes: string[]; }
interface TrimOption { name: string; msrp: number; description: string; }
interface ColorOption { name: string; rgb: string | null; }

const BODY_TYPE_PATTERNS: Record<string, RegExp> = {
  car: /\b(sedan|coupe|hatchback|convertible|wagon)\b/i,
  suv: /\bsuv\b/i,
  crossover: /\bsuv\b/i,
  truck: /\b(supercrew|crew cab|crewmax|double cab|extended cab|regular cab|access cab|cab plus|club cab|king cab|mega cab|quad cab|supercab|xtracab)\b/i,
  van: /\b(van|minivan)\b/i,
  ev: /\b(hybrid|electric|plug-in)\b/i,
};

const VEHICLE_TYPES: VehicleType[] = [
  { id: 'car', label: 'Cars', icon: '🚗', bodyTypes: [] },
  { id: 'suv', label: 'SUVs', icon: '🚙', bodyTypes: [] },
  { id: 'crossover', label: 'Crossovers', icon: '🏎️', bodyTypes: [] },
  { id: 'truck', label: 'Trucks', icon: '🛻', bodyTypes: [] },
  { id: 'van', label: 'Vans', icon: '🚐', bodyTypes: [] },
  { id: 'ev', label: 'Electric / Hybrid', icon: '⚡', bodyTypes: [] },
];

const DEFAULT_EXT_COLORS: ColorOption[] = [
  { name: 'White', rgb: '#f8f9fa' }, { name: 'Black', rgb: '#1f2527' },
  { name: 'Silver', rgb: '#c0c0c0' }, { name: 'Gray', rgb: '#808080' },
  { name: 'Blue', rgb: '#1e40af' }, { name: 'Red', rgb: '#b91c1c' },
  { name: 'Green', rgb: '#166534' }, { name: 'Brown', rgb: '#78350f' },
];

const DEFAULT_INT_COLORS: ColorOption[] = [
  { name: 'Black', rgb: '#1f2527' }, { name: 'Gray', rgb: '#4b5563' },
  { name: 'Beige', rgb: '#d2b48c' }, { name: 'Brown', rgb: '#5c4033' },
  { name: 'Tan', rgb: '#c5a880' }, { name: 'White', rgb: '#f8f9fa' },
];

const ACCESSORY_OPTIONS = [
  'Towing Package', 'Sunroof / Moonroof', 'Leather Seats', 'Adaptive Cruise Control',
  'Bed Liner', 'Running Boards', 'Premium Audio', 'Remote Start', 'Heated Seats',
  'Blind Spot Monitoring', '360 Camera', 'Trailer Backup Assist', 'Power Tailgate',
  'Navigation System', 'Wireless Charging', 'Ventilated Seats',
];

function getColorBg(rgb: string | null): string {
  if (!rgb) return '#e2e8f0';
  return rgb.includes(',') ? `rgb(${rgb})` : rgb;
}

function ColorComboCard({ rank, rankLabel, combo, isEmpty, extColors, intColors, onChange }: {
  rank: number; rankLabel: string;
  combo: { exterior: string; interior: string; rank: number };
  isEmpty: boolean;
  extColors: ColorOption[]; intColors: ColorOption[];
  onChange: (c: { exterior: string; interior: string; rank: number }) => void;
}) {
  const [expanded, setExpanded] = useState<'exterior' | 'interior' | null>(null);

  const findColor = (id: string, colors: ColorOption[]) => colors.find(c => (c.name || c.rgb) === id);
  const extMatch = findColor(combo.exterior, extColors);
  const intMatch = findColor(combo.interior, intColors);

  return (
    <div className={`rounded-3xl border-2 transition-all p-6 ${isEmpty ? 'border-dashed border-slate-300 bg-white' : 'border-emerald-200 bg-white shadow-sm'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isEmpty ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white'}`}>{rank}</span>
          <span className="text-sm font-medium text-slate-600">{rankLabel}</span>
        </div>
        {!isEmpty && (
          <button type="button" onClick={() => onChange({ exterior: '', interior: '', rank })} className="text-xs text-slate-400 hover:text-red-500 transition">Clear</button>
        )}
      </div>

      {!isEmpty && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-2xl">
          {extMatch && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm" style={{ backgroundColor: getColorBg(extMatch.rgb) }} />
              <span className="text-xs text-slate-600 font-medium">{extMatch.name || 'Exterior'}</span>
            </div>
          )}
          {combo.exterior && combo.interior && <span className="text-slate-300 text-sm">/</span>}
          {intMatch && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm" style={{ backgroundColor: getColorBg(intMatch.rgb) }} />
              <span className="text-xs text-slate-600 font-medium">{intMatch.name || 'Interior'}</span>
            </div>
          )}
        </div>
      )}

      <div className="mb-3">
        <button type="button" onClick={() => setExpanded(expanded === 'exterior' ? null : 'exterior')} className="w-full flex items-center justify-between text-sm font-medium text-slate-700 py-1">
          <span>Exterior {combo.exterior ? `— ${extMatch?.name || combo.exterior}` : ''}</span>
          <span className="text-slate-400 text-xs">{expanded === 'exterior' ? '▲' : '▼'}</span>
        </button>
        {expanded === 'exterior' && (
          <div className="flex flex-wrap gap-2 mt-2">
            {extColors.map((c, i) => {
              const colorId = c.name || c.rgb || `ext-${i}`;
              const isSelected = combo.exterior === colorId;
              return (
                <button key={`c${rank}-ext-${colorId}-${i}`} type="button"
                  onClick={() => { onChange({ ...combo, exterior: colorId }); setExpanded('interior'); }}
                  title={c.name || 'Color'} style={{ backgroundColor: getColorBg(c.rgb) }}
                  className={`relative w-12 h-12 rounded-xl border-2 transition-all hover:scale-110 hover:shadow-md ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-300 scale-110' : 'border-slate-200 hover:border-emerald-300'}`}
                >
                  {isSelected && <span className="absolute inset-0 flex items-center justify-center"><svg className="w-5 h-5 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <button type="button" onClick={() => combo.exterior ? setExpanded(expanded === 'interior' ? null : 'interior') : undefined}
          className={`w-full flex items-center justify-between text-sm font-medium py-1 ${combo.exterior ? 'text-slate-700' : 'text-slate-400'}`}>
          <span>Interior {combo.interior ? `— ${intMatch?.name || combo.interior}` : combo.exterior ? '' : '(select exterior first)'}</span>
          {combo.exterior && <span className="text-slate-400 text-xs">{expanded === 'interior' ? '▲' : '▼'}</span>}
        </button>
        {expanded === 'interior' && combo.exterior && (
          <div className="flex flex-wrap gap-2 mt-2">
            {intColors.map((c, i) => {
              const colorId = c.name || c.rgb || `int-${i}`;
              const isSelected = combo.interior === colorId;
              return (
                <button key={`c${rank}-int-${colorId}-${i}`} type="button"
                  onClick={() => { onChange({ ...combo, interior: colorId }); setExpanded(null); }}
                  title={c.name || 'Color'} style={{ backgroundColor: getColorBg(c.rgb) }}
                  className={`relative w-12 h-12 rounded-xl border-2 transition-all hover:scale-110 hover:shadow-md ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-300 scale-110' : 'border-slate-200 hover:border-emerald-300'}`}
                >
                  {isSelected && <span className="absolute inset-0 flex items-center justify-center"><svg className="w-5 h-5 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VehicleWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
  }, [step]);

  // Step 1
  const [vehicleType, setVehicleType] = useState('');
  // Step 2
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [allCatalogData, setAllCatalogData] = useState<any[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<TrimOption[]>([]);
  const [loadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingTrims, setLoadingTrims] = useState(false);
  // Step 3
  const [extColors, setExtColors] = useState<ColorOption[]>(DEFAULT_EXT_COLORS);
  const [intColors, setIntColors] = useState<ColorOption[]>(DEFAULT_INT_COLORS);
  const [colorCombos, setColorCombos] = useState<{ exterior: string; interior: string; rank: number }[]>([
    { exterior: '', interior: '', rank: 1 },
    { exterior: '', interior: '', rank: 2 },
    { exterior: '', interior: '', rank: 3 },
    { exterior: '', interior: '', rank: 4 },
  ]);
  // Step 4
  const [accessories, setAccessories] = useState<string[]>([]);
  // Step 5
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [searchRadius, setSearchRadius] = useState('100');
  const [condition, setCondition] = useState('used');
  // Step 6
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ count: number; searched: boolean }>({ count: 0, searched: false });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load profile data for pre-fill
  useEffect(() => {
    const profile = JSON.parse(localStorage.getItem('profileData') || '{}');
    if (profile.zipCode) setZipCode(profile.zipCode);
    if (profile.searchRadius) setSearchRadius(profile.searchRadius);
    if (profile.budget) setBudget(profile.budget);
    if (profile.timeline) setTimeline(profile.timeline);

    const saved = localStorage.getItem('vehicleFormData');
    if (saved) {
      const p = JSON.parse(saved);
      if (p.year) setYear(p.year);
      if (p.make) setMake(p.make);
      if (p.model) setModel(p.model);
      if (p.trim) setTrim(p.trim);
      if (p.accessories) setAccessories(p.accessories);
    }
  }, []);

  // Load full catalog on mount — client-side filtering is instant
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/catalog/all');
        if (res.ok) {
          const data = await res.json();
          setAllCatalogData(data.items || []);
        }
      } catch {}
      setCatalogLoaded(true);
    })();
  }, []);

  // Filter makes when year or vehicleType changes
  useEffect(() => {
    if (!year) { setMakes([]); return; }
    setMake(''); setModel(''); setTrim('');
    setModels([]); setTrims([]);

    const pattern = BODY_TYPE_PATTERNS[vehicleType];

    const filtered = allCatalogData.filter((item: any) => {
      if (item.year !== year) return false;
      if (!pattern) return true;
      const descriptions: string[] = (item.trims || []).map((t: any) => (t.description || ''));
      return descriptions.some(desc => pattern.test(desc));
    });

    const uniqueMakes = [...new Set(filtered.map((item: any) => item.make as string))].sort();
    setMakes(uniqueMakes);
  }, [year, vehicleType, allCatalogData]);

  // Filter models when make changes
  useEffect(() => {
    if (!make || !year) return;
    setModel(''); setTrim('');
    setTrims([]);

    const pattern = BODY_TYPE_PATTERNS[vehicleType];
    const filtered = allCatalogData.filter((item: any) => {
      if (item.year !== year || item.make !== make) return false;
      if (!pattern) return true;
      const descriptions: string[] = (item.trims || []).map((t: any) => (t.description || ''));
      return descriptions.some(desc => pattern.test(desc));
    });
    const modelNames = filtered.map((item: any) => item.model as string).sort();
    setModels(modelNames);

    const allExt: any[] = [];
    const allInt: any[] = [];
    for (const item of filtered) {
      if (item.exteriorColors) allExt.push(...item.exteriorColors);
      if (item.interiorColors) allInt.push(...item.interiorColors);
    }
    const dedupedExt = [...new Map(allExt.map((c: any) => [c.name || c.rgb || Math.random(), c])).values()];
    const dedupedInt = [...new Map(allInt.map((c: any) => [c.name || c.rgb || Math.random(), c])).values()];
    const hasNamedExt = dedupedExt.some((c: any) => c.name);
    const hasNamedInt = dedupedInt.some((c: any) => c.name);
    setExtColors(hasNamedExt ? dedupedExt : DEFAULT_EXT_COLORS);
    setIntColors(hasNamedInt ? dedupedInt : DEFAULT_INT_COLORS);
  }, [make, year, vehicleType, allCatalogData]);

  // Filter trims when model changes
  useEffect(() => {
    if (!make || !model || !year) return;
    setTrim('');
    setLoadingTrims(true);

    const item = allCatalogData.find((d: any) => d.year === year && d.make === make && d.model === model);
    if (item) {
      const rawTrims: any[] = item.trims || [];
      const uniqueTrims = [...new Map(rawTrims.map((t: any) => [t.name, { name: t.name, msrp: t.msrp || 0, description: t.description || '' }])).values()];
      setTrims(uniqueTrims);
      if (item.exteriorColors?.some((c: any) => c.name)) setExtColors(item.exteriorColors);
      if (item.interiorColors?.some((c: any) => c.name)) setIntColors(item.interiorColors);
    } else {
      setTrims([]);
    }
    setLoadingTrims(false);
  }, [make, model, year, allCatalogData]);

  const toggleAccessory = (acc: string) => {
    setAccessories(prev => prev.includes(acc) ? prev.filter(a => a !== acc) : [...prev, acc]);
  };

  const handleInventorySearch = async () => {
    if (!make || !model || !zipCode) return;
    setSearching(true);
    try {
      const result = await dataClient.mutations.searchDealInventory({
        dealId: `preview-${Date.now()}`,
        make, model, year, zip: zipCode,
        radius: parseInt(searchRadius, 10),
        carType: condition,
      });
      setSearchResult({ count: result.data?.resultCount || 0, searched: true });
    } catch (err) {
      console.error('Inventory search failed:', err);
      setSearchResult({ count: 0, searched: true });
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = () => {
    if (!make || !model) return;
    setIsSubmitting(true);

    const validCombos = colorCombos.filter(c => c.exterior);
    const formData = {
      year, make, model, trim,
      colorCombos: validCombos,
      exteriorColor1: validCombos[0]?.exterior || '',
      exteriorColor2: validCombos[1]?.exterior || '',
      exteriorColor3: validCombos[2]?.exterior || '',
      interiorColor1: validCombos[0]?.interior || '',
      interiorColor2: validCombos[1]?.interior || '',
      interiorColor3: validCombos[2]?.interior || '',
      accessories, condition,
    };
    localStorage.setItem('vehicleFormData', JSON.stringify(formData));

    const profile = JSON.parse(localStorage.getItem('profileData') || '{}');
    profile.budget = budget;
    profile.timeline = timeline;
    profile.searchRadius = searchRadius;
    profile.zipCode = zipCode;
    localStorage.setItem('profileData', JSON.stringify(profile));

    router.push('/onboarding/confirm');
  };

  const selectedTrim = trims.find(t => t.name === trim);
  const vehicleSummary = [year, make, model, trim].filter(Boolean).join(' ');
  const fakeColorPatterns = ['color 1', 'color 2', 'color 3', 'color-', 'rgb('];
  const hasRealColors = colorCombos.some(c => c.exterior && !fakeColorPatterns.some(p => c.exterior.toLowerCase().includes(p)));
  const canProceed: Record<number, boolean> = {
    1: !!vehicleType,
    2: !!year && !!make && !!model,
    3: colorCombos.some(c => !!c.exterior),
    4: true,
    5: !!budget && !!timeline && !!zipCode,
    6: true,
  };

  const stepLabels = ['Type', 'Vehicle', 'Colors', 'Options', 'Details', 'Search'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="max-w-3xl mx-auto px-6 py-8 flex-1 w-full">

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition ${
                  i + 1 < step ? 'bg-emerald-500 text-white' :
                  i + 1 === step ? 'bg-emerald-600 text-white' :
                  'bg-slate-200 text-slate-500'
                }`}>
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${i + 1 === step ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>{label}</span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-slate-200 rounded-full">
            <div className="h-2 bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }} />
          </div>
        </div>

        {/* ─── Step 1: Vehicle Type ─── */}
        {step === 1 && (
          <div>
            <h1 className="text-3xl font-bold mb-2">What type of vehicle?</h1>
            <p className="text-slate-500 mb-8">Select the category that best fits what you're looking for</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {VEHICLE_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setVehicleType(type.id)}
                  className={`p-6 rounded-3xl border-2 text-center transition hover:shadow-lg ${
                    vehicleType === type.id
                      ? 'border-emerald-500 bg-emerald-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-4xl mb-3">{type.icon}</div>
                  <div className="font-semibold">{type.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Step 2: Vehicle Selection ─── */}
        {step === 2 && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Build your vehicle</h1>
            <p className="text-slate-500 mb-8">Select year, make, model, and trim</p>
            <div className="bg-white rounded-3xl shadow p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Year</label>
                  <select value={year} onChange={e => setYear(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 text-sm">
                    <option value="">Select Year</option>
                    <option value="2020">2020</option>
                    <option value="2019">2019</option>
                    <option value="2018">2018</option>
                    <option value="2017">2017</option>
                    <option value="2016">2016</option>
                    <option value="2015">2015</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Make</label>
                  <select value={make} onChange={e => setMake(e.target.value)} disabled={!year || loadingMakes} className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 text-sm">
                    <option value="">{!year ? 'Select year first' : loadingMakes ? 'Loading...' : 'Select Make'}</option>
                    {makes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Model</label>
                  <select value={model} onChange={e => setModel(e.target.value)} disabled={loadingModels || !make} className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 text-sm">
                    <option value="">{loadingModels ? 'Loading...' : 'Select Model'}</option>
                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Trim</label>
                  <select value={trim} onChange={e => setTrim(e.target.value)} disabled={loadingTrims || !model} className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 text-sm">
                    <option value="">{loadingTrims ? 'Loading...' : 'Select Trim (optional)'}</option>
                    {trims.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              {selectedTrim && selectedTrim.description && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <div className="text-sm font-semibold text-emerald-800">{selectedTrim.name}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{selectedTrim.description}</div>
                </div>
              )}
              {vehicleSummary.length > 5 && (
                <div className="text-center pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-400 mb-1">Building</div>
                  <div className="text-lg font-semibold">{vehicleSummary}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Step 3: Color Combinations ─── */}
        {step === 3 && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Color combinations</h1>
            <p className="text-slate-500 mb-8">Select up to 4 exterior + interior combinations in order of preference. We'll match inventory that has your exact color pairing.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {colorCombos.map((combo, index) => {
                const rankLabels = ['1st Choice', '2nd Choice', '3rd Choice', '4th Choice'];
                const isEmpty = !combo.exterior && !combo.interior;
                return (
                  <ColorComboCard
                    key={index}
                    rank={index + 1}
                    rankLabel={rankLabels[index]}
                    combo={combo}
                    isEmpty={isEmpty}
                    extColors={extColors}
                    intColors={intColors}
                    onChange={(updated) => {
                      const next = [...colorCombos];
                      next[index] = updated;
                      setColorCombos(next);
                    }}
                  />
                );
              })}
            </div>
            {colorCombos.every(c => !c.exterior) && (
              <p className="text-amber-600 text-sm mt-4 text-center">Please select at least one color combination to continue.</p>
            )}
          </div>
        )}

        {/* ─── Step 4: Options & Accessories ─── */}
        {step === 4 && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Options & accessories</h1>
            <p className="text-slate-500 mb-8">Select any must-have features (all optional)</p>
            <div className="bg-white rounded-3xl shadow p-8">
              <div className="grid grid-cols-2 gap-3">
                {ACCESSORY_OPTIONS.map(acc => (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => toggleAccessory(acc)}
                    className={`p-4 text-left border rounded-2xl text-sm transition ${
                      accessories.includes(acc)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {accessories.includes(acc) ? '✓ ' : ''}{acc}
                  </button>
                ))}
              </div>
              {accessories.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-100 text-sm text-slate-500">
                  {accessories.length} option{accessories.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Step 5: Deal Parameters ─── */}
        {step === 5 && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Deal parameters</h1>
            <p className="text-slate-500 mb-8">Help us find the right matches for your budget and timeline</p>
            <div className="bg-white rounded-3xl shadow p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Condition</label>
                <div className="flex gap-3">
                  {['new', 'used'].map(c => (
                    <button key={c} type="button" onClick={() => setCondition(c)} className={`flex-1 py-3 rounded-2xl border text-sm font-medium transition ${
                      condition === c ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      {c === 'new' ? 'New' : 'Used / CPO'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Budget (OTD)</label>
                <select value={budget} onChange={e => setBudget(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 text-sm">
                  <option value="">Select range</option>
                  <option>Under $25,000</option>
                  <option>$25,000 – $35,000</option>
                  <option>$35,000 – $50,000</option>
                  <option>$50,000 – $65,000</option>
                  <option>$65,000 – $80,000</option>
                  <option>$80,000+</option>
                  <option>Flexible — best deal wins</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Timeline</label>
                <select value={timeline} onChange={e => setTimeline(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 text-sm">
                  <option value="">When do you need this?</option>
                  <option>ASAP — ready to buy now</option>
                  <option>Within 2 weeks</option>
                  <option>Within 30 days</option>
                  <option>1–3 months</option>
                  <option>Just exploring</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">ZIP Code</label>
                  <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)} maxLength={5} placeholder="63301" className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Search Radius</label>
                  <select value={searchRadius} onChange={e => setSearchRadius(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 text-sm">
                    <option value="25">25 miles</option>
                    <option value="50">50 miles</option>
                    <option value="100">100 miles</option>
                    <option value="150">150 miles</option>
                    <option value="200">200 miles</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 6: Inventory Search ─── */}
        {step === 6 && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Inventory check</h1>
            <p className="text-slate-500 mb-8">Let's see what's available near you before we start</p>

            <div className="bg-white rounded-3xl shadow p-8 text-center">
              <div className="text-lg font-semibold mb-1">{vehicleSummary}</div>
              <div className="text-sm text-slate-500 mb-6">{condition === 'new' ? 'New' : 'Used'} · {zipCode} · {searchRadius} mile radius</div>

              {!searchResult.searched && !searching && (
                <button
                  onClick={handleInventorySearch}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition"
                >
                  Search Inventory
                </button>
              )}

              {searching && (
                <div className="py-8">
                  <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-500 text-sm">Searching inventory near {zipCode}...</p>
                </div>
              )}

              {searchResult.searched && !searching && (
                <div className="py-4">
                  {!hasRealColors && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4 text-sm text-amber-700">
                      Color filtering is pending — showing all available inventory. Exact color matching activates after vehicle color data is imported.
                    </div>
                  )}
                  {searchResult.count > 0 ? (
                    <>
                      <div className="text-5xl mb-3">🎯</div>
                      <div className="text-2xl font-bold text-emerald-600 mb-1">{searchResult.count} vehicles found</div>
                      <p className="text-slate-500 text-sm">
                        {hasRealColors
                          ? 'Matched to your color preferences — your advocate will negotiate from these'
                          : 'Your advocate will have plenty of options to negotiate from'}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-5xl mb-3">📋</div>
                      <div className="text-lg font-semibold text-slate-700 mb-1">
                        {hasRealColors ? 'No exact color matches found' : 'No exact matches yet'}
                      </div>
                      <p className="text-slate-500 text-sm">
                        {hasRealColors
                          ? 'Your advocate will search for the closest available color combinations'
                          : 'No worries — your advocate will expand the search and find the right vehicle'}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 bg-white rounded-3xl shadow p-8">
              <h2 className="font-semibold mb-4">Build Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Vehicle</span><span className="font-medium">{vehicleSummary}</span></div>
                {colorCombos.some(c => c.exterior) && (
                  <div className="flex justify-between"><span className="text-slate-500">Colors</span><span className="font-medium text-right">{colorCombos.filter(c => c.exterior).map(c => `${c.exterior}${c.interior ? ' / ' + c.interior : ''}`).join(', ')}</span></div>
                )}
                {accessories.length > 0 && <div className="flex justify-between"><span className="text-slate-500">Options</span><span className="font-medium">{accessories.length} selected</span></div>}
                <div className="flex justify-between"><span className="text-slate-500">Budget</span><span className="font-medium">{budget}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Timeline</span><span className="font-medium">{timeline}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Condition</span><span className="font-medium">{condition === 'new' ? 'New' : 'Used / CPO'}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Navigation Buttons ─── */}
        <div className="flex gap-4 mt-8">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-4 border border-slate-300 rounded-2xl font-medium hover:bg-slate-50 transition">
              Back
            </button>
          )}
          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed[step]}
              className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 disabled:bg-slate-300 transition"
            >
              {isSubmitting ? 'Submitting...' : 'Submit & Continue'}
            </button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
