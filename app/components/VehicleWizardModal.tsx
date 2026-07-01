'use client';

import React, { useState, useEffect } from 'react';
import { dataClient } from '@/app/lib/amplify-data';

const EXTERIOR_COLORS = [
  'White', 'Black', 'Silver', 'Gray', 'Red',
  'Blue', 'Brown', 'Green', 'Gold', 'Orange',
  'Yellow', 'Purple', 'Beige', 'Burgundy', 'Navy',
];

const INTERIOR_COLORS = [
  'Black', 'Gray', 'Beige', 'Tan', 'Brown',
  'Ivory', 'White', 'Red', 'Blue', 'Cream',
];

const COLOR_HEX: Record<string, string> = {
  'White': '#FFFFFF', 'Black': '#1a1a1a', 'Silver': '#C0C0C0', 'Gray': '#808080',
  'Red': '#CC0000', 'Blue': '#0000CC', 'Brown': '#8B4513', 'Green': '#006400',
  'Gold': '#FFD700', 'Orange': '#FF8C00', 'Yellow': '#FFEE00', 'Purple': '#6A0DAD',
  'Beige': '#F5F5DC', 'Burgundy': '#800020', 'Navy': '#001F5B', 'Tan': '#D2B48C',
  'Ivory': '#FFFFF0', 'Cream': '#FFFDD0',
};

const LIGHT_COLORS = new Set(['White', 'Silver', 'Ivory', 'Cream', 'Beige', 'Gold', 'Yellow']);
const ordinal = (n: number) => ['1st', '2nd', '3rd', '4th'][n - 1] ?? `${n}th`;

interface ColorCombo { exterior: string; interior: string; }

export interface VehicleResult {
  make: string; model: string; year: string; trim: string; condition: string;
  colorCombos: ColorCombo[];
  exteriorColors: string[];
  interiorColors: string[];
}

interface Props {
  clientZip?: string;
  onComplete: (prefs: VehicleResult) => void;
  onClose: () => void;
}

function ColorDot({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={color}
      className={`w-7 h-7 rounded-full border-2 transition-transform ${
        selected ? 'border-emerald-500 scale-125 shadow-md' : 'border-transparent hover:border-slate-400'
      } ${LIGHT_COLORS.has(color) ? 'ring-1 ring-slate-200' : ''}`}
      style={{ backgroundColor: COLOR_HEX[color] ?? '#ccc' }}
    />
  );
}

function ColorCard({ index, label, combo, onChange }: {
  index: number; label: string; combo: ColorCombo; onChange: (c: ColorCombo) => void;
}) {
  return (
    <div className="bg-slate-50 rounded-2xl p-3 space-y-2">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div>
        <div className="text-xs text-slate-400 mb-1.5">Exterior</div>
        <div className="flex flex-wrap gap-1.5">
          {EXTERIOR_COLORS.map(c => (
            <ColorDot key={c} color={c} selected={combo.exterior === c} onClick={() => onChange({ ...combo, exterior: c })} />
          ))}
        </div>
        {combo.exterior && <div className="text-xs text-slate-500 mt-1">{combo.exterior}</div>}
      </div>
      <div>
        <div className="text-xs text-slate-400 mb-1.5">Interior</div>
        <div className="flex flex-wrap gap-1.5">
          {INTERIOR_COLORS.map(c => (
            <ColorDot key={c} color={c} selected={combo.interior === c} onClick={() => onChange({ ...combo, interior: c })} />
          ))}
        </div>
        {combo.interior && <div className="text-xs text-slate-500 mt-1">{combo.interior}</div>}
      </div>
    </div>
  );
}

function AddOptionButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-emerald-600 min-h-[120px]"
    >
      <span className="text-xl font-light">+</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export default function VehicleWizardModal({ clientZip, onComplete, onClose }: Props) {
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [condition, setCondition] = useState('used');

  const [colorCombos, setColorCombos] = useState<ColorCombo[]>([
    { exterior: '', interior: '' },
    { exterior: '', interior: '' },
    { exterior: '', interior: '' },
    { exterior: '', interior: '' },
  ]);
  const [showThird, setShowThird] = useState(false);
  const [showFourth, setShowFourth] = useState(false);

  const [allCatalog, setAllCatalog] = useState<any[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await dataClient.queries.getCatalog({});
        const parsed = typeof result.data === 'string' ? JSON.parse(result.data) : (result.data || []);
        setAllCatalog(Array.isArray(parsed) ? parsed : []);
      } catch { }
      setLoadingCatalog(false);
    })();
  }, []);

  useEffect(() => {
    if (!year) { setMakes([]); return; }
    const filtered = allCatalog.filter((item: any) => item.year === year);
    setMakes([...new Set(filtered.map((item: any) => item.make as string))].sort());
    setMake(''); setModel(''); setTrim('');
  }, [year, allCatalog]);

  useEffect(() => {
    if (!make || !year) return;
    const filtered = allCatalog.filter((item: any) => item.year === year && item.make === make);
    setModels(filtered.map((item: any) => item.model as string).sort());
    setModel(''); setTrim('');
  }, [make, year, allCatalog]);

  useEffect(() => {
    if (!make || !model || !year) return;
    const item = allCatalog.find((d: any) => d.year === year && d.make === make && d.model === model);
    if (item?.trims) {
      const unique = [...new Map((item.trims as any[]).map((t: any) => [t.name, t])).values()];
      setTrims(unique);
    } else {
      setTrims([]);
    }
    setTrim('');
  }, [make, model, year, allCatalog]);

  const updateCombo = (index: number, combo: ColorCombo) => {
    setColorCombos(prev => { const next = [...prev]; next[index] = combo; return next; });
  };

  const handleSave = () => {
    if (!make || !model) return;
    const count = showFourth ? 4 : showThird ? 3 : 2;
    const activeCombos = colorCombos.slice(0, count).filter(c => c.exterior || c.interior);
    const exteriorColors = [...new Set(activeCombos.map(c => c.exterior).filter(Boolean))];
    const interiorColors = [...new Set(activeCombos.map(c => c.interior).filter(Boolean))];
    onComplete({ make, model, year, trim, condition, colorCombos: activeCombos, exteriorColors, interiorColors });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-6">Vehicle Preferences</h3>

        {loadingCatalog ? (
          <div className="text-center py-8"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                <select value={year} onChange={e => setYear(e.target.value)} className="w-full p-3 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:border-emerald-500">
                  <option value="">Select Year</option>
                  <option value="2020">2020</option>
                  <option value="2019">2019</option>
                  <option value="2018">2018</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full p-3 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:border-emerald-500">
                  <option value="new">New</option>
                  <option value="used">Used / CPO</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Make</label>
              <select value={make} onChange={e => setMake(e.target.value)} disabled={!year} className="w-full p-3 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:border-emerald-500">
                <option value="">{!year ? 'Select year first' : 'Select Make'}</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
              <select value={model} onChange={e => setModel(e.target.value)} disabled={!make} className="w-full p-3 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:border-emerald-500">
                <option value="">{!make ? 'Select make first' : 'Select Model'}</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Trim (optional)</label>
              <select value={trim} onChange={e => setTrim(e.target.value)} disabled={!model} className="w-full p-3 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:border-emerald-500">
                <option value="">Select Trim</option>
                {trims.map((t: any) => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
            </div>

            {/* Color preferences */}
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-3">
                Color Preferences
                <span className="text-xs text-slate-400 font-normal ml-2">(select at least 2 combinations)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[0, 1].map(i => (
                  <ColorCard key={i} index={i} label={`${ordinal(i + 1)} Choice`} combo={colorCombos[i]} onChange={c => updateCombo(i, c)} />
                ))}

                {showThird
                  ? <ColorCard index={2} label="3rd Choice" combo={colorCombos[2]} onChange={c => updateCombo(2, c)} />
                  : <AddOptionButton onClick={() => setShowThird(true)} label="Add 3rd Option" />
                }

                {showThird && (
                  showFourth
                    ? <ColorCard index={3} label="4th Choice" combo={colorCombos[3]} onChange={c => updateCombo(3, c)} />
                    : <AddOptionButton onClick={() => setShowFourth(true)} label="Add 4th Option" />
                )}
              </div>
            </div>

            {clientZip && (
              <div className="bg-slate-50 rounded-2xl p-3 text-sm text-slate-600">
                Search area: {clientZip} · 100 mile radius
              </div>
            )}

            {make && model && (
              <div className="bg-emerald-50 rounded-2xl p-3 text-sm text-emerald-700 font-medium">
                {year} {make} {model} {trim} · {condition === 'new' ? 'New' : 'Used'}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-300 rounded-2xl hover:bg-slate-50 text-sm font-medium">Cancel</button>
          <button onClick={handleSave} disabled={!make || !model} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:bg-slate-300 text-sm font-semibold">Save Vehicle</button>
        </div>
      </div>
    </div>
  );
}
