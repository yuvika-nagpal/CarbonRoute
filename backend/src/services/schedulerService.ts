import { CarbonForecastData, HourlyCarbonPoint } from './carbonService';
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
  riskTolerance: number; // tau in (0, 1), e.g. 0.05 (5%)
  status?: 'pending' | 'scheduled' | 'running' | 'completed' | 'failed';
  createdAt: string;
}

export interface PolicyEvaluationResult {
  policyId: string;
  policyName: string;
  category: 'Baseline' | 'Deterministic' | 'Uncertainty-Aware';
  selectedStartHour: number;
  selectedEndHour: number;
  selectedWindow: string;
  predictedCarbon: number; // Window average carbon intensity in gCO2eq/kWh
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
  /**
   * Evaluates all 5 scheduling policies simultaneously on the exact same workload
   * and underlying carbon forecast trace.
   */
  public static evaluateAllPolicies(
    job: WorkloadJob,
    forecast: CarbonForecastData | HourlyCarbonPoint[],
    uncertaintyMultiplier: number = 1.0
  ): SchedulingDecisionResponse {
    // Normalize forecast input (support either full CarbonForecastData or raw points array)
    const points: HourlyCarbonPoint[] = Array.isArray(forecast)
      ? forecast
      : forecast.hourlyProfile || [];
    const source = Array.isArray(forecast)
      ? 'Prepared Carbon Trace'
      : forecast.source || 'Prepared Carbon Trace';
    const dataMode = Array.isArray(forecast)
      ? 'demo'
      : forecast.dataMode || 'demo';
    const region = Array.isArray(forecast)
      ? job.region || 'US-CAL-CISO'
      : forecast.region || job.region || 'US-CAL-CISO';

    const horizon = points.length;
    const dur = Math.max(1, Math.round(Number(job.durationHours) || 1));
    const ddl = Math.min(horizon, Math.max(dur, Math.round(Number(job.deadlineHours) || dur + 2)));
    const arrival = Math.max(0, Math.min(ddl - dur, Math.round(Number(job.arrivalHour) || 0)));
    const tau = Math.max(0.001, Math.min(0.50, Number(job.riskTolerance) || 0.05));

    /**
     * Helper: computes window average carbon intensity and average uncertainty
     * for a job running continuously from hour t to t + dur - 1.
     */
    const computeWindowMetrics = (startHour: number) => {
      let sumCarbon = 0;
      let sumStd = 0;
      for (let h = startHour; h < startHour + dur; h++) {
        const pt = points[h % horizon];
        sumCarbon += pt ? (pt.predictedCarbon ?? pt.carbonIntensity ?? 250) : 250;
        sumStd += pt ? (pt.stdDev ?? pt.uncertaintyStdDev ?? 20) : 20;
      }
      const avgCarbon = Math.round(sumCarbon / dur);
      const avgStd = Math.round(sumStd / dur);
      return { avgCarbon, avgStd };
    };

    // -------------------------------------------------------------
    // POLICY 1: Immediate Execution (Naive Baseline)
    // -------------------------------------------------------------
    const startImm = performance.now();
    const immSlot = arrival;
    const { avgCarbon: immCarbon, avgStd: immStd } = computeWindowMetrics(immSlot);
    const immRisk = UncertaintyService.calculateDeadlineRisk(
      immSlot,
      dur,
      ddl,
      immStd,
      uncertaintyMultiplier
    ).violationRisk;
    const overheadImm = Number((performance.now() - startImm).toFixed(2));

    const immediatePolicy: PolicyEvaluationResult = {
      policyId: 'immediate',
      policyName: 'Immediate Execution',
      category: 'Baseline',
      selectedStartHour: immSlot,
      selectedEndHour: immSlot + dur,
      selectedWindow: `T+${immSlot}:00 to T+${immSlot + dur}:00`,
      predictedCarbon: immCarbon,
      estimatedDeadlineRisk: immRisk,
      waitingTimeHours: 0,
      isFeasible: immSlot + dur <= ddl,
      schedulerOverheadMs: overheadImm,
      rationale: 'Dispatches job immediately upon arrival without intentional delay. Serves as benchmark baseline.',
    };

    // -------------------------------------------------------------
    // POLICY 2: Earliest Deadline First (EDF)
    // -------------------------------------------------------------
    const startEdf = performance.now();
    const edfSlot = arrival;
    const { avgCarbon: edfCarbon, avgStd: edfStd } = computeWindowMetrics(edfSlot);
    const edfRisk = UncertaintyService.calculateDeadlineRisk(
      edfSlot,
      dur,
      ddl,
      edfStd,
      uncertaintyMultiplier
    ).violationRisk;
    const overheadEdf = Number((performance.now() - startEdf).toFixed(2));

    const edfPolicy: PolicyEvaluationResult = {
      policyId: 'edf',
      policyName: 'Earliest Deadline First (EDF)',
      category: 'Baseline',
      selectedStartHour: edfSlot,
      selectedEndHour: edfSlot + dur,
      selectedWindow: `T+${edfSlot}:00 to T+${edfSlot + dur}:00`,
      predictedCarbon: edfCarbon,
      estimatedDeadlineRisk: edfRisk,
      waitingTimeHours: 0,
      isFeasible: edfSlot + dur <= ddl,
      schedulerOverheadMs: overheadEdf,
      rationale: 'Prioritizes deadline safety; executes at earliest feasible arrival to maximize remaining slack buffer.',
    };

    // -------------------------------------------------------------
    // POLICY 3: Deterministic Carbon-Aware (Greedy Minimum)
    // -------------------------------------------------------------
    const startDet = performance.now();
    let bestDetSlot = arrival;
    let minDetCarbon = Infinity;

    for (let t = arrival; t <= ddl - dur; t++) {
      const { avgCarbon } = computeWindowMetrics(t);
      if (avgCarbon < minDetCarbon) {
        minDetCarbon = avgCarbon;
        bestDetSlot = t;
      }
    }
    const { avgStd: detStd } = computeWindowMetrics(bestDetSlot);
    const detRisk = UncertaintyService.calculateDeadlineRisk(
      bestDetSlot,
      dur,
      ddl,
      detStd,
      uncertaintyMultiplier
    ).violationRisk;
    const overheadDet = Number((performance.now() - startDet).toFixed(2));

    const detPolicy: PolicyEvaluationResult = {
      policyId: 'deterministic_carbon',
      policyName: 'Deterministic Carbon-Aware',
      category: 'Deterministic',
      selectedStartHour: bestDetSlot,
      selectedEndHour: bestDetSlot + dur,
      selectedWindow: `T+${bestDetSlot}:00 to T+${bestDetSlot + dur}:00`,
      predictedCarbon: minDetCarbon === Infinity ? immCarbon : minDetCarbon,
      estimatedDeadlineRisk: detRisk,
      waitingTimeHours: bestDetSlot - arrival,
      isFeasible: bestDetSlot + dur <= ddl,
      schedulerOverheadMs: overheadDet,
      rationale: `Greedily selects the lowest predicted carbon window (T+${bestDetSlot}) without uncertainty or risk calibration.`,
    };

    // -------------------------------------------------------------
    // POLICY 4: CarbonAware Baseline (Fixed Static Safety Margin)
    // -------------------------------------------------------------
    const startBase = performance.now();
    // Conventional heuristic: reserves a static buffer (e.g. 2 hours or 20% of slack) before deadline
    const staticBuffer = Math.max(1, Math.min(3, Math.round((ddl - (arrival + dur)) * 0.25)));
    const maxBaseSlot = Math.max(arrival, ddl - dur - staticBuffer);
    let bestBaseSlot = arrival;
    let minBaseCarbon = Infinity;

    for (let t = arrival; t <= maxBaseSlot; t++) {
      const { avgCarbon } = computeWindowMetrics(t);
      if (avgCarbon < minBaseCarbon) {
        minBaseCarbon = avgCarbon;
        bestBaseSlot = t;
      }
    }
    const { avgStd: baseStd } = computeWindowMetrics(bestBaseSlot);
    const baseRisk = UncertaintyService.calculateDeadlineRisk(
      bestBaseSlot,
      dur,
      ddl,
      baseStd,
      uncertaintyMultiplier
    ).violationRisk;
    const overheadBase = Number((performance.now() - startBase).toFixed(2));

    const baselinePolicy: PolicyEvaluationResult = {
      policyId: 'carbon_aware_baseline',
      policyName: 'CarbonAware Baseline',
      category: 'Baseline',
      selectedStartHour: bestBaseSlot,
      selectedEndHour: bestBaseSlot + dur,
      selectedWindow: `T+${bestBaseSlot}:00 to T+${bestBaseSlot + dur}:00`,
      predictedCarbon: minBaseCarbon === Infinity ? immCarbon : minBaseCarbon,
      estimatedDeadlineRisk: baseRisk,
      waitingTimeHours: bestBaseSlot - arrival,
      isFeasible: bestBaseSlot + dur <= ddl,
      schedulerOverheadMs: overheadBase,
      rationale: `Conventional heuristic: optimizes carbon within a fixed ${staticBuffer}h safety margin before deadline.`,
    };

    // -------------------------------------------------------------
    // POLICY 5: CarbonRoute Uncertainty-Aware (Constrained Optimization)
    // Objective: min E[Carbon(t)] subject to P(violation) <= tau and t + dur <= ddl
    // -------------------------------------------------------------
    const startCr = performance.now();
    const candidateWindows: Array<{
      slot: number;
      carbon: number;
      risk: number;
      slack: number;
    }> = [];

    for (let t = arrival; t <= ddl - dur; t++) {
      const { avgCarbon, avgStd } = computeWindowMetrics(t);
      const riskObj = UncertaintyService.calculateDeadlineRisk(
        t,
        dur,
        ddl,
        avgStd,
        uncertaintyMultiplier
      );

      // Only retain candidates satisfying user deadline risk constraint
      if (riskObj.violationRisk <= tau) {
        candidateWindows.push({
          slot: t,
          carbon: avgCarbon,
          risk: riskObj.violationRisk,
          slack: riskObj.slackHours,
        });
      }
    }

    let crSlot: number;
    let crCarbon: number;
    let crRisk: number;
    let crRationale: string;

    if (candidateWindows.length > 0) {
      // Sort primarily by carbon ascending (lowest first), tie-break by earlier slot
      candidateWindows.sort((a, b) => {
        if (a.carbon !== b.carbon) return a.carbon - b.carbon;
        return a.slot - b.slot;
      });

      const selected = candidateWindows[0];
      crSlot = selected.slot;
      crCarbon = selected.carbon;
      crRisk = selected.risk;

      if (crSlot === bestDetSlot) {
        crRationale = `Selected lowest carbon window (T+${crSlot}) because estimated deadline risk (${(
          crRisk * 100
        ).toFixed(1)}%) is comfortably within your ${(tau * 100).toFixed(0)}% tolerance.`;
      } else {
        crRationale = `Selected safer window (T+${crSlot}, ${crCarbon} gCO2) with ${(crRisk * 100).toFixed(
          1
        )}% risk. The global minimum slot (T+${bestDetSlot}, ${minDetCarbon} gCO2) was rejected because its high forecast uncertainty elevated deadline breach risk to ${(
          detRisk * 100
        ).toFixed(1)}%, exceeding your ${(tau * 100).toFixed(0)}% tolerance constraint.`;
      }
    } else {
      // Fallback: If no candidate satisfies strict tau, choose the slot that minimizes risk
      let minRisk = Infinity;
      let safestSlot = arrival;
      for (let t = arrival; t <= ddl - dur; t++) {
        const { avgStd } = computeWindowMetrics(t);
        const r = UncertaintyService.calculateDeadlineRisk(
          t,
          dur,
          ddl,
          avgStd,
          uncertaintyMultiplier
        ).violationRisk;
        if (r < minRisk) {
          minRisk = r;
          safestSlot = t;
        }
      }
      crSlot = safestSlot;
      const { avgCarbon } = computeWindowMetrics(crSlot);
      crCarbon = avgCarbon;
      crRisk = minRisk;
      crRationale = `No execution window satisfied your strict ${(tau * 100).toFixed(
        0
      )}% risk tolerance given the tight deadline (${ddl}h). Falling back to minimum-risk slot (T+${crSlot}) with ${(
        crRisk * 100
      ).toFixed(1)}% risk to preserve feasibility.`;
    }

    const overheadCr = Number((performance.now() - startCr).toFixed(2));

    const carbonRoutePolicy: PolicyEvaluationResult = {
      policyId: 'carbonroute_uncertainty',
      policyName: 'CarbonRoute Uncertainty-Aware',
      category: 'Uncertainty-Aware',
      selectedStartHour: crSlot,
      selectedEndHour: crSlot + dur,
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
      immCarbon > 0
        ? Number((((immCarbon - crCarbon) / immCarbon) * 100).toFixed(1))
        : 0;

    return {
      job,
      carbonSource: source,
      dataMode,
      region,
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

// Export top-level function matching specification
export function evaluateAllPolicies(
  job: WorkloadJob,
  forecast: CarbonForecastData | HourlyCarbonPoint[],
  uncertaintyMultiplier?: number
): SchedulingDecisionResponse {
  return SchedulerService.evaluateAllPolicies(job, forecast, uncertaintyMultiplier);
}
