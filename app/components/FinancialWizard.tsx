'use client';

import React, { useState, useMemo } from 'react';
import { check179Eligibility, calculate179Savings } from '@/app/lib/vehicles179';

const CREDIT_TIERS: Record<number, { label: string; newAPR: number; usedAPR: number }> = {
  1: { label: 'Excellent (750+)', newAPR: 6.49, usedAPR: 7.49 },
  2: { label: 'Good (700-749)', newAPR: 7.99, usedAPR: 8.99 },
  3: { label: 'Fair (650-699)', newAPR: 10.99, usedAPR: 12.99 },
  4: { label: 'Below 650', newAPR: 14.99, usedAPR: 18.99 },
};

interface Props {
  clientName: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehiclePrice?: number;
  onClose: () => void;
}

export default function FinancialWizard({ clientName, vehicleMake, vehicleModel, vehicleYear, vehiclePrice, onClose }: Props) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [creditTier, setCreditTier] = useState<number | null>(null);
  const [downPayment, setDownPayment] = useState(0);
  const [hasTrade, setHasTrade] = useState(false);
  const [tradeValue, setTradeValue] = useState(0);
  const [tradeOwed, setTradeOwed] = useState(0);
  const [annualMiles, setAnnualMiles] = useState(0);
  const [keepDuration, setKeepDuration] = useState(0);
  const [businessUse, setBusinessUse] = useState(false);
  const [businessPercent, setBusinessPercent] = useState(50);
  const [taxBracket, setTaxBracket] = useState(22);
  const [wantsMods, setWantsMods] = useState(false);
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [wantsOwnership, setWantsOwnership] = useState<boolean | null>(null);

  const tradeEquity = tradeValue - tradeOwed;
  const effectiveDown = downPayment + Math.max(0, tradeEquity);
  const price = vehiclePrice || 45000;

  const vehicle179 = vehicleMake && vehicleModel && vehicleYear
    ? check179Eligibility(vehicleMake, vehicleModel, vehicleYear) : null;

  const recommendation = useMemo(() => {
    if (!creditTier || !annualMiles || !keepDuration) return null;
    let leaseScore = 0, buyScore = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];

    if (annualMiles < 10000) { leaseScore += 3; reasons.push('Low mileage favors leasing'); }
    else if (annualMiles > 15000) { buyScore += 3; reasons.push('High mileage — lease fees would add up'); }
    else { buyScore += 1; }

    if (keepDuration <= 3) { leaseScore += 3; reasons.push('Short keep duration aligns with lease terms'); }
    else if (keepDuration > 5) { buyScore += 3; reasons.push(`Keeping ${keepDuration}+ years — buy to maximize value`); }

    if (creditTier === 1) { leaseScore += 2; reasons.push('Tier 1 credit unlocks best lease rates'); }
    if (creditTier >= 3) { buyScore += 2; reasons.push('Credit union financing may beat lease rates'); }
    if (creditTier === 4) { buyScore += 3; warnings.push('Lease may be difficult to qualify — focus on purchase'); }

    if (tradeEquity < 0) { buyScore += 5; warnings.push(`Negative equity $${Math.abs(tradeEquity).toLocaleString()} — never roll into a lease`); }
    if (wantsMods) { buyScore += 3; reasons.push('Modifications not allowed on leased vehicles'); }
    if (wantsOwnership) { buyScore += 3; reasons.push('Prefers ownership — buy builds equity'); }
    if (primaryGoal === 'lowest_payment') leaseScore += 2;
    if (primaryGoal === 'best_long_term') buyScore += 2;
    if (businessUse && businessPercent > 50) { leaseScore += 2; reasons.push('Business use: simpler lease deductions'); }

    const rec = leaseScore > buyScore ? 'LEASE' : 'BUY';
    const diff = Math.abs(leaseScore - buyScore);
    const confidence = diff >= 5 ? 'STRONG' : diff >= 3 ? 'MODERATE' : 'SLIGHT';
    return { rec, confidence, leaseScore, buyScore, reasons, warnings };
  }, [creditTier, annualMiles, keepDuration, tradeEquity, wantsMods, wantsOwnership, primaryGoal, businessUse, businessPercent]);

  const payments = useMemo(() => {
    if (!creditTier) return null;
    const tier = CREDIT_TIERS[creditTier];
    const loan = price - effectiveDown;
    const r = tier.newAPR / 100 / 12;
    const n = 60;
    const buyPmt = loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const residual = price * 0.55;
    const dep = (price - residual) / 36;
    const mf = creditTier === 1 ? 0.00125 : creditTier === 2 ? 0.00175 : 0.0025;
    const leasePmt = dep + (price + residual) * mf;
    return { buy: Math.round(buyPmt), lease: Math.round(leasePmt), apr: tier.newAPR };
  }, [creditTier, price, effectiveDown]);

  const tax179 = vehicle179 && businessUse
    ? calculate179Savings(price, businessPercent, taxBracket, vehicle179) : null;

  const btnClass = (selected: boolean) => `p-4 rounded-2xl border-2 text-left transition cursor-pointer ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-900 text-white px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Financial Analysis</h2>
              <p className="text-slate-400 text-sm mt-1">{clientName}{vehicleMake ? ` · ${vehicleYear} ${vehicleMake} ${vehicleModel}` : ''}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-slate-400 text-xs">Step {Math.min(step, totalSteps)} of {totalSteps}</div>
                <div className="w-24 bg-slate-700 rounded-full h-1.5 mt-1">
                  <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${(Math.min(step, totalSteps) / totalSteps) * 100}%` }} />
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Step 1 — Credit & Buying Power */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Credit & Buying Power</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Credit score range?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { tier: 1, label: 'Excellent', range: '750+' },
                    { tier: 2, label: 'Good', range: '700–749' },
                    { tier: 3, label: 'Fair', range: '650–699' },
                    { tier: 4, label: 'Below Fair', range: 'Under 650' },
                  ].map(t => (
                    <button key={t.tier} type="button" onClick={() => setCreditTier(t.tier)} className={btnClass(creditTier === t.tier)}>
                      <div className="font-semibold text-sm">{t.label}</div>
                      <div className="text-xs text-slate-500">{t.range}</div>
                      {creditTier === t.tier && <div className="text-xs text-emerald-600 mt-1">Est. APR: {CREDIT_TIERS[t.tier].newAPR}%</div>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Down payment?</label>
                <div className="grid grid-cols-3 gap-3">
                  {[{ v: 0, l: '$0' }, { v: 2500, l: '$1k–$3k' }, { v: 5000, l: '$3k–$7k' }, { v: 10000, l: '$7k–$15k' }, { v: 20000, l: '$15k+' }].map(o => (
                    <button key={o.v} type="button" onClick={() => setDownPayment(o.v)} className={`p-3 rounded-2xl border-2 text-center text-sm transition ${downPayment === o.v ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>{o.l}</button>
                  ))}
                  <button type="button" onClick={() => setHasTrade(!hasTrade)} className={`p-3 rounded-2xl border-2 text-center text-sm transition ${hasTrade ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>Trade-In</button>
                </div>
              </div>
              {hasTrade && (
                <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Trade-In Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-slate-600">Estimated value</label><input type="number" placeholder="$15,000" value={tradeValue || ''} onChange={e => setTradeValue(Number(e.target.value))} className="w-full p-3 border border-slate-200 rounded-xl text-sm mt-1" /></div>
                    <div><label className="text-xs text-slate-600">Amount owed</label><input type="number" placeholder="$0" value={tradeOwed || ''} onChange={e => setTradeOwed(Number(e.target.value))} className="w-full p-3 border border-slate-200 rounded-xl text-sm mt-1" /></div>
                  </div>
                  {tradeValue > 0 && (
                    <div className={`p-3 rounded-xl text-sm font-medium ${tradeEquity >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {tradeEquity >= 0 ? `✓ Positive equity: +$${tradeEquity.toLocaleString()}` : `⚠ Negative equity: -$${Math.abs(tradeEquity).toLocaleString()}`}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Usage */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Usage Profile</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Annual miles?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: 8000, l: 'Under 10k', s: 'Lease friendly' }, { v: 11000, l: '10k–12k', s: 'Either works' }, { v: 13500, l: '12k–15k', s: 'Lean buy' }, { v: 20000, l: '15k+', s: 'Buy recommended' }].map(o => (
                    <button key={o.v} type="button" onClick={() => setAnnualMiles(o.v)} className={btnClass(annualMiles === o.v)}>
                      <div className="font-semibold text-sm">{o.l}</div>
                      <div className="text-xs text-slate-500">{o.s}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">How long do you keep vehicles?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: 2, l: '1–3 years' }, { v: 4, l: '3–5 years' }, { v: 6, l: '5–8 years' }, { v: 10, l: '8+ years' }].map(o => (
                    <button key={o.v} type="button" onClick={() => setKeepDuration(o.v)} className={btnClass(keepDuration === o.v)}>
                      <div className="font-semibold text-sm">{o.l}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Business use?</label>
                <div className="grid grid-cols-3 gap-3">
                  {[{ bu: false, bp: 0, l: 'Personal only' }, { bu: true, bp: 50, l: 'Partial business' }, { bu: true, bp: 80, l: 'Primarily business' }].map((o, i) => (
                    <button key={i} type="button" onClick={() => { setBusinessUse(o.bu); setBusinessPercent(o.bp); }} className={`p-3 rounded-2xl border-2 text-center text-sm transition ${businessUse === o.bu && businessPercent === o.bp ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>{o.l}</button>
                  ))}
                </div>
                {businessUse && vehicle179 && (
                  <div className="mt-3 bg-blue-50 rounded-2xl p-3 text-sm text-blue-700">
                    💼 This vehicle qualifies for Section 179 deduction — {vehicle179.category === '179_suv' ? `capped at $${vehicle179.maxDeduction2026.toLocaleString()}` : 'full deduction available'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Plans to modify?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setWantsMods(false)} className={btnClass(!wantsMods)}><div className="font-semibold text-sm">No modifications</div></button>
                  <button type="button" onClick={() => setWantsMods(true)} className={`p-4 rounded-2xl border-2 text-left transition ${wantsMods ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}><div className="font-semibold text-sm">Yes — mods planned</div><div className="text-xs text-amber-600">Must buy — leases prohibit mods</div></button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Goals */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Financial Goals</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Primary goal?</label>
                <div className="space-y-2">
                  {[{ v: 'lowest_payment', l: 'Lowest monthly payment' }, { v: 'build_equity', l: 'Build equity / ownership' }, { v: 'best_long_term', l: 'Best long-term value' }, { v: 'new_car_often', l: 'New vehicle every 2-3 years' }, { v: 'tax_advantage', l: 'Maximize tax advantages' }].map(o => (
                    <button key={o.v} type="button" onClick={() => setPrimaryGoal(o.v)} className={`w-full ${btnClass(primaryGoal === o.v)}`}><div className="font-semibold text-sm">{o.l}</div></button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Monthly payment range?</label>
                <div className="grid grid-cols-3 gap-3">
                  {[{ v: 300, l: 'Under $300' }, { v: 400, l: '$300–$500' }, { v: 600, l: '$500–$700' }, { v: 850, l: '$700–$1k' }, { v: 1200, l: '$1k+' }, { v: 0, l: 'Flexible' }].map(o => (
                    <button key={o.v} type="button" onClick={() => setMonthlyBudget(o.v)} className={`p-3 rounded-2xl border-2 text-center text-sm transition ${monthlyBudget === o.v ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>{o.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Importance of owning outright?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setWantsOwnership(true)} className={btnClass(wantsOwnership === true)}><div className="font-semibold text-sm">Very important</div></button>
                  <button type="button" onClick={() => setWantsOwnership(false)} className={btnClass(wantsOwnership === false)}><div className="font-semibold text-sm">Not important</div></button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Results */}
          {step === 4 && recommendation && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Analysis Results</h3>
              <div className={`rounded-3xl p-6 ${recommendation.rec === 'BUY' ? 'bg-emerald-900' : 'bg-blue-900'} text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm opacity-75 mb-1">Recommendation</div>
                    <div className="text-3xl font-bold">{recommendation.rec === 'BUY' ? 'BUY' : 'LEASE'}</div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-bold ${recommendation.confidence === 'STRONG' ? 'bg-white text-emerald-900' : 'bg-white/20'}`}>{recommendation.confidence}</div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm opacity-75 w-8">BUY</span>
                  <div className="flex-1 bg-white/20 rounded-full h-2">
                    <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${(recommendation.buyScore / (recommendation.buyScore + recommendation.leaseScore)) * 100}%` }} />
                  </div>
                  <span className="text-sm opacity-75 w-12 text-right">LEASE</span>
                </div>
                <div className="space-y-1">
                  {recommendation.reasons.map((r, i) => <div key={i} className="flex items-center gap-2 text-sm opacity-90"><span>✓</span>{r}</div>)}
                </div>
              </div>

              {recommendation.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                  {recommendation.warnings.map((w, i) => <div key={i} className="flex items-start gap-2 text-sm text-amber-800"><span>⚠</span>{w}</div>)}
                </div>
              )}

              {payments && (
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-5 rounded-2xl border-2 ${recommendation.rec === 'BUY' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                    <div className="text-sm font-semibold text-slate-600 mb-1">Purchase</div>
                    <div className="text-3xl font-bold">${payments.buy.toLocaleString()}<span className="text-base font-normal text-slate-500">/mo</span></div>
                    <div className="text-xs text-slate-500 mt-1">60mo · {payments.apr}% APR</div>
                    <div className="text-xs text-emerald-600 mt-1">Vehicle yours at end</div>
                  </div>
                  <div className={`p-5 rounded-2xl border-2 ${recommendation.rec === 'LEASE' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                    <div className="text-sm font-semibold text-slate-600 mb-1">Lease (est.)</div>
                    <div className="text-3xl font-bold">${payments.lease.toLocaleString()}<span className="text-base font-normal text-slate-500">/mo</span></div>
                    <div className="text-xs text-slate-500 mt-1">36mo · 12k mi/yr</div>
                    <div className="text-xs text-amber-600 mt-1">No equity at end</div>
                  </div>
                </div>
              )}

              {tax179 && businessUse && (
                <div className="border border-emerald-200 rounded-2xl p-5 bg-emerald-50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-xs">179</span>
                    <h4 className="font-semibold text-emerald-800">Section 179 Tax Savings</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-600">Vehicle price</span><span>${price.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Business use ({businessPercent}%)</span><span>${Math.round(price * businessPercent / 100).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Eligible deduction</span><span className="font-semibold">${tax179.deductionAmount.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Tax savings ({taxBracket}% bracket)</span><span className="font-semibold text-emerald-700">${tax179.taxSavings.toLocaleString()}</span></div>
                    <div className="flex justify-between border-t border-emerald-200 pt-2 font-bold"><span>Effective cost after deduction</span><span className="text-emerald-800">${tax179.effectiveCost.toLocaleString()}</span></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">* Consult a tax professional. Based on {taxBracket}% bracket.</p>
                </div>
              )}

              <p className="text-xs text-slate-400 text-center">Estimates only. Payment calculations assume standard terms. Consult your financial advisor.</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            {step > 1 && <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3 border border-slate-300 rounded-2xl font-medium hover:bg-slate-50 transition text-sm">Back</button>}
            {step < totalSteps ? (
              <button onClick={() => setStep(s => s + 1)} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition text-sm">Continue</button>
            ) : (
              <button onClick={onClose} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition text-sm">Done</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
