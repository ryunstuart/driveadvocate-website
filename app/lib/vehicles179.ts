export interface Vehicle179 {
  make: string;
  model: string;
  years: string[];
  gvwr: number;
  category: '179_full' | '179_suv' | '179_truck' | '179_van';
  maxDeduction2026: number;
  notes: string;
}

export const SECTION_179_VEHICLES: Vehicle179[] = [
  { make: 'Ford', model: 'F-150', years: ['2024','2025','2026'], gvwr: 7050, category: '179_truck', maxDeduction2026: 1160000, notes: 'All cab styles qualify' },
  { make: 'Ford', model: 'F-250 Super Duty', years: ['2024','2025','2026'], gvwr: 10000, category: '179_truck', maxDeduction2026: 1160000, notes: 'Full deduction' },
  { make: 'Ford', model: 'F-350 Super Duty', years: ['2024','2025','2026'], gvwr: 11500, category: '179_truck', maxDeduction2026: 1160000, notes: 'Full deduction' },
  { make: 'Chevrolet', model: 'Silverado 1500', years: ['2024','2025','2026'], gvwr: 7100, category: '179_truck', maxDeduction2026: 1160000, notes: 'All cab styles qualify' },
  { make: 'Chevrolet', model: 'Silverado 2500HD', years: ['2024','2025','2026'], gvwr: 10000, category: '179_truck', maxDeduction2026: 1160000, notes: 'Full deduction' },
  { make: 'Chevrolet', model: 'Silverado 3500HD', years: ['2024','2025','2026'], gvwr: 13200, category: '179_truck', maxDeduction2026: 1160000, notes: 'Full deduction' },
  { make: 'GMC', model: 'Sierra 1500', years: ['2024','2025','2026'], gvwr: 7100, category: '179_truck', maxDeduction2026: 1160000, notes: 'All cab styles qualify' },
  { make: 'GMC', model: 'Sierra 2500HD', years: ['2024','2025','2026'], gvwr: 10000, category: '179_truck', maxDeduction2026: 1160000, notes: 'Full deduction' },
  { make: 'RAM', model: '1500', years: ['2024','2025','2026'], gvwr: 7100, category: '179_truck', maxDeduction2026: 1160000, notes: 'All cab styles qualify' },
  { make: 'RAM', model: '2500', years: ['2024','2025','2026'], gvwr: 10000, category: '179_truck', maxDeduction2026: 1160000, notes: 'Full deduction' },
  { make: 'RAM', model: '3500', years: ['2024','2025','2026'], gvwr: 13000, category: '179_truck', maxDeduction2026: 1160000, notes: 'Full deduction' },
  { make: 'Toyota', model: 'Tundra', years: ['2024','2025','2026'], gvwr: 7100, category: '179_truck', maxDeduction2026: 1160000, notes: 'All cab styles qualify' },
  { make: 'Toyota', model: 'Tacoma', years: ['2024','2025','2026'], gvwr: 6100, category: '179_truck', maxDeduction2026: 1160000, notes: 'Verify GVWR by trim' },
  { make: 'Nissan', model: 'Titan', years: ['2024','2025','2026'], gvwr: 7100, category: '179_truck', maxDeduction2026: 1160000, notes: 'All cab styles qualify' },

  { make: 'Chevrolet', model: 'Tahoe', years: ['2024','2025','2026'], gvwr: 7400, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'Chevrolet', model: 'Suburban', years: ['2024','2025','2026'], gvwr: 7900, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'GMC', model: 'Yukon', years: ['2024','2025','2026'], gvwr: 7400, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'GMC', model: 'Yukon XL', years: ['2024','2025','2026'], gvwr: 7900, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'Ford', model: 'Expedition', years: ['2024','2025','2026'], gvwr: 7700, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'Ford', model: 'Expedition Max', years: ['2024','2025','2026'], gvwr: 8100, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'Toyota', model: 'Sequoia', years: ['2024','2025','2026'], gvwr: 7385, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'Toyota', model: 'Land Cruiser', years: ['2024','2025','2026'], gvwr: 6834, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'Nissan', model: 'Armada', years: ['2024','2025','2026'], gvwr: 7300, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'Cadillac', model: 'Escalade', years: ['2024','2025','2026'], gvwr: 7900, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'Lincoln', model: 'Navigator', years: ['2024','2025','2026'], gvwr: 7700, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'Jeep', model: 'Grand Wagoneer', years: ['2024','2025','2026'], gvwr: 7900, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'BMW', model: 'X5', years: ['2024','2025','2026'], gvwr: 6724, category: '179_suv', maxDeduction2026: 28900, notes: 'Verify GVWR by trim' },
  { make: 'BMW', model: 'X7', years: ['2024','2025','2026'], gvwr: 7143, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'Mercedes-Benz', model: 'GLS', years: ['2024','2025','2026'], gvwr: 7165, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'Mercedes-Benz', model: 'G-Class', years: ['2024','2025','2026'], gvwr: 6944, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'Audi', model: 'Q7', years: ['2024','2025','2026'], gvwr: 6834, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },
  { make: 'Porsche', model: 'Cayenne', years: ['2024','2025','2026'], gvwr: 6724, category: '179_suv', maxDeduction2026: 28900, notes: 'Verify GVWR by trim' },
  { make: 'Land Rover', model: 'Defender', years: ['2024','2025','2026'], gvwr: 7055, category: '179_suv', maxDeduction2026: 28900, notes: 'SUV cap applies' },

  { make: 'Ford', model: 'Transit', years: ['2024','2025','2026'], gvwr: 8600, category: '179_van', maxDeduction2026: 1160000, notes: 'All configurations qualify' },
  { make: 'Ford', model: 'Transit-250', years: ['2024','2025','2026'], gvwr: 8600, category: '179_van', maxDeduction2026: 1160000, notes: 'Full deduction' },
  { make: 'Ford', model: 'Transit-350', years: ['2024','2025','2026'], gvwr: 11500, category: '179_van', maxDeduction2026: 1160000, notes: 'Full deduction' },
  { make: 'Mercedes-Benz', model: 'Sprinter', years: ['2024','2025','2026'], gvwr: 8550, category: '179_van', maxDeduction2026: 1160000, notes: 'Full deduction' },
  { make: 'Chevrolet', model: 'Express', years: ['2024','2025','2026'], gvwr: 8600, category: '179_van', maxDeduction2026: 1160000, notes: 'Full deduction' },
  { make: 'GMC', model: 'Savana', years: ['2024','2025','2026'], gvwr: 8600, category: '179_van', maxDeduction2026: 1160000, notes: 'Full deduction' },
  { make: 'RAM', model: 'ProMaster', years: ['2024','2025','2026'], gvwr: 8550, category: '179_van', maxDeduction2026: 1160000, notes: 'Full deduction' },
];

export function check179Eligibility(make: string, model: string, year: string): Vehicle179 | null {
  return SECTION_179_VEHICLES.find(v =>
    v.make.toLowerCase() === make.toLowerCase() &&
    v.model.toLowerCase() === model.toLowerCase() &&
    v.years.includes(year) &&
    v.maxDeduction2026 > 0
  ) || null;
}

export function calculate179Savings(
  vehiclePrice: number, businessPercent: number, taxRate: number, vehicle179: Vehicle179,
): { eligibleAmount: number; deductionAmount: number; taxSavings: number; effectiveCost: number } {
  const businessPortion = vehiclePrice * (businessPercent / 100);
  const eligibleAmount = Math.min(businessPortion, vehicle179.maxDeduction2026);
  const taxSavings = Math.round(eligibleAmount * (taxRate / 100));
  return { eligibleAmount, deductionAmount: eligibleAmount, taxSavings, effectiveCost: vehiclePrice - taxSavings };
}
