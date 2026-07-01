'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { dataClient } from '@/app/lib/amplify-data';
import { parseAppSyncResult } from '@/app/lib/parse-result';

const CURRENT_YEAR = new Date().getFullYear();
const AVAILABLE_YEARS = [
  String(CURRENT_YEAR + 1),
  String(CURRENT_YEAR),
  String(CURRENT_YEAR - 1),
];

const COLOR_HEX: Record<string, string> = {
  'White': '#FFFFFF', 'Black': '#1a1a1a', 'Silver': '#C0C0C0', 'Gray': '#808080',
  'Red': '#CC0000', 'Blue': '#003DA6', 'Brown': '#8B4513', 'Green': '#1A5C1A',
  'Gold': '#C5A028', 'Orange': '#E05A00', 'Yellow': '#E6C800', 'Purple': '#6A0DAD',
  'Beige': '#C8B89A', 'Burgundy': '#800020', 'Navy': '#001F5B', 'Tan': '#C4A882',
  'Ivory': '#F5F0E0', 'Cream': '#F5F0DC',
};

const NEEDS_BORDER = new Set(['White', 'Silver', 'Ivory', 'Cream', 'Beige']);

const ordinal = (n: number) => ['1st', '2nd', '3rd', '4th'][n - 1] ?? `${n}th`;

interface ColorCombo { exterior: string; interior: string; }

export interface VehicleResult {
  make: string; model: string; year: string; trim: string; condition: string;
  fuelType: string; drivetrain: string;
  colorCombos: ColorCombo[];
  exteriorColors: string[];
  interiorColors: string[];
}

interface Props {
  clientZip?: string;
  onComplete: (prefs: VehicleResult) => void;
  onClose: () => void;
}

function ColorSwatch({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  const hex = COLOR_HEX[color] || '#999999';
  const needsBorder = NEEDS_BORDER.has(color);
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        title={color}
        className={`w-12 h-12 rounded-xl transition-all ${
          selected
            ? 'scale-110 shadow-md ring-2 ring-emerald-500 ring-offset-1'
            : `hover:scale-105 hover:ring-2 hover:ring-slate-300 hover:ring-offset-1 ${needsBorder ? 'ring-1 ring-slate-200' : ''}`
        }`}
        style={{ backgroundColor: hex }}
      />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {color}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
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
        <div className="text-xs text-slate-400 italic py-2">Select make &amp; model to see colors</div>
      ) : (
        <>
          {exteriorColors.length > 0 && (
            <div>
              <div className="text-xs text-slate-400 mb-2">Exterior</div>
              <div className="flex flex-wrap gap-2">
                {exteriorColors.map(c => (
                  <ColorSwatch key={c} color={c} selected={combo.exterior === c}
                    onClick={() => onChange({ ...combo, exterior: combo.exterior === c ? '' : c })} />
                ))}
              </div>
              {combo.exterior && (
                <p className="text-xs text-slate-500 mt-1.5">
                  Selected: <span className="font-medium text-slate-700">{combo.exterior}</span>
                </p>
              )}
            </div>
          )}
          {interiorColors.length > 0 && (
            <div>
              <div className="text-xs text-slate-400 mb-2">Interior</div>
              <div className="flex flex-wrap gap-2">
                {interiorColors.map(c => (
                  <ColorSwatch key={c} color={c} selected={combo.interior === c}
                    onClick={() => onChange({ ...combo, interior: combo.interior === c ? '' : c })} />
                ))}
              </div>
              {combo.interior && (
                <p className="text-xs text-slate-500 mt-1.5">
                  Selected: <span className="font-medium text-slate-700">{combo.interior}</span>
                </p>
              )}
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
  const [fuelType, setFuelType] = useState('');
  const [drivetrain, setDrivetrain] = useState('');

  const [colorCombos, setColorCombos] = useState<ColorCombo[]>([
    { exterior: '', interior: '' }, { exterior: '', interior: '' },
    { exterior: '', interior: '' }, { exterior: '', interior: '' },
  ]);
  const [showThird, setShowThird] = useState(false);
  const [showFourth, setShowFourth] = useState(false);

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [drivetrains, setDrivetrains] = useState<string[]>([]);
  const [oemExteriorColors, setOemExteriorColors] = useState<string[]>([]);
  const [oemInteriorColors, setOemInteriorColors] = useState<string[]>([]);
  const [loadingFacets, setLoadingFacets] = useState<Set<string>>(new Set());
  const [trimInfo, setTrimInfo] = useState<any>(null);

  const facetCache = useRef<Record<string, string[]>>({});
  const catalogCache = useRef<any[] | null>(null);

  const applyValues = useCallback((facet: string, values: string[]) => {
    if (facet === 'make') setMakes(values);
    else if (facet === 'model') setModels(values);
    else if (facet === 'trim') setTrims(values);
    else if (facet === 'fuel_type') setFuelTypes(values);
    else if (facet === 'drivetrain') setDrivetrains(values);
    else if (facet === 'base_exterior_color') setOemExteriorColors(values);
    else if (facet === 'base_interior_color') setOemInteriorColors(values);
  }, []);

  const loadFacet = useCallback(async (facet: string, filters: Record<string, string | undefined>) => {
    const cacheKey = `${facet}-${JSON.stringify(filters)}`;
    if (facetCache.current[cacheKey]) {
      applyValues(facet, facetCache.current[cacheKey]);
      return;
    }
    setLoadingFacets(prev => new Set(prev).add(facet));
    try {
      const args: any = { facet };
      for (const [k, v] of Object.entries(filters)) {
        if (v) args[k] = v;
      }
      const result = await dataClient.queries.getVisorFacets(args);
      const values: string[] = parseAppSyncResult(result.data, []);
      facetCache.current[cacheKey] = values;
      applyValues(facet, values);
    } catch (e) {
      console.error('getVisorFacets error:', facet, e);
    } finally {
      setLoadingFacets(prev => { const next = new Set(prev); next.delete(facet); return next; });
    }
  }, [applyValues]);

  // Load makes on mount (new inventory only)
  useEffect(() => {
    loadFacet('make', { condition: 'New' });
  }, [loadFacet]);

  // Cascade: make changed → reload models, clear downstream
  useEffect(() => {
    setModel(''); setTrim(''); setTrimInfo(null);
    setFuelType(''); setDrivetrain('');
    setModels([]); setTrims([]); setFuelTypes([]); setDrivetrains([]);
    setOemExteriorColors([]); setOemInteriorColors([]);
    setColorCombos([{ exterior: '', interior: '' }, { exterior: '', interior: '' },
                    { exterior: '', interior: '' }, { exterior: '', interior: '' }]);
    if (make) loadFacet('model', { make, condition: 'New' });
  }, [make]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cascade: model changed → reload trims, clear downstream
  useEffect(() => {
    setTrim(''); setTrimInfo(null); setTrims([]);
    setFuelType(''); setDrivetrain(''); setFuelTypes([]); setDrivetrains([]);
    setOemExteriorColors([]); setOemInteriorColors([]);
    if (make && model) loadFacet('trim', { make, model, condition: 'New' });
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load fuel types, drivetrains, and base colors when make+model set; refresh on trim change
  useEffect(() => {
    if (!make || !model) return;
    const filters = { make, model, trim: trim || undefined, condition: 'New' };
    loadFacet('fuel_type', filters);
    loadFacet('drivetrain', filters);
    loadFacet('base_exterior_color', filters);
    loadFacet('base_interior_color', filters);
  }, [make, model, trim]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trim info card from VehicleCatalog
  useEffect(() => {
    if (!make || !model || !trim) { setTrimInfo(null); return; }
    (async () => {
      try {
        if (!catalogCache.current) {
          const result = await dataClient.queries.getCatalog({});
          catalogCache.current = parseAppSyncResult(result.data, []);
        }
        const vehicle = catalogCache.current.find(
          (v: any) => v.make?.toLowerCase() === make.toLowerCase()
                   && v.model?.toLowerCase() === model.toLowerCase()
        );
        const found = vehicle?.trims?.find((t: any) => t.name === trim) || null;
        setTrimInfo(found);
      } catch {
        setTrimInfo(null);
      }
    })();
  }, [make, model, trim]);

  const updateCombo = (index: number, combo: ColorCombo) => {
    setColorCombos(prev => { const next = [...prev]; next[index] = combo; return next; });
  };

  const handleSave = () => {
    if (!make || !model) return;
    const count = showFourth ? 4 : showThird ? 3 : 2;
    const activeCombos = colorCombos.slice(0, count).filter(c => c.exterior || c.interior);
    const exteriorColors = [...new Set(activeCombos.map(c => c.exterior).filter(Boolean))];
    const interiorColors = [...new Set(activeCombos.map(c => c.interior).filter(Boolean))];
    onComplete({ make, model, year, trim, condition: 'New', fuelType, drivetrain, colorCombos: activeCombos, exteriorColors, interiorColors });
  };

  const makesLoading = loadingFacets.has('make');
  const modelsLoading = loadingFacets.has('model');
  const trimsLoading = loadingFacets.has('trim');
  const colorsLoading = loadingFacets.has('base_exterior_color') || loadingFacets.has('base_interior_color');
  const summaryParts = [year, make, model, trim, fuelType, drivetrain].filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-6">Vehicle Preferences</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
            <select value={year} onChange={e => setYear(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:border-emerald-500">
              <option value="">Any Year</option>
              {AVAILABLE_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Type</label>
              <select value={fuelType} onChange={e => setFuelType(e.target.value)}
                disabled={!model || fuelTypes.length === 0}
                className="w-full p-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50">
                <option value="">Any Fuel Type</option>
                {fuelTypes.map(ft => <option key={ft} value={ft}>{ft}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Drivetrain</label>
              <select value={drivetrain} onChange={e => setDrivetrain(e.target.value)}
                disabled={!model || drivetrains.length === 0}
                className="w-full p-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50">
                <option value="">Any Drivetrain</option>
                {drivetrains.map(dt => <option key={dt} value={dt}>{dt}</option>)}
              </select>
            </div>
          </div>

          {/* Trim info card */}
          {trimInfo && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-sm space-y-1">
              <div className="font-semibold text-blue-800">{trim}</div>
              {trimInfo.msrp && (
                <div className="text-blue-600">MSRP: <span className="font-medium">${Number(trimInfo.msrp).toLocaleString()}</span></div>
              )}
              {trimInfo.description && (
                <div className="text-blue-600 text-xs">{trimInfo.description}</div>
              )}
              {trimInfo.features?.length > 0 && (
                <div className="text-xs text-blue-500">{(trimInfo.features as string[]).slice(0, 3).join(' · ')}</div>
              )}
            </div>
          )}

          {/* Color preferences */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">
                Color Preferences
                <span className="text-xs text-slate-400 font-normal ml-2">(optional)</span>
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
              {summaryParts.join(' ')} · New
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
