/**
 * CarbonRoute Scheduler Service
 *
 * Evaluates execution windows and scheduling policies based strictly on:
 * - Electricity Maps point carbon-intensity forecasts (gCO2eq/kWh)
 * - Workload duration (user-declared durationHours)
 * - Deadline feasibility (T_start + durationHours <= deadlineHours)
 *
 * Scientifically Honest Refactor:
 * - Removes artificial workload emissions (no CPU-based fake energy/power models).
 * - Focuses on predicted grid carbon intensity and scheduling decisions.
 * - Uses user-declared durationHours for window evaluations (3h job evaluates 3h windows).
 * - Decouples carbon forecast uncertainty from deadline compliance.
 */

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
  riskTolerance: number; // tau in (0, 1), e.g. 0.05 (5%) - planned constraint
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
  predictedCarbon: number; // Window average carbon intensity in gCO2eq/kWh (alias)
  predictedCarbonIntensity: number; // Window average carbon intensity in gCO2eq/kWh
  carbonIntensityUnit: string; // 'gCO2eq/kWh'
  estimatedDeadlineRisk: number; // 0.0 under deterministic feasibility, 1.0 if breaches deadline
  waitingTimeHours: number;
  isFeasible: boolean;
  schedulerOverheadMs: number;
  rationale: string;
}

export interface CandidateWindowEvaluation {
  slotIndex: number;
  startHour: number;
  endHour: number;
  windowLabel: string;
  predictedCarbonIntensity: number; // gCO2eq/kWh
  stdDev: number | null; // null when uncalibrated
  uncertaintyAvailable: boolean;
  uncertaintyStatus: 'not_calibrated' | 'calibrated' | 'benchmark_demo';
  deadlineRisk: number; // 0.0 or 1.0
  deadlineRiskPct: string;
  slackHours: number;
  waitingTimeHours: number;
  isFeasible: boolean;
  meetsDeadline: boolean;
  classification:
    | 'RECOMMENDED'
    | 'FEASIBLE'
    | 'REJECTED_DEADLINE_BREACH';
  classificationLabel: string;
  reason: string;
}

export interface SchedulingDecisionResponse {
  job: WorkloadJob;
  carbonSource: string;
  dataMode: 'live' | 'demo';
  region: string;
  durationHours: number;
  candidateWindows: CandidateWindowEvaluation[];
  evaluatedPolicies: PolicyEvaluationResult[];
  recommendedDecision: PolicyEvaluationResult;
  comparisonSummary: {
    carbonSavingsVsImmediatePct: number;
    delayPenaltyHours: number;
  };
  researchStatus: {
    liveForecastSource: string;
    carbonUncertaintyStatus: string;
    runtimeRiskStatus: string;
    executionStatus: string;
    realizedCarbonStatus: string;
    currentPrototypeCapabilities?: string[];
    nextMilestonePlanned?: string[];
  };
}

export class SchedulerService {
  /**
   * Evaluates all scheduling policies on the workload using user-declared duration
   * across candidate execution windows.
   */
  public static evaluateAllPolicies(
    job: WorkloadJob,
    forecast: CarbonForecastData | HourlyCarbonPoint[],
    _uncertaintyMultiplier?: number
  ): SchedulingDecisionResponse {
    // Normalize forecast input
    const points: HourlyCarbonPoint[] = Array.isArray(forecast)
      ? forecast
      : forecast.hourlyProfile || [];
    const source = Array.isArray(forecast)
      ? 'Electricity Maps Carbon Forecast'
      : forecast.source || 'Electricity Maps Carbon Forecast';
    const dataMode = Array.isArray(forecast)
      ? 'demo'
      : forecast.dataMode || 'demo';
    const region = Array.isArray(forecast)
      ? job.region || 'US-CAL-CISO'
      : forecast.region || job.region || 'US-CAL-CISO';

    const horizon = points.length;
    // The user-declared workload duration must strictly be the scheduling duration
    const dur = Math.max(1, Math.round(Number(job.durationHours) || 1));
    const ddl = Math.min(horizon, Math.max(dur, Math.round(Number(job.deadlineHours) || dur + 2)));
    const arrival = Math.max(0, Math.min(ddl - dur, Math.round(Number(job.arrivalHour) || 0)));

    /**
     * Helper: computes window average predicted carbon intensity (gCO2eq/kWh)
     * for a job running continuously for dur hours from startHour.
     */
    const computeWindowMetrics = (startHour: number) => {
      let sumCarbon = 0;
      let hasCalibratedStd = false;
      let sumStd = 0;

      for (let h = startHour; h < startHour + dur; h++) {
        const pt = points[h % horizon];
        sumCarbon += pt ? (pt.predictedCarbon ?? pt.carbonIntensity ?? 250) : 250;
        if (pt && typeof pt.stdDev === 'number') {
          hasCalibratedStd = true;
          sumStd += pt.stdDev;
        }
      }
      const avgCarbon = Math.round(sumCarbon / dur);
      const avgStd = hasCalibratedStd ? Math.round(sumStd / dur) : null;
      return { avgCarbon, avgStd };
    };

    // -------------------------------------------------------------
    // POLICY 1: Immediate Execution (Naive Baseline)
    // -------------------------------------------------------------
    const startImm = performance.now();
    const immSlot = arrival;
    const { avgCarbon: immCarbon } = computeWindowMetrics(immSlot);
    const immFeasible = immSlot + dur <= ddl;
    const overheadImm = Number((performance.now() - startImm).toFixed(2));

    const immediatePolicy: PolicyEvaluationResult = {
      policyId: 'immediate',
      policyName: 'Immediate Execution',
      category: 'Baseline',
      selectedStartHour: immSlot,
      selectedEndHour: immSlot + dur,
      selectedWindow: `T+${immSlot}:00 to T+${immSlot + dur}:00`,
      predictedCarbon: immCarbon,
      predictedCarbonIntensity: immCarbon,
      carbonIntensityUnit: 'gCO2eq/kWh',
      estimatedDeadlineRisk: immFeasible ? 0.0 : 1.0,
      waitingTimeHours: 0,
      isFeasible: immFeasible,
      schedulerOverheadMs: overheadImm,
      rationale: 'Dispatches workload immediately upon arrival without deferral.',
    };

    // -------------------------------------------------------------
    // POLICY 2: Earliest Deadline First (EDF)
    // -------------------------------------------------------------
    const startEdf = performance.now();
    const edfSlot = arrival;
    const { avgCarbon: edfCarbon } = computeWindowMetrics(edfSlot);
    const edfFeasible = edfSlot + dur <= ddl;
    const overheadEdf = Number((performance.now() - startEdf).toFixed(2));

    const edfPolicy: PolicyEvaluationResult = {
      policyId: 'edf',
      policyName: 'Earliest Deadline First (EDF)',
      category: 'Baseline',
      selectedStartHour: edfSlot,
      selectedEndHour: edfSlot + dur,
      selectedWindow: `T+${edfSlot}:00 to T+${edfSlot + dur}:00`,
      predictedCarbon: edfCarbon,
      predictedCarbonIntensity: edfCarbon,
      carbonIntensityUnit: 'gCO2eq/kWh',
      estimatedDeadlineRisk: edfFeasible ? 0.0 : 1.0,
      waitingTimeHours: 0,
      isFeasible: edfFeasible,
      schedulerOverheadMs: overheadEdf,
      rationale: 'Prioritizes deadline margin; dispatches at earliest arrival to retain maximum buffer.',
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
    const overheadDet = Number((performance.now() - startDet).toFixed(2));
    const detCarbonVal = minDetCarbon === Infinity ? immCarbon : minDetCarbon;
    const detFeasible = bestDetSlot + dur <= ddl;

    const detPolicy: PolicyEvaluationResult = {
      policyId: 'deterministic_carbon',
      policyName: 'Deterministic Carbon-Aware',
      category: 'Deterministic',
      selectedStartHour: bestDetSlot,
      selectedEndHour: bestDetSlot + dur,
      selectedWindow: `T+${bestDetSlot}:00 to T+${bestDetSlot + dur}:00`,
      predictedCarbon: detCarbonVal,
      predictedCarbonIntensity: detCarbonVal,
      carbonIntensityUnit: 'gCO2eq/kWh',
      estimatedDeadlineRisk: detFeasible ? 0.0 : 1.0,
      waitingTimeHours: bestDetSlot - arrival,
      isFeasible: detFeasible,
      schedulerOverheadMs: overheadDet,
      rationale: `Greedily selects the lowest predicted carbon window (T+${bestDetSlot}:00) within deadline boundary.`,
    };

    // -------------------------------------------------------------
    // POLICY 4: CarbonAware Baseline (Static Margin Heuristic)
    // -------------------------------------------------------------
    const startBase = performance.now();
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
    const overheadBase = Number((performance.now() - startBase).toFixed(2));
    const baseCarbonVal = minBaseCarbon === Infinity ? immCarbon : minBaseCarbon;
    const baseFeasible = bestBaseSlot + dur <= ddl;

    const baselinePolicy: PolicyEvaluationResult = {
      policyId: 'carbon_aware_baseline',
      policyName: 'CarbonAware Baseline',
      category: 'Baseline',
      selectedStartHour: bestBaseSlot,
      selectedEndHour: bestBaseSlot + dur,
      selectedWindow: `T+${bestBaseSlot}:00 to T+${bestBaseSlot + dur}:00`,
      predictedCarbon: baseCarbonVal,
      predictedCarbonIntensity: baseCarbonVal,
      carbonIntensityUnit: 'gCO2eq/kWh',
      estimatedDeadlineRisk: baseFeasible ? 0.0 : 1.0,
      waitingTimeHours: bestBaseSlot - arrival,
      isFeasible: baseFeasible,
      schedulerOverheadMs: overheadBase,
      rationale: `Heuristic: reserves a static ${staticBuffer}h safety buffer prior to deadline and dispatches at lowest carbon window within that buffer.`,
    };

    // -------------------------------------------------------------
    // CANDIDATE WINDOWS EVALUATION
    // Evaluates every possible execution window fitting before deadline
    // -------------------------------------------------------------
    const startCr = performance.now();
    const candidateWindows: CandidateWindowEvaluation[] = [];
    const maxEvaluationHour = Math.min(horizon - dur, ddl - dur);

    for (let t = arrival; t <= maxEvaluationHour; t++) {
      const { avgCarbon, avgStd } = computeWindowMetrics(t);
      const startHour = t;
      const endHour = t + dur;
      const windowLabel = `T+${startHour}:00 → T+${endHour}:00`;
      const meetsDeadline = endHour <= ddl;
      const slackHours = ddl - endHour;
      const waitingTimeHours = startHour - arrival;

      const riskResult = UncertaintyService.calculateDeadlineRisk(t, dur, ddl);
      const isFeasible = riskResult.isFeasible;

      let classification: CandidateWindowEvaluation['classification'];
      let classificationLabel: string;
      let reason: string;

      if (!meetsDeadline) {
        classification = 'REJECTED_DEADLINE_BREACH';
        classificationLabel = 'REJECTED — MISSES DEADLINE';
        reason = `Infeasible: Finishing at T+${endHour}:00 breaches deadline T+${ddl}:00 by ${Math.abs(slackHours)}h.`;
      } else {
        classification = 'FEASIBLE';
        classificationLabel = 'FEASIBLE';
        reason = `Feasible window: ${avgCarbon} gCO2eq/kWh with ${slackHours}h deadline buffer.`;
      }

      candidateWindows.push({
        slotIndex: t,
        startHour,
        endHour,
        windowLabel,
        predictedCarbonIntensity: avgCarbon,
        stdDev: avgStd,
        uncertaintyAvailable: avgStd !== null,
        uncertaintyStatus: avgStd !== null ? 'benchmark_demo' : 'not_calibrated',
        deadlineRisk: riskResult.violationRisk,
        deadlineRiskPct: meetsDeadline ? '0.0%' : '100.0%',
        slackHours,
        waitingTimeHours,
        isFeasible,
        meetsDeadline,
        classification,
        classificationLabel,
        reason,
      });
    }

    // -------------------------------------------------------------
    // POLICY 5: CarbonRoute Recommendation (Constrained Optimization)
    // Selects minimum predicted carbon intensity subject to deadline feasibility
    // -------------------------------------------------------------
    const feasibleCandidates = candidateWindows.filter((w) => w.isFeasible);
    let optimalCandidate: CandidateWindowEvaluation;

    if (feasibleCandidates.length > 0) {
      optimalCandidate = feasibleCandidates.reduce((best, cur) => {
        if (cur.predictedCarbonIntensity < best.predictedCarbonIntensity) return cur;
        if (cur.predictedCarbonIntensity === best.predictedCarbonIntensity && cur.startHour < best.startHour) return cur;
        return best;
      }, feasibleCandidates[0]);

      optimalCandidate.classification = 'RECOMMENDED';
      optimalCandidate.classificationLabel = 'RECOMMENDED';
      optimalCandidate.reason = `Lowest predicted carbon intensity (${optimalCandidate.predictedCarbonIntensity} gCO2eq/kWh) satisfying the deadline constraint.`;
    } else {
      optimalCandidate = candidateWindows[0];
      optimalCandidate.classification = 'RECOMMENDED';
      optimalCandidate.classificationLabel = 'RECOMMENDED';
      optimalCandidate.reason = `Fallback: Workload requires earliest dispatch to minimize deadline delay.`;
    }

    const overheadCr = Number((performance.now() - startCr).toFixed(2));

    const carbonRoutePolicy: PolicyEvaluationResult = {
      policyId: 'carbonroute_uncertainty',
      policyName: 'CarbonRoute Optimization',
      category: 'Uncertainty-Aware',
      selectedStartHour: optimalCandidate.startHour,
      selectedEndHour: optimalCandidate.endHour,
      selectedWindow: optimalCandidate.windowLabel,
      predictedCarbon: optimalCandidate.predictedCarbonIntensity,
      predictedCarbonIntensity: optimalCandidate.predictedCarbonIntensity,
      carbonIntensityUnit: 'gCO2eq/kWh',
      estimatedDeadlineRisk: optimalCandidate.deadlineRisk,
      waitingTimeHours: optimalCandidate.waitingTimeHours,
      isFeasible: optimalCandidate.isFeasible,
      schedulerOverheadMs: overheadCr,
      rationale: optimalCandidate.reason,
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
        ? Number((((immCarbon - optimalCandidate.predictedCarbonIntensity) / immCarbon) * 100).toFixed(1))
        : 0;

    return {
      job,
      carbonSource: source,
      dataMode,
      region,
      durationHours: dur,
      candidateWindows,
      evaluatedPolicies,
      recommendedDecision: carbonRoutePolicy,
      comparisonSummary: {
        carbonSavingsVsImmediatePct: Math.max(0, carbonSavingsPct),
        delayPenaltyHours: optimalCandidate.waitingTimeHours,
      },
      researchStatus: {
        liveForecastSource: 'Electricity Maps (Point carbon-intensity forecast)',
        carbonUncertaintyStatus: 'Not Calibrated (Planned empirical error calibration from historical archives)',
        runtimeRiskStatus: 'Deterministic Feasibility (Runtime distribution calibration planned for future validation)',
        executionStatus: 'Disabled in Current Prototype (Manifest preview only)',
        realizedCarbonStatus: 'Not Integrated (Realized carbon validation belongs to next research milestone)',
        currentPrototypeCapabilities: [
          'Live carbon forecast from Electricity Maps (point forecast in gCO2eq/kWh)',
          'Candidate-window scheduling across continuous user-declared duration',
          'Deadline-aware scheduling with deterministic feasibility filtering',
          'CarbonRoute recommendation & 5-policy comparative matrix',
          'Declarative Kubernetes batch/v1 Job manifest synthesis',
        ],
        nextMilestonePlanned: [
          'Empirical carbon forecast uncertainty calibration (historical error archive)',
          'Workload runtime distribution modeling (empirical execution history)',
          'Brier score, ECE & reliability diagram calibration',
          'Historical forecast-vs-realized post-hoc validation',
          'Live Kubernetes cluster dispatch & physical hardware power measurement',
        ],
      },
    };
  }
}

// Top-level convenience exports
export function evaluateAllPolicies(
  job: WorkloadJob,
  forecast: CarbonForecastData | HourlyCarbonPoint[]
): SchedulingDecisionResponse {
  return SchedulerService.evaluateAllPolicies(job, forecast);
}
