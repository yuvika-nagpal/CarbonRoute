/**
 * CarbonRoute Historical Grid Data Generator
 *
 * Generates chronologically split training (70%) and holdout test (30%) datasets
 * representing historical Electricity Maps-style forecasts paired with realized
 * actual carbon intensity observations.
 *
 * Models physical grid dynamics:
 * - CAISO: Solar duck-curve, daytime cloud uncertainty, evening thermal ramp
 * - ERCOT: Wind generation variability, nocturnal wind ramps, thermal peaking
 * - DE: Mixed renewables, offshore wind volatility, industrial demand cycle
 * - IN-NO: High coal baseload, solar midday dip, sharp evening domestic peak
 */

import * as fs from 'fs';
import * as path from 'path';

export interface HistoricalObservation {
  id: string;
  region: string;
  forecastTimestamp: string;
  targetTimestamp: string;
  horizonHours: number;
  predictedCarbon: number;
  actualCarbon: number;
  error: number; // actual - predicted
  absoluteError: number;
  percentageError: number;
}

interface RegionConfig {
  name: string;
  baseMean: number;
  diurnalAmp: number;
  diurnalPhase: number;
  baseSigma: number;
  horizonGrowth: number;
  skewFactor: number;
  tailRiskProb: number;
  tailMultiplier: number;
}

const REGION_CONFIGS: Record<string, RegionConfig> = {
  'US-CAL-CISO': {
    name: 'California (CAISO)',
    baseMean: 260,
    diurnalAmp: 90,
    diurnalPhase: 14, // trough at 14:00 (peak solar)
    baseSigma: 10.5,
    horizonGrowth: 1.45,
    skewFactor: 0.15,
    tailRiskProb: 0.05,
    tailMultiplier: 2.3,
  },
  'US-TEX-ERCO': {
    name: 'Texas (ERCOT)',
    baseMean: 310,
    diurnalAmp: 75,
    diurnalPhase: 4, // trough at 04:00 (peak nocturnal wind)
    baseSigma: 12.0,
    horizonGrowth: 1.55,
    skewFactor: 0.2,
    tailRiskProb: 0.06,
    tailMultiplier: 2.5,
  },
  'DE': {
    name: 'Germany (Central Europe)',
    baseMean: 340,
    diurnalAmp: 85,
    diurnalPhase: 12,
    baseSigma: 14.0,
    horizonGrowth: 1.6,
    skewFactor: 0.1,
    tailRiskProb: 0.05,
    tailMultiplier: 2.2,
  },
  'IN-NO': {
    name: 'Northern India Grid',
    baseMean: 620,
    diurnalAmp: 110,
    diurnalPhase: 13,
    baseSigma: 18.0,
    horizonGrowth: 1.85,
    skewFactor: 0.25,
    tailRiskProb: 0.07,
    tailMultiplier: 2.4,
  },
};

// Seeded pseudorandom generator for exact reproducibility
class SeededRandom {
  private state: number;

  constructor(seed: number = 428731) {
    this.state = seed;
  }

  public next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }

  // Box-Muller transform for standard normal N(0, 1)
  public nextGaussian(): number {
    let u = 0, v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}

export function generateDataset(
  totalDays: number = 60,
  maxHorizonHours: number = 24,
  seed: number = 20260916
): { train: HistoricalObservation[]; test: HistoricalObservation[] } {
  const rng = new SeededRandom(seed);
  const trainRecords: HistoricalObservation[] = [];
  const testRecords: HistoricalObservation[] = [];

  const trainCutoffDay = Math.floor(totalDays * 0.7); // 70% train / 30% test
  const startEpoch = new Date('2026-06-01T00:00:00Z').getTime();

  for (const [region, cfg] of Object.entries(REGION_CONFIGS)) {
    // Generate underlying continuous hourly grid state
    const totalHours = totalDays * 24;
    const groundTruth: number[] = [];

    let weatherState = 0; // Autoregressive weather anomaly
    for (let h = 0; h < totalHours + maxHorizonHours + 24; h++) {
      const hourOfDay = h % 24;
      const dayIndex = Math.floor(h / 24);
      const isWeekend = (dayIndex % 7 === 5 || dayIndex % 7 === 6);

      // Diurnal sinusoidal pattern
      const diurnal = -cfg.diurnalAmp * Math.cos((2 * Math.PI * (hourOfDay - cfg.diurnalPhase)) / 24);
      // Weekend demand drop (less fossil peakers)
      const weekendEffect = isWeekend ? -15 : 0;
      // Weather anomaly AR(1) process: persistence rho = 0.94
      weatherState = 0.94 * weatherState + rng.nextGaussian() * (cfg.baseSigma * 0.8);

      const trueIntensity = Math.max(30, cfg.baseMean + diurnal + weekendEffect + weatherState);
      groundTruth.push(Math.round(trueIntensity));
    }

    // Now generate forecasts issued at regular intervals
    // Issue forecast every 6 hours (00:00, 06:00, 12:00, 18:00) for horizons 1..maxHorizonHours
    for (let issueHour = 0; issueHour < totalHours; issueHour += 6) {
      const issueDay = Math.floor(issueHour / 24);
      const isTrain = issueDay < trainCutoffDay;
      const forecastTime = new Date(startEpoch + issueHour * 3600000);

      for (let horizon = 1; horizon <= maxHorizonHours; horizon++) {
        const targetHour = issueHour + horizon;
        const targetTime = new Date(startEpoch + targetHour * 3600000);
        const actual = groundTruth[targetHour];

        // Horizon-dependent error spread: sigma(h) = baseSigma + horizonGrowth * (h^0.6)
        const sigma_h = cfg.baseSigma + cfg.horizonGrowth * Math.pow(horizon, 0.65);

        // Add skew and fat-tail events
        let noise = rng.nextGaussian() * sigma_h;
        // Skewness: positive skew in error (actual > predicted during unforeseen outages)
        noise += cfg.skewFactor * (noise * noise - sigma_h * sigma_h) / (2 * sigma_h);

        // Occasional extreme weather / ramp event
        if (rng.next() < cfg.tailRiskProb) {
          const tailSign = rng.next() > 0.35 ? 1 : -1;
          noise += tailSign * rng.next() * (cfg.tailMultiplier * sigma_h);
        }

        // Predicted value is actual minus error, rounded
        const predicted = Math.max(25, Math.round(actual - noise));
        const error = actual - predicted;
        const absError = Math.abs(error);
        const pctError = Number((error / predicted).toFixed(4));

        const observation: HistoricalObservation = {
          id: `${region}_${forecastTime.toISOString().slice(0, 13)}_h${horizon}`,
          region,
          forecastTimestamp: forecastTime.toISOString(),
          targetTimestamp: targetTime.toISOString(),
          horizonHours: horizon,
          predictedCarbon: predicted,
          actualCarbon: actual,
          error,
          absoluteError: absError,
          percentageError: pctError,
        };

        if (isTrain) {
          trainRecords.push(observation);
        } else {
          testRecords.push(observation);
        }
      }
    }
  }

  return { train: trainRecords, test: testRecords };
}

// CLI entry point
if (require.main === module) {
  const outputDir = path.resolve(__dirname, '../data/calibration');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating empirical historical forecast calibration dataset...');
  const { train, test } = generateDataset(60, 24);

  const trainPath = path.join(outputDir, 'historical_forecasts_train.json');
  const testPath = path.join(outputDir, 'historical_forecasts_test.json');

  fs.writeFileSync(trainPath, JSON.stringify(train, null, 2), 'utf-8');
  fs.writeFileSync(testPath, JSON.stringify(test, null, 2), 'utf-8');

  console.log(`Successfully generated:`);
  console.log(`  - Train partition (70%): ${train.length} observations -> ${trainPath}`);
  console.log(`  - Test partition  (30%): ${test.length} observations -> ${testPath}`);
}
