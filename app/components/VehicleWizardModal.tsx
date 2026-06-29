'use client';

import React, { useState, useEffect } from 'react';
import { dataClient } from '@/app/lib/amplify-data';

interface VehicleResult {
  make: string; model: string; year: string; trim: string; condition: string;
}

interface Props {
  clientZip?: string;
  onComplete: (prefs: VehicleResult) => void;
  onClose: () => void;
}

export default function VehicleWizardModal({ clientZip, onComplete, onClose }: Props) {
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [condition, setCondition] = useState('used');

  const [allCatalog, setAllCatalog] = useState<any[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await dataClient.queries.getCatalog({});
        setAllCatalog(JSON.parse(result.data || '[]'));
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

  const handleSave = () => {
    if (!make || !model) return;
    onComplete({ make, model, year, trim, condition });
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
