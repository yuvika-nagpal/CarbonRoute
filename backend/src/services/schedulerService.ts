import { CarbonForecastData } from './carbonService';
import { UncertaintyService } from './uncertaintyService';

export interface WorkloadJob {
  id: string;
  name: string;
  commandOrImage: string;
  isContainerImage: boolean;
  durationHours: number;
  deadlineHours: number;
  arrivalHour: number;
  cpu: number;
  memoryMb: number;
  region: string;
  riskTolerance: number; // tau in (0, 1), e.g. 0.05
  status?: 'pending' | 'scheduled' | 'running' | 'completed' | 'failed';
  createdAt: string;
}

export interface PolicyEvaluationResult {
  policyId: string;
  policyName: string;
  category: 'Baseline' | 'Deterministic' | 'Uncertainty-Aware';
  selectedStartHour: number;
  selectedWindow: string;
  predictedCarbon: number; // gCO2eq/kWh
  estimatedDeadlineRisk: number; // e.g. 0.04 (4%)
  waitingTimeHours: number;
  isFeasible: boolean;
  schedulerOverheadMs: number;
  rationale: string;
}

export interface SchedulingDecisionResponse {
  job: WorkloadJob;
  carbonSource: string;
  dataMode: 'live' | 'demo';
  region: string;
  evaluatedPolicies: PolicyEvaluationResult[];
  recommendedDecision: PolicyEvaluationResult;
  comparisonSummary: {
    carbonSavingsVsImmediatePct: number;
    delayPenaltyHours: number;
    riskDifferenceVsDeterministic: number;
  };
}

export class SchedulerService {
  public static evaluateAllPolicies(
    job: WorkloadJob,
    forecast: CarbonForecastData,
    uncertaintyMultiplier: number = 1.0
  ): SchedulingDecisionResponse {
    const horizon = forecast.hourlyProfile.length;
    const dur = Math.max(1, Math.round(job.durationHours));
    const ddl = Math.min(horizon, Math.max(dur, Math.round(job.deadlineHours)));
    const arrival = Math.max(0, Math.round(job.arrivalHour || 0));

    // 1. Policy: Immediate Execution
    const startImmediate = performance.now();
    const immSlot = arrival;
    const immCarbon = forecast.hourlyProfile[immSlot]?.predictedCarbon || forecast.averageCarbon;
    const immRisk = UncertaintyService.calculateDeadlineRisk(
      immSlot,
      dur,
      ddl,
      forecast.hourlyProfile[immSlot]?.stdDev || 15,
      uncertaintyMultiplier
    ).violationRisk;
    const overheadImm = Number((performance.now() - startImmediate).toFixed(2));

    const immediatePolicy: PolicyEvaluationResult = {
      policyId: 'immediate',
      policyName: 'Immediate Execution',
      category: 'Baseline',
      selectedStartHour: immSlot,
      selectedWindow: `T+${immSlot}:00 to T+${immSlot + dur}:00`,
      predictedCarbon: immCarbon,
      estimatedDeadlineRisk: immRisk,
      waitingTimeHours: 0,
      isFeasible: immSlot + dur <= ddl,
      schedulerOverheadMs: overheadImm,
      rationale: 'Dispatches job immediately upon arrival with zero intentional scheduling delay.',
    };

    // 2. Policy: Earliest Deadline First (EDF)
    const startEdf = performance.now();
    const edfSlot = arrival;
    const edfCarbon = forecast.hourlyProfile[edfSlot]?.predictedCarbon || forecast.averageCarbon;
    const edfRisk = immRisk;
    const overheadEdf = Number((performance.now() - startEdf).toFixed(2));

    const edfPolicy: PolicyEvaluationResult = {
      policyId: 'edf',
      policyName: 'Earliest Deadline First (EDF)',
      category: 'Baseline',
      selectedStartHour: edfSlot,
      selectedWindow: `T+${edfSlot}:00 to T+${edfSlot + dur}:00`,
      predictedCarbon: edfCarbon,
      estimatedDeadlineRisk: edfRisk,
      waitingTimeHours: 0,
      isFeasible: edfSlot + dur <= ddl,
      schedulerOverheadMs: overheadEdf,
      rationale: 'Prioritizes deadline pressure; dispatches at earliest arrival to maximize execution safety buffer.',
    };

    // 3. Policy: Deterministic Carbon-Aware
    const startDet = performance.now();
    let bestDetSlot = arrival;
    let minDetCarbon = Infinity;

    for (let t = arrival; t <= ddl - dur; t++) {
      const c = forecast.hourlyProfile[t]?.predictedCarbon ?? Infinity;
      if (c < minDetCarbon) {
        minDetCarbon = c;
        bestDetSlot = t;
      }
    }
    const detRisk = UncertaintyService.calculateDeadlineRisk(
      bestDetSlot,
      dur,
      ddl,
      forecast.hourlyProfile[bestDetSlot]?.stdDev || 25,
      uncertaintyMultiplier
    ).violationRisk;
    const overheadDet = Number((performance.now() - startDet).toFixed(2));

    const detPolicy: PolicyEvaluationResult = {
      policyId: 'deterministic_carbon',
      policyName: 'Deterministic Carbon-Aware',
      category: 'Deterministic',
      selectedStartHour: bestDetSlot,
      selectedWindow: `T+${bestDetSlot}:00 to T+${bestDetSlot + dur}:00`,
      predictedCarbon: minDetCarbon === Infinity ? immCarbon : minDetCarbon,
      estimatedDeadlineRisk: detRisk,
      waitingTimeHours: bestDetSlot - arrival,
      isFeasible: bestDetSlot + dur <= ddl,
      schedulerOverheadMs: overheadDet,
      rationale: `Greedily selects the global carbon minimum slot (T+${bestDetSlot}) ignoring forecast error uncertainty.`,
    };

    // 4. Policy: CarbonAware Baseline (Fixed safety buffer)
    const startBase = performance.now();
    const fixedBuffer = 2; // Fixed static 2-hour buffer heuristic
    const maxBaseSlot = Math.max(arrival, ddl - dur - fixedBuffer);
    let bestBaseSlot = arrival;
    let minBaseCarbon = Infinity;

    for (let t = arrival; t <= maxBaseSlot; t++) {
      const c = forecast.hourlyProfile[t]?.predictedCarbon ?? Infinity;
      if (c < minBaseCarbon) {
        minBaseCarbon = c;
        bestBaseSlot = t;
      }
    }
    const baseRisk = UncertaintyService.calculateDeadlineRisk(
      bestBaseSlot,
      dur,
      ddl,
      forecast.hourlyProfile[bestBaseSlot]?.stdDev || 20,
      uncertaintyMultiplier
    ).violationRisk;
    const overheadBase = Number((performance.now() - startBase).toFixed(2));

    const baselinePolicy: PolicyEvaluationResult = {
      policyId: 'carbon_aware_baseline',
      policyName: 'CarbonAware Baseline',
      category: 'Baseline',
      selectedStartHour: bestBaseSlot,
      selectedWindow: `T+${bestBaseSlot}:00 to T+${bestBaseSlot + dur}:00`,
      predictedCarbon: minBaseCarbon === Infinity ? immCarbon : minBaseCarbon,
      estimatedDeadlineRisk: baseRisk,
      waitingTimeHours: bestBaseSlot - arrival,
      isFeasible: bestBaseSlot + dur <= ddl,
      schedulerOverheadMs: overheadBase,
      rationale: `Selects minimum carbon within an ad-hoc safety buffer of ${fixedBuffer} hours before deadline.`,
    };

    // 5. Policy: CarbonRoute Uncertainty-Aware Scheduler
    const startCr = performance.now();
    const riskTolerance = job.riskTolerance || 0.10;
    const candidates: { slot: number; carbon: number; risk: number }[] = [];

    for (let t = arrival; t <= ddl - dur; t++) {
      const c = forecast.hourlyProfile[t]?.predictedCarbon ?? Infinity;
      const std = forecast.hourlyProfile[t]?.stdDev || 25;
      const r = UncertaintyService.calculateDeadlineRisk(t, dur, ddl, std, uncertaintyMultiplier).violationRisk;

      if (r <= riskTolerance) {
        candidates.push({ slot: t, carbon: c, risk: r });
      }
    }

    let crSlot = arrival;
    let crCarbon = immCarbon;
    let crRisk = immRisk;
    let crRationale = '';

    if (candidates.length > 0) {
      // Find candidate that minimizes carbon while strictly satisfying deadline risk threshold
      candidates.sort((a, b) => a.carbon - b.carbon);
      const chosen = candidates[0];
      crSlot = chosen.slot;
      crCarbon = chosen.carbon;
      crRisk = chosen.risk;

      if (crSlot === bestDetSlot) {
        crRationale = `Selected optimal carbon minimum (T+${crSlot}) because estimated deadline risk (${(crRisk * 100).toFixed(1)}%) is comfortably below your ${(riskTolerance * 100).toFixed(1)}% threshold.`;
      } else {
        crRationale = `Selected safer earlier window (T+${crSlot}) with ${(crRisk * 100).toFixed(1)}% risk. The lowest carbon window (T+${bestDetSlot}) was rejected because its high forecast uncertainty inflated deadline risk to ${(detRisk * 100).toFixed(1)}%, violating your ${(riskTolerance * 100).toFixed(1)}% threshold.`;
      }
    } else {
      // Fallback: Pick candidate minimizing risk
      crSlot = arrival;
      crCarbon = immCarbon;
      crRisk = immRisk;
      crRationale = `No window satisfied the strict ${(riskTolerance * 100).toFixed(1)}% risk tolerance; gracefully fell back to earliest arrival (T+${arrival}) to guarantee completion.`;
    }

    const overheadCr = Number((performance.now() - startCr).toFixed(2));

    const carbonRoutePolicy: PolicyEvaluationResult = {
      policyId: 'carbonroute_uncertainty',
      policyName: 'CarbonRoute Uncertainty-Aware',
      category: 'Uncertainty-Aware',
      selectedStartHour: crSlot,
      selectedWindow: `T+${crSlot}:00 to T+${crSlot + dur}:00`,
      predictedCarbon: crCarbon,
      estimatedDeadlineRisk: crRisk,
      waitingTimeHours: crSlot - arrival,
      isFeasible: crSlot + dur <= ddl,
      schedulerOverheadMs: overheadCr,
      rationale: crRationale,
    };

    const evaluatedPolicies = [
      immediatePolicy,
      edfPolicy,
      detPolicy,
      baselinePolicy,
      carbonRoutePolicy,
    ];

    const carbonSavingsPct =
      immCarbon > 0 ? Number((((immCarbon - crCarbon) / immCarbon) * 100).toFixed(1)) : 0;

    return {
      job,
      carbonSource: forecast.source,
      dataMode: forecast.dataMode,
      region: forecast.region,
      evaluatedPolicies,
      recommendedDecision: carbonRoutePolicy,
      comparisonSummary: {
        carbonSavingsVsImmediatePct: carbonSavingsPct,
        delayPenaltyHours: crSlot - arrival,
        riskDifferenceVsDeterministic: Number(((detRisk - crRisk) * 100).toFixed(1)),
      },
    };
  }
}
