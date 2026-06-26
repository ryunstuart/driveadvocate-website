export const HOLDBACK_PERCENT: Record<string, number> = {
  'Ford': 0.03, 'Chevrolet': 0.03, 'GMC': 0.03, 'Buick': 0.03, 'Cadillac': 0.03,
  'RAM': 0.03, 'Jeep': 0.03, 'Dodge': 0.03, 'Chrysler': 0.03,
  'Toyota': 0.02, 'Honda': 0.025, 'Nissan': 0.025,
  'Hyundai': 0.02, 'Kia': 0.02, 'Mazda': 0.02, 'Subaru': 0.02, 'Volkswagen': 0.02,
  'BMW': 0.01, 'Mercedes-Benz': 0.01, 'Audi': 0.01,
  'Lexus': 0.01, 'Acura': 0.01, 'Infiniti': 0.01,
  'Lincoln': 0.02, 'Volvo': 0.01, 'Porsche': 0.01,
  'Tesla': 0, 'MINI': 0.01, 'Mitsubishi': 0.02,
};

export interface PricingIntelligence {
  msrp: number;
  invoice: number;
  holdback: number;
  trueDealerCost: number;
  marketAverage: number;
  targetPrice: number;
  walkAwayPrice: number;
  bestCasePrice: number;
  totalIncentives: number;
  effectiveTargetPrice: number;
  marketDaysSupply: number;
  unitsInRadius: number;
  negotiationLeverage: 'HIGH' | 'MEDIUM' | 'LOW';
  leverageReasons: string[];
}

export function calculatePricing(
  make: string, msrp: number, invoice: number, marketAverage: number,
  marketDaysSupply: number, unitsInRadius: number, totalIncentives: number,
): PricingIntelligence {
  const holdbackPercent = HOLDBACK_PERCENT[make] || 0.02;
  const holdback = Math.round(msrp * holdbackPercent);
  const trueDealerCost = invoice - holdback;
  const targetPrice = trueDealerCost + 500;
  const walkAwayPrice = Math.round(marketAverage * 0.97);
  const bestCasePrice = trueDealerCost;
  const effectiveTargetPrice = targetPrice - totalIncentives;

  const leverageReasons: string[] = [];
  let leverageScore = 0;

  if (marketDaysSupply > 60) {
    leverageReasons.push(`${marketDaysSupply} days market supply — slow seller`);
    leverageScore += 3;
  } else if (marketDaysSupply > 30) {
    leverageReasons.push(`${marketDaysSupply} days market supply — above average`);
    leverageScore += 1;
  }

  if (unitsInRadius > 15) {
    leverageReasons.push(`${unitsInRadius} units within radius — dealers competing`);
    leverageScore += 2;
  }

  const isEndOfMonth = new Date().getDate() >= 25;
  const isEndOfQuarter = [2, 5, 8, 11].includes(new Date().getMonth()) && isEndOfMonth;

  if (isEndOfQuarter) {
    leverageReasons.push('End of quarter — maximum dealer pressure to hit quotas');
    leverageScore += 3;
  } else if (isEndOfMonth) {
    leverageReasons.push('End of month — dealers motivated to hit monthly targets');
    leverageScore += 2;
  }

  if (totalIncentives > 1500) {
    leverageReasons.push(`$${totalIncentives.toLocaleString()} in stackable incentives available`);
    leverageScore += 1;
  }

  const negotiationLeverage: 'HIGH' | 'MEDIUM' | 'LOW' =
    leverageScore >= 4 ? 'HIGH' : leverageScore >= 2 ? 'MEDIUM' : 'LOW';

  return {
    msrp, invoice, holdback, trueDealerCost, marketAverage, targetPrice,
    walkAwayPrice, bestCasePrice, totalIncentives, effectiveTargetPrice,
    marketDaysSupply, unitsInRadius, negotiationLeverage, leverageReasons,
  };
}

export function generateNegotiationScript(
  dealerName: string, clientVehicle: string,
  pricing: PricingIntelligence, incentives: any[],
): string {
  const incentivesList = incentives
    .filter(i => i.canStack)
    .map(i => `$${i.amount.toLocaleString()} ${i.type}`)
    .join(', ');

  return `Hi, I'm calling on behalf of a client who is interested in a ${clientVehicle}.

I have current market data showing ${pricing.unitsInRadius} units available within our search radius and ${pricing.marketDaysSupply} days of market supply on this model.

We're looking for an out-the-door price of $${pricing.effectiveTargetPrice.toLocaleString()}, which includes the available manufacturer incentives (${incentivesList || 'current rebates'}).

Can ${dealerName} compete for this deal today?`;
}

export function getBestCallTime(): { day: string; reason: string } {
  const day = new Date().getDay();
  const date = new Date().getDate();
  const month = new Date().getMonth();
  const isEndOfMonth = date >= 25;
  const isEndOfQuarter = [2, 5, 8, 11].includes(month) && isEndOfMonth;

  if (isEndOfQuarter) return { day: 'Today', reason: 'End of quarter — maximum pressure on dealers' };
  if (isEndOfMonth) return { day: 'Today', reason: 'End of month — dealers need to hit quotas' };
  if (day === 2 || day === 3) return { day: 'Today', reason: 'Tuesday/Wednesday — slowest dealer days, more negotiating time' };
  if (day === 6 || day === 0) return { day: 'Tuesday or Wednesday', reason: 'Avoid weekends — dealers are busy and less flexible' };
  return { day: 'Tuesday or Wednesday', reason: 'Midweek calls get more dealer attention' };
}
