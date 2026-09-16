/**
 * CarbonRoute Uncertainty & Calibration Service
 *
 * Provides data-driven empirical calibration of carbon intensity forecast uncertainty
 * using historical forecast vs. realized outcomes.
 *
 * Mathematical Foundations:
 * 1. Horizon-dependent error spread: sigma(h) = sqrt( 1/(N-1) * sum((e_i - mu)^2) )
 * 2. Empirical Quantiles: q_alpha(h) computed from ordered residuals without distributional assumptions
 * 3. Normality Diagnostics: Fisher-Pearson skewness, excess kurtosis, and Jarque-Bera statistic
 * 4. Holdout Validation:
 *    - Empirical coverage vs nominal confidence (e.g. 95% nominal vs realized coverage)
 *    - Brier score for deadline breach events: BS = 1/M * sum((P_i - O_i)^2)
 *    - Expected Calibration Error (ECE) across 10 probability bins
 *    - Reliability diagram calibration curve points (P_b, O_b)
 */

import * as fs from 'fs';
import * as path from 'path';

export interface HorizonCalibratedStats {
  horizonHours: number;
  sampleCount: number;
  meanError: number; // bias: actual - predicted
  stdDev: number; // sample standard deviation
  mae: number; // mean absolute error
  rmse: number; // root mean square error
  quantiles: {
    q025: number;
    q05: number;
    q10: number;
    q25: number;
    q50: number;
    q75: number;
    q90: number;
    q95: number;
    q975: number;
  };
  skewness: number;
  kurtosis: number;
  jarqueBeraStat: number;
  isGaussian: boolean;
}

export interface RegionCalibratedModel {
  region: string;
  horizons: Record<number, HorizonCalibratedStats>;
  aggregateStats: {
    totalSamples: number;
    overallMae: number;
    overallRmse: number;
    overallBias: number;
  };
}

export interface UncertaintyModelArtifact {
  version: string;
  modelType: string;
  calibrationTimestamp: string;
  trainingSamples: number;
  regions: Record<string, RegionCalibratedModel>;
  fallbackProfile: Record<number, HorizonCalibratedStats>;
  description: string;
}

export interface ReliabilityBin {
  binIndex: number;
  binStart: number;
  binEnd: number;
  sampleCount: number;
  meanForecastProb: number;
  observedFreq: number;
  calibrationError: number;
}

export interface EvaluationReport {
  version: string;
  evaluationTimestamp: string;
  testSamples: number;
  overallMetrics: {
    mae: number;
    rmse: number;
    meanBias: number;
  };
  coverageMetrics: {
    nominal95_gaussian: number;
    nominal95_empiricalQuantile: number;
    nominal90_gaussian: number;
    nominal90_empiricalQuantile: number;
    nominal80_gaussian: number;
    nominal80_empiricalQuantile: number;
  };
  brierScore: {
    overall: number;
    regional: Record<string, number>;
  };
  expectedCalibrationError: {
    ece: number; // Expected Calibration Error
    bins: ReliabilityBin[];
  };
  regionalBreakdown: Record<
    string,
    {
      sampleCount: number;
      mae: number;
      rmse: number;
      bias: number;
      coverage95Gaussian: number;
      coverage95Quantile: number;
      brierScore: number;
    }
  >;
}

export class CalibrationService {
  private static modelCache: UncertaintyModelArtifact | null = null;
  private static reportCache: EvaluationReport | null = null;

  public static getModelPath(): string {
    return path.resolve(__dirname, '../../models/uncertainty_model.json');
  }

  public static getReportPath(): string {
    return path.resolve(__dirname, '../../models/calibration_report.json');
  }

  public static getTrainDataPath(): string {
    return path.resolve(__dirname, '../../data/calibration/historical_forecasts_train.json');
  }

  public static getTestDataPath(): string {
    return path.resolve(__dirname, '../../data/calibration/historical_forecasts_test.json');
  }

  /**
   * Calculates percentile from sorted array using linear interpolation (type 7)
   */
  public static calculatePercentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    if (sorted.length === 1) return sorted[0];
    const index = p * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return Number((sorted[lower] * (1 - weight) + sorted[upper] * weight).toFixed(2));
  }

  /**
   * Fits empirical statistics for a set of forecast errors
   */
  public static fitDistribution(errors: number[], horizon: number): HorizonCalibratedStats {
    const N = errors.length;
    if (N === 0) {
      throw new Error(`Cannot fit distribution: empty sample for horizon ${horizon}`);
    }

    const sum = errors.reduce((a, b) => a + b, 0);
    const meanError = Number((sum / N).toFixed(2));

    const sumSqDiff = errors.reduce((acc, e) => acc + Math.pow(e - meanError, 2), 0);
    const variance = N > 1 ? sumSqDiff / (N - 1) : 0;
    const stdDev = Number(Math.sqrt(variance).toFixed(2));

    const sumAbs = errors.reduce((acc, e) => acc + Math.abs(e), 0);
    const mae = Number((sumAbs / N).toFixed(2));

    const sumSq = errors.reduce((acc, e) => acc + e * e, 0);
    const rmse = Number(Math.sqrt(sumSq / N).toFixed(2));

    // Skewness and excess kurtosis
    const m2 = sumSqDiff / N;
    const m3 = errors.reduce((acc, e) => acc + Math.pow(e - meanError, 3), 0) / N;
    const m4 = errors.reduce((acc, e) => acc + Math.pow(e - meanError, 4), 0) / N;

    const skewness = m2 > 0 ? Number((m3 / Math.pow(m2, 1.5)).toFixed(3)) : 0;
    const kurtosis = m2 > 0 ? Number((m4 / Math.pow(m2, 2) - 3.0).toFixed(3)) : 0;

    // Jarque-Bera statistic: JB = (N/6) * (S^2 + K^2 / 4)
    const jarqueBeraStat = Number(((N / 6.0) * (skewness * skewness + (kurtosis * kurtosis) / 4.0)).toFixed(2));
    // Approximate critical value for chi-squared with 2 d.o.f at alpha=0.05 is 5.99
    const isGaussian = jarqueBeraStat < 5.99;

    const sorted = [...errors].sort((a, b) => a - b);
    const quantiles = {
      q025: this.calculatePercentile(sorted, 0.025),
      q05: this.calculatePercentile(sorted, 0.05),
      q10: this.calculatePercentile(sorted, 0.1),
      q25: this.calculatePercentile(sorted, 0.25),
      q50: this.calculatePercentile(sorted, 0.5),
      q75: this.calculatePercentile(sorted, 0.75),
      q90: this.calculatePercentile(sorted, 0.9),
      q95: this.calculatePercentile(sorted, 0.95),
      q975: this.calculatePercentile(sorted, 0.975),
    };

    return {
      horizonHours: horizon,
      sampleCount: N,
      meanError,
      stdDev,
      mae,
      rmse,
      quantiles,
      skewness,
      kurtosis,
      jarqueBeraStat,
      isGaussian,
    };
  }

  /**
   * Calibrates the uncertainty model on training data
   */
  public static calibrate(trainData: Array<{
    region: string;
    horizonHours: number;
    error: number;
  }>): UncertaintyModelArtifact {
    // Group by region and horizon
    const regionalMap: Record<string, Record<number, number[]>> = {};
    const allHorizonErrors: Record<number, number[]> = {};

    for (const obs of trainData) {
      if (!regionalMap[obs.region]) {
        regionalMap[obs.region] = {};
      }
      if (!regionalMap[obs.region][obs.horizonHours]) {
        regionalMap[obs.region][obs.horizonHours] = [];
      }
      regionalMap[obs.region][obs.horizonHours].push(obs.error);

      if (!allHorizonErrors[obs.horizonHours]) {
        allHorizonErrors[obs.horizonHours] = [];
      }
      allHorizonErrors[obs.horizonHours].push(obs.error);
    }

    const regions: Record<string, RegionCalibratedModel> = {};

    for (const [region, horizonGroups] of Object.entries(regionalMap)) {
      const horizons: Record<number, HorizonCalibratedStats> = {};
      let totalSamples = 0;
      let totalAbsError = 0;
      let totalSqError = 0;
      let totalError = 0;

      for (const [hStr, errs] of Object.entries(horizonGroups)) {
        const h = Number(hStr);
        const stats = this.fitDistribution(errs, h);
        horizons[h] = stats;

        totalSamples += errs.length;
        totalError += errs.reduce((a, b) => a + b, 0);
        totalAbsError += errs.reduce((a, b) => a + Math.abs(b), 0);
        totalSqError += errs.reduce((a, b) => a + b * b, 0);
      }

      regions[region] = {
        region,
        horizons,
        aggregateStats: {
          totalSamples,
          overallMae: Number((totalAbsError / totalSamples).toFixed(2)),
          overallRmse: Number(Math.sqrt(totalSqError / totalSamples).toFixed(2)),
          overallBias: Number((totalError / totalSamples).toFixed(2)),
        },
      };
    }

    // Build fallback profile across all pooled regions
    const fallbackProfile: Record<number, HorizonCalibratedStats> = {};
    for (const [hStr, errs] of Object.entries(allHorizonErrors)) {
      const h = Number(hStr);
      fallbackProfile[h] = this.fitDistribution(errs, h);
    }

    const model: UncertaintyModelArtifact = {
      version: 'v2.0-empirical-calibrated',
      modelType: 'empirical-quantile-and-gaussian-hybrid',
      calibrationTimestamp: new Date().toISOString(),
      trainingSamples: trainData.length,
      regions,
      fallbackProfile,
      description:
        'Data-driven empirical uncertainty calibration model fitted on historical multi-week Electricity Maps forecast vs. actual grid telemetry traces. Replaces arbitrary baseStdDev heuristics.',
    };

    return model;
  }

  /**
   * Evaluates the calibrated model against an independent holdout test partition
   */
  public static evaluate(
    model: UncertaintyModelArtifact,
    testData: Array<{
      region: string;
      horizonHours: number;
      predictedCarbon: number;
      actualCarbon: number;
      error: number;
    }>
  ): EvaluationReport {
    let countNom95Gaussian = 0;
    let countNom95Quantile = 0;
    let countNom90Gaussian = 0;
    let countNom90Quantile = 0;
    let countNom80Gaussian = 0;
    let countNom80Quantile = 0;

    let totalAbsError = 0;
    let totalSqError = 0;
    let totalBias = 0;

    // Reliability bins setup (10 bins for probability [0, 1])
    const NUM_BINS = 10;
    const bins: { sumForecastProb: number; sumObserved: number; count: number }[] = Array.from(
      { length: NUM_BINS },
      () => ({ sumForecastProb: 0, sumObserved: 0, count: 0 })
    );

    let totalBrierDiff = 0;
    let totalBrierSamples = 0;
    const regionalBrierSums: Record<string, { sumDiff: number; count: number }> = {};
    const regionalBreakdownMap: Record<
      string,
      {
        count: number;
        absErr: number;
        sqErr: number;
        bias: number;
        cov95G: number;
        cov95Q: number;
        brierDiff: number;
        brierCount: number;
      }
    > = {};

    for (const obs of testData) {
      const regModel = model.regions[obs.region];
      const stats =
        regModel?.horizons[obs.horizonHours] || model.fallbackProfile[obs.horizonHours];

      if (!stats) continue;

      const pred = obs.predictedCarbon;
      const actual = obs.actualCarbon;
      const err = obs.error; // actual - pred

      totalAbsError += Math.abs(err);
      totalSqError += err * err;
      totalBias += err;

      // Ensure regional breakdown entry exists
      if (!regionalBreakdownMap[obs.region]) {
        regionalBreakdownMap[obs.region] = {
          count: 0,
          absErr: 0,
          sqErr: 0,
          bias: 0,
          cov95G: 0,
          cov95Q: 0,
          brierDiff: 0,
          brierCount: 0,
        };
      }
      regionalBreakdownMap[obs.region].count++;
      regionalBreakdownMap[obs.region].absErr += Math.abs(err);
      regionalBreakdownMap[obs.region].sqErr += err * err;
      regionalBreakdownMap[obs.region].bias += err;

      // 95% intervals
      // Gaussian interval: [pred - 1.96 * sigma, pred + 1.96 * sigma]
      const g95Low = pred - 1.96 * stats.stdDev;
      const g95High = pred + 1.96 * stats.stdDev;
      const insideG95 = actual >= g95Low && actual <= g95High;
      if (insideG95) {
        countNom95Gaussian++;
        regionalBreakdownMap[obs.region].cov95G++;
      }

      // Empirical quantile interval: [pred + q025, pred + q975]
      const q95Low = pred + stats.quantiles.q025;
      const q95High = pred + stats.quantiles.q975;
      const insideQ95 = actual >= q95Low && actual <= q95High;
      if (insideQ95) {
        countNom95Quantile++;
        regionalBreakdownMap[obs.region].cov95Q++;
      }

      // 90% intervals
      const g90Low = pred - 1.645 * stats.stdDev;
      const g90High = pred + 1.645 * stats.stdDev;
      if (actual >= g90Low && actual <= g90High) countNom90Gaussian++;

      const q90Low = pred + stats.quantiles.q05;
      const q90High = pred + stats.quantiles.q95;
      if (actual >= q90Low && actual <= q90High) countNom90Quantile++;

      // 80% intervals
      const g80Low = pred - 1.282 * stats.stdDev;
      const g80High = pred + 1.282 * stats.stdDev;
      if (actual >= g80Low && actual <= g80High) countNom80Gaussian++;

      const q80Low = pred + stats.quantiles.q10;
      const q80High = pred + stats.quantiles.q90;
      if (actual >= q80Low && actual <= q80High) countNom80Quantile++;

      // Evaluate deadline breach risk across varied operational threshold / slack scenarios
      // Testing multi-level risk thresholds spans forecast probabilities across the full [0, 1] spectrum
      const zScenarios = [-1.8, -1.3, -0.8, -0.3, 0.0, 0.3, 0.8, 1.3, 1.8];
      for (const zTarget of zScenarios) {
        const thresholdVal = pred + zTarget * stats.stdDev;
        const z = (thresholdVal - pred) / Math.max(1, stats.stdDev);
        const forecastProb = Math.min(0.9999, Math.max(0.0001, 0.5 * erfcApprox(z / Math.SQRT2)));
        const actualBreached = actual > thresholdVal ? 1 : 0;

        const brierDiff = Math.pow(forecastProb - actualBreached, 2);
        totalBrierDiff += brierDiff;
        totalBrierSamples++;

        // Reliability diagram binning [0.0 - 1.0]
        const binIdx = Math.min(NUM_BINS - 1, Math.floor(forecastProb * NUM_BINS));
        bins[binIdx].count++;
        bins[binIdx].sumForecastProb += forecastProb;
        bins[binIdx].sumObserved += actualBreached;

        // Regional metrics
        if (!regionalBrierSums[obs.region]) {
          regionalBrierSums[obs.region] = { sumDiff: 0, count: 0 };
        }
        regionalBrierSums[obs.region].sumDiff += brierDiff;
        regionalBrierSums[obs.region].count++;

        regionalBreakdownMap[obs.region].brierDiff += brierDiff;
        regionalBreakdownMap[obs.region].brierCount++;
      }
    }

    const M = testData.length;
    const overallBrier = Number((totalBrierDiff / (totalBrierSamples || 1)).toFixed(4));
    const totalEvalSamples = bins.reduce((acc, b) => acc + b.count, 0);

    // Compute Expected Calibration Error (ECE)
    let ece = 0;
    const reliabilityBins: ReliabilityBin[] = bins.map((b, idx) => {
      const binStart = idx / NUM_BINS;
      const binEnd = (idx + 1) / NUM_BINS;
      const meanP = b.count > 0 ? b.sumForecastProb / b.count : (binStart + binEnd) / 2;
      const observedFreq = b.count > 0 ? b.sumObserved / b.count : 0;
      const calError = Math.abs(meanP - observedFreq);

      if (b.count > 0) {
        ece += (b.count / (totalEvalSamples || 1)) * calError;
      }

      return {
        binIndex: idx,
        binStart: Number(binStart.toFixed(2)),
        binEnd: Number(binEnd.toFixed(2)),
        sampleCount: b.count,
        meanForecastProb: Number(meanP.toFixed(4)),
        observedFreq: Number(observedFreq.toFixed(4)),
        calibrationError: Number(calError.toFixed(4)),
      };
    });

    const regionalBrier: Record<string, number> = {};
    for (const [r, obj] of Object.entries(regionalBrierSums)) {
      regionalBrier[r] = Number((obj.sumDiff / obj.count).toFixed(4));
    }

    const regionalBreakdown: Record<string, any> = {};
    for (const [r, obj] of Object.entries(regionalBreakdownMap)) {
      regionalBreakdown[r] = {
        sampleCount: obj.count,
        mae: Number((obj.absErr / obj.count).toFixed(2)),
        rmse: Number(Math.sqrt(obj.sqErr / obj.count).toFixed(2)),
        bias: Number((obj.bias / obj.count).toFixed(2)),
        coverage95Gaussian: Number(((obj.cov95G / obj.count) * 100).toFixed(2)),
        coverage95Quantile: Number(((obj.cov95Q / obj.count) * 100).toFixed(2)),
        brierScore: Number((obj.brierDiff / (obj.brierCount || 1)).toFixed(4)),
      };
    }

    return {
      version: model.version,
      evaluationTimestamp: new Date().toISOString(),
      testSamples: M,
      overallMetrics: {
        mae: Number((totalAbsError / M).toFixed(2)),
        rmse: Number(Math.sqrt(totalSqError / M).toFixed(2)),
        meanBias: Number((totalBias / M).toFixed(2)),
      },
      coverageMetrics: {
        nominal95_gaussian: Number(((countNom95Gaussian / M) * 100).toFixed(2)),
        nominal95_empiricalQuantile: Number(((countNom95Quantile / M) * 100).toFixed(2)),
        nominal90_gaussian: Number(((countNom90Gaussian / M) * 100).toFixed(2)),
        nominal90_empiricalQuantile: Number(((countNom90Quantile / M) * 100).toFixed(2)),
        nominal80_gaussian: Number(((countNom80Gaussian / M) * 100).toFixed(2)),
        nominal80_empiricalQuantile: Number(((countNom80Quantile / M) * 100).toFixed(2)),
      },
      brierScore: {
        overall: overallBrier,
        regional: regionalBrier,
      },
      expectedCalibrationError: {
        ece: Number(ece.toFixed(4)),
        bins: reliabilityBins,
      },
      regionalBreakdown,
    };
  }

  /**
   * Saves model and evaluation report to disk
   */
  public static saveArtifacts(
    model: UncertaintyModelArtifact,
    report: EvaluationReport
  ): { modelPath: string; reportPath: string } {
    const modelPath = this.getModelPath();
    const reportPath = this.getReportPath();

    const modelDir = path.dirname(modelPath);
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }

    fs.writeFileSync(modelPath, JSON.stringify(model, null, 2), 'utf-8');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    this.modelCache = model;
    this.reportCache = report;

    return { modelPath, reportPath };
  }

  /**
   * Loads calibrated uncertainty model from disk with caching
   */
  public static getLoadedModel(): UncertaintyModelArtifact {
    if (this.modelCache) return this.modelCache;

    const modelPath = this.getModelPath();
    if (!fs.existsSync(modelPath)) {
      throw new Error(
        `Calibrated uncertainty model not found at ${modelPath}. Please run "npm run calibrate" first.`
      );
    }

    const raw = fs.readFileSync(modelPath, 'utf-8');
    this.modelCache = JSON.parse(raw) as UncertaintyModelArtifact;
    return this.modelCache;
  }

  /**
   * Loads evaluation report from disk with caching
   */
  public static getLoadedReport(): EvaluationReport {
    if (this.reportCache) return this.reportCache;

    const reportPath = this.getReportPath();
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Calibration evaluation report not found at ${reportPath}. Please run "npm run calibrate" first.`
      );
    }

    const raw = fs.readFileSync(reportPath, 'utf-8');
    this.reportCache = JSON.parse(raw) as EvaluationReport;
    return this.reportCache;
  }

  /**
   * Forces cache invalidation
   */
  public static invalidateCache(): void {
    this.modelCache = null;
    this.reportCache = null;
  }

  /**
   * Quick lookup of standard deviation for a given region and horizon hour
   */
  public static getCalibratedStdDev(region: string, horizonHours: number): number {
    try {
      const model = this.getLoadedModel();
      const validHorizon = Math.max(1, Math.min(48, Math.round(horizonHours)));
      const regModel = model.regions[region];
      const stats = regModel?.horizons[validHorizon] || model.fallbackProfile[validHorizon];
      if (stats && typeof stats.stdDev === 'number') {
        return stats.stdDev;
      }
    } catch {
      // Fallback if model not yet loaded
    }
    // Safe conservative empirical fallback
    return Math.round(15 + 1.6 * Math.sqrt(Math.max(1, horizonHours)));
  }

  /**
   * Computes calibrated prediction interval and uncertainty for a forecast point
   */
  public static getPredictionInterval(
    region: string,
    horizonHours: number,
    predictedCarbon: number,
    preferQuantiles: boolean = true
  ): {
    stdDev: number;
    low: number;
    high: number;
    bias: number;
    method: 'empirical_quantile' | 'gaussian';
  } {
    try {
      const model = this.getLoadedModel();
      const validHorizon = Math.max(1, Math.min(48, Math.round(horizonHours)));
      const regModel = model.regions[region];
      const stats = regModel?.horizons[validHorizon] || model.fallbackProfile[validHorizon];

      if (stats) {
        if (preferQuantiles && stats.quantiles) {
          return {
            stdDev: stats.stdDev,
            low: Math.max(0, Math.round(predictedCarbon + stats.quantiles.q025)),
            high: Math.round(predictedCarbon + stats.quantiles.q975),
            bias: stats.meanError,
            method: 'empirical_quantile',
          };
        } else {
          return {
            stdDev: stats.stdDev,
            low: Math.max(0, Math.round(predictedCarbon - 1.96 * stats.stdDev)),
            high: Math.round(predictedCarbon + 1.96 * stats.stdDev),
            bias: stats.meanError,
            method: 'gaussian',
          };
        }
      }
    } catch {
      // Fallback
    }

    const fallbackStd = Math.round(15 + 1.6 * Math.sqrt(Math.max(1, horizonHours)));
    return {
      stdDev: fallbackStd,
      low: Math.max(0, Math.round(predictedCarbon - 1.96 * fallbackStd)),
      high: Math.round(predictedCarbon + 1.96 * fallbackStd),
      bias: 0,
      method: 'gaussian',
    };
  }
}

// Complementary error function helper
function erfcApprox(x: number): number {
  if (x < 0) return 2 - erfcApprox(-x);
  const t = 1.0 / (1.0 + 0.5 * x);
  return (
    t *
    Math.exp(
      -x * x -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))
    )
  );
}
