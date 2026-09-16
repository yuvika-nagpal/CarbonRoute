/**
 * CarbonRoute Uncertainty & Risk Engine
 *
 * Scientifically Honest Architecture:
 * 1. Carbon Forecast Uncertainty:
 *    Represents uncertainty in grid carbon intensity: actual C(t+h) vs predicted C_hat(t+h).
 *    In the current milestone, Electricity Maps API returns only point forecasts.
 *    Forecast uncertainty calibration requires historical forecast-vintage archive data,
 *    and is structured via CarbonUncertaintyEstimator with status "not_calibrated".
 *
 * 2. Workload Runtime Uncertainty:
 *    Represents uncertainty in workload execution duration T_runtime.
 *    Affects deadline compliance: P(T_start + T_runtime > Deadline).
 *    Decoupled completely from grid carbon intensity: carbon variance does not make code run slower.
 *    In the current prototype, workload duration is evaluated deterministically based on
 *    user-declared durationHours (runtime calibration is a planned future validation milestone).
 */

import { CalibrationService } from './calibrationService';

export interface CarbonUncertaintyEstimate {
  available: boolean;
  status: 'not_calibrated' | 'calibrated';
  stdDev: number | null;
  method: string;
  confidenceLow: number | null;
  confidenceHigh: number | null;
  sampleCount: number;
  explanation: string;
}

export interface CarbonUncertaintyEstimator {
  estimate(
    region: string,
    horizonHours: number,
    predictedCarbon: number,
    forecastTimestamp?: string
  ): Promise<CarbonUncertaintyEstimate>;
}

/**
 * Standard implementation representing the current prototype milestone.
 * Reflects that Electricity Maps API supplies point forecasts and empirical
 * error calibration is not yet connected.
 */
export class DefaultCarbonUncertaintyEstimator implements CarbonUncertaintyEstimator {
  public readonly type = 'carbon_forecast';

  public isCalibrated(): boolean {
    return false;
  }

  public async estimate(
    _region: string,
    _horizonHours: number,
    _predictedCarbon: number,
    _forecastTimestamp?: string
  ): Promise<CarbonUncertaintyEstimate> {
    return {
      available: false,
      status: 'not_calibrated',
      stdDev: null,
      method: 'not_calibrated',
      confidenceLow: null,
      confidenceHigh: null,
      sampleCount: 0,
      explanation:
        'Electricity Maps provides the point carbon-intensity forecast. Empirical forecast uncertainty calibration will be estimated from historical forecast-error archives in a future milestone.',
    };
  }
}

export interface RuntimeUncertaintyEstimate {
  available: boolean;
  status: 'not_calibrated' | 'deterministic';
  sigmaRuntimeHours: number | null;
  method: string;
  explanation: string;
}

export interface RuntimeUncertaintyEstimator {
  readonly type?: string;
  estimate(durationHours: number): RuntimeUncertaintyEstimate;
}

export class DefaultRuntimeUncertaintyEstimator implements RuntimeUncertaintyEstimator {
  public readonly type = 'workload_runtime';

  public estimate(_durationHours: number): RuntimeUncertaintyEstimate {
    return {
      available: false,
      status: 'deterministic',
      sigmaRuntimeHours: null,
      method: 'deterministic_user_declared',
      explanation:
        'Runtime uncertainty calibration is not enabled in the current prototype. Workload duration is evaluated deterministically using user-declared duration.',
    };
  }
}

export interface DeadlineRiskResult {
  violationRisk: number; // Probability in [0, 1]
  slackHours: number; // Available buffer before deadline in hours
  isFeasible: boolean; // Whether startHour + durationHours <= deadlineHours
  runtimeModel: 'deterministic' | 'calibrated_probabilistic';
  rationale: string;
  effectiveStdDev?: number; // Optional runtime sigma when calibrated
  zScore?: number;
}

export class UncertaintyService {
  private static carbonEstimator: CarbonUncertaintyEstimator =
    new DefaultCarbonUncertaintyEstimator();
  private static runtimeEstimator: RuntimeUncertaintyEstimator =
    new DefaultRuntimeUncertaintyEstimator();

  public static getDefaultEstimator(): CarbonUncertaintyEstimator {
    return this.carbonEstimator;
  }

  public static getRuntimeEstimator(): RuntimeUncertaintyEstimator {
    return this.runtimeEstimator;
  }

  public static getCalibratedStdDev(region: string, horizonHours: number): number {
    return CalibrationService.getCalibratedStdDev(region, horizonHours);
  }

  public static getPredictionInterval(
    region: string,
    horizonHours: number,
    predictedCarbon: number
  ): { low: number; high: number } {
    return CalibrationService.getPredictionInterval(region, horizonHours, predictedCarbon);
  }

  /**
   * Retrieves carbon forecast uncertainty estimation for a given region & horizon
   */
  public static async getCarbonUncertainty(
    region: string,
    horizonHours: number,
    predictedCarbon: number,
    forecastTimestamp?: string
  ): Promise<CarbonUncertaintyEstimate> {
    return this.carbonEstimator.estimate(
      region,
      horizonHours,
      predictedCarbon,
      forecastTimestamp
    );
  }

  /**
   * Evaluates workload deadline risk based solely on runtime feasibility.
   * Does NOT mix grid carbon forecast uncertainty into workload execution time.
   */
  public static calculateDeadlineRisk(
    startHour: number,
    durationHours: number,
    deadlineHours: number,
    calibratedSigmaRuntime?: number
  ): DeadlineRiskResult {
    const slack = Number((deadlineHours - (startHour + durationHours)).toFixed(2));

    // Infeasible: Job finishes after deadline
    if (slack < 0) {
      return {
        violationRisk: 1.0,
        slackHours: slack,
        isFeasible: false,
        runtimeModel: 'deterministic',
        rationale: `Deterministic deadline breach: finishing at T+${(
          startHour + durationHours
        ).toFixed(1)} violates deadline T+${deadlineHours}.`,
        effectiveStdDev: 0,
        zScore: -999,
      };
    }

    // Probabilistic evaluation if an empirical runtime standard deviation is supplied
    if (typeof calibratedSigmaRuntime === 'number' && calibratedSigmaRuntime > 0) {
      const z = slack / calibratedSigmaRuntime;
      const violationRisk = Math.min(
        1.0,
        Math.max(0.0, 0.5 * this.erfc(z / Math.SQRT2))
      );
      return {
        violationRisk: Number(violationRisk.toFixed(4)),
        slackHours: slack,
        isFeasible: true,
        runtimeModel: 'calibrated_probabilistic',
        rationale: `Probabilistic risk evaluated with calibrated runtime sigma of ${calibratedSigmaRuntime}h.`,
        effectiveStdDev: calibratedSigmaRuntime,
        zScore: Number(z.toFixed(3)),
      };
    }

    // Current Milestone Default: Deterministic feasibility (no fabricated runtime sigma)
    return {
      violationRisk: 0.0,
      slackHours: slack,
      isFeasible: true,
      runtimeModel: 'deterministic',
      rationale: `Feasible: finishes at T+${(startHour + durationHours).toFixed(
        1
      )} with ${slack}h buffer before deadline T+${deadlineHours}. (Runtime uncertainty calibration is not enabled in the current prototype).`,
      effectiveStdDev: 0,
      zScore: 999,
    };
  }

  /**
   * Approximates the complementary error function erfc(x)
   * Chebyshev rational polynomial approximation accurate to 1.2e-7
   */
  public static erfc(x: number): number {
    if (x < 0) {
      return 2 - this.erfc(-x);
    }
    const t = 1.0 / (1.0 + 0.5 * x);
    const tau =
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
      );
    return tau;
  }
}

// Top-level convenience exports matching specification
export function calculateDeadlineRisk(
  startHour: number,
  durationHours: number,
  deadlineHours: number,
  calibratedSigmaRuntime?: number
): DeadlineRiskResult {
  return UncertaintyService.calculateDeadlineRisk(
    startHour,
    durationHours,
    deadlineHours,
    calibratedSigmaRuntime
  );
}

export function erfc(x: number): number {
  return UncertaintyService.erfc(x);
}
