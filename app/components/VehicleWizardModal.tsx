'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { dataClient } from '@/app/lib/amplify-data';
import { parseAppSyncResult } from '@/app/lib/parse-result';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2013 }, (_, i) => String(CURRENT_YEAR + 1 - i));

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

function ColorChip({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-xl border transition ${
        selected
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium'
          : 'border-slate-200 hover:border-slate-400 text-slate-600'
      }`}
    >
      {color}
    </button>
  );
}

function ColorCard({ index, label, combo, exteriorColors, interiorColors, onChange }: {
  index: number; label: string; combo: ColorCombo;
  exteriorColors: string[]; interiorColors: string[];
  onChange: (c: ColorCombo) => void;
}) {
  const noColors = exteriorColors.length === 0 && interiorColors.length === 0;
  return (
    <div className="bg-slate-50 rounded-2xl p-3 space-y-3">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      {noColors ? (
        <div className="text-xs text-slate-400 italic py-2">Select make &amp; model to see OEM colors</div>
      ) : (
        <>
          {exteriorColors.length > 0 && (
            <div>
              <div className="text-xs text-slate-400 mb-1.5">Exterior</div>
              <div className="flex flex-wrap gap-1.5">
                {exteriorColors.map(c => (
                  <ColorChip key={c} color={c} selected={combo.exterior === c}
                    onClick={() => onChange({ ...combo, exterior: combo.exterior === c ? '' : c })} />
                ))}
              </div>
              {combo.exterior && <div className="text-xs text-emerald-600 font-medium mt-1.5">{combo.exterior}</div>}
            </div>
          )}
          {interiorColors.length > 0 && (
            <div>
              <div className="text-xs text-slate-400 mb-1.5">Interior</div>
              <div className="flex flex-wrap gap-1.5">
                {interiorColors.map(c => (
                  <ColorChip key={c} color={c} selected={combo.interior === c}
                    onClick={() => onChange({ ...combo, interior: combo.interior === c ? '' : c })} />
                ))}
              </div>
              {combo.interior && <div className="text-xs text-emerald-600 font-medium mt-1.5">{combo.interior}</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AddOptionButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-emerald-600 min-h-[80px]"
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

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<string[]>([]);
  const [oemExteriorColors, setOemExteriorColors] = useState<string[]>([]);
  const [oemInteriorColors, setOemInteriorColors] = useState<string[]>([]);
  const [loadingFacets, setLoadingFacets] = useState<Set<string>>(new Set());

  const loadFacet = useCallback(async (facet: string, filters: Record<string, string | undefined>) => {
    setLoadingFacets(prev => new Set(prev).add(facet));
    try {
      const args: any = { facet };
      for (const [k, v] of Object.entries(filters)) {
        if (v) args[k] = v;
      }
      const result = await dataClient.queries.getVisorFacets(args);
      const values: string[] = parseAppSyncResult(result.data, []);
      if (facet === 'make') setMakes(values);
      else if (facet === 'model') setModels(values);
      else if (facet === 'trim') setTrims(values);
      else if (facet === 'exterior_color') setOemExteriorColors(values);
      else if (facet === 'interior_color') setOemInteriorColors(values);
    } catch (e) {
      console.error('getVisorFacets error:', facet, e);
    } finally {
      setLoadingFacets(prev => { const next = new Set(prev); next.delete(facet); return next; });
    }
  }, []);

  // Load all makes on mount
  useEffect(() => {
    loadFacet('make', {});
  }, [loadFacet]);

  // Cascade: make changed → reload models, clear downstream
  useEffect(() => {
    setModel(''); setTrim('');
    setModels([]); setTrims([]);
    setOemExteriorColors([]); setOemInteriorColors([]);
    setColorCombos([{ exterior: '', interior: '' }, { exterior: '', interior: '' },
                    { exterior: '', interior: '' }, { exterior: '', interior: '' }]);
    if (make) loadFacet('model', { make });
  }, [make]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cascade: model changed → reload trims, clear downstream
  useEffect(() => {
    setTrim(''); setTrims([]);
    setOemExteriorColors([]); setOemInteriorColors([]);
    if (make && model) loadFacet('trim', { make, model });
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load OEM colors whenever make+model are set; refresh when trim changes
  useEffect(() => {
    if (!make || !model) return;
    loadFacet('exterior_color', { make, model, trim: trim || undefined });
    loadFacet('interior_color', { make, model, trim: trim || undefined });
  }, [make, model, trim]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const makesLoading = loadingFacets.has('make');
  const modelsLoading = loadingFacets.has('model');
  const trimsLoading = loadingFacets.has('trim');
  const colorsLoading = loadingFacets.has('exterior_color') || loadingFacets.has('interior_color');

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-6">Vehicle Preferences</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
              <select value={year} onChange={e => setYear(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:border-emerald-500">
                <option value="">Any Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
              <select value={condition} onChange={e => setCondition(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:border-emerald-500">
                <option value="new">New</option>
                <option value="used">Used / CPO</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Make</label>
            <select value={make} onChange={e => setMake(e.target.value)} disabled={makesLoading}
              className="w-full p-3 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 disabled:text-slate-400">
              <option value="">{makesLoading ? 'Loading…' : 'Select Make'}</option>
              {makes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
            <select value={model} onChange={e => setModel(e.target.value)}
              disabled={!make || modelsLoading}
              className="w-full p-3 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 disabled:text-slate-400">
              <option value="">{!make ? 'Select make first' : modelsLoading ? 'Loading…' : 'Select Model'}</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Trim <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <select value={trim} onChange={e => setTrim(e.target.value)}
              disabled={!model || trimsLoading}
              className="w-full p-3 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 disabled:text-slate-400">
              <option value="">{!model ? 'Select model first' : trimsLoading ? 'Loading…' : 'Any Trim'}</option>
              {trims.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Color preferences */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">
                Color Preferences
                <span className="text-xs text-slate-400 font-normal ml-2">(optional — OEM names)</span>
              </span>
              {colorsLoading && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin inline-block" />
                  Loading colors…
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1].map(i => (
                <ColorCard key={i} index={i} label={`${ordinal(i + 1)} Choice`}
                  combo={colorCombos[i]}
                  exteriorColors={oemExteriorColors}
                  interiorColors={oemInteriorColors}
                  onChange={c => updateCombo(i, c)} />
              ))}

              {showThird
                ? <ColorCard index={2} label="3rd Choice" combo={colorCombos[2]}
                    exteriorColors={oemExteriorColors} interiorColors={oemInteriorColors}
                    onChange={c => updateCombo(2, c)} />
                : <AddOptionButton onClick={() => setShowThird(true)} label="Add 3rd Option" />
              }

              {showThird && (
                showFourth
                  ? <ColorCard index={3} label="4th Choice" combo={colorCombos[3]}
                      exteriorColors={oemExteriorColors} interiorColors={oemInteriorColors}
                      onChange={c => updateCombo(3, c)} />
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
              {[year, make, model, trim].filter(Boolean).join(' ')} · {condition === 'new' ? 'New' : 'Used / CPO'}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-3 border border-slate-300 rounded-2xl hover:bg-slate-50 text-sm font-medium">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!make || !model}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:bg-slate-300 text-sm font-semibold">
            Save Vehicle
          </button>
        </div>
      </div>
    </div>
  );
}
