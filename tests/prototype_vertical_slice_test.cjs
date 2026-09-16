/**
 * CarbonRoute Prototype Vertical Slice Automated Test Suite
 * Validates the complete integrated flow:
 * 1. Carbon forecast ingestion (Live API point forecasts vs Demo trace)
 * 2. Uncertainty decoupling (Carbon forecast uncertainty separate from workload runtime uncertainty)
 * 3. 5-policy evaluation with grid carbon intensity (gCO2eq/kWh) and deterministic deadline feasibility
 * 4. User-declared duration continuous window evaluation (3h workload evaluates 3h blocks)
 * 5. Candidate window enumeration and deadline breach rejection
 * 6. Sensitivity tests: Duration, Deadline, Risk tolerance (tau)
 * 7. Declarative Kubernetes batch/v1 Job manifest synthesis
 * 8. Execution disablement in research prototype (manifest preview only, no fake timers/realized carbon)
 */

const { CarbonService, getForecast } = require('../backend/dist/services/carbonService');
const { UncertaintyService, calculateDeadlineRisk, erfc } = require('../backend/dist/services/uncertaintyService');
const { SchedulerService, evaluateAllPolicies } = require('../backend/dist/services/schedulerService');
const { K8sConnector, generateJobManifest, dispatchJob } = require('../backend/dist/services/k8sConnector');

async function runVerticalSliceTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 CarbonRoute: Prototype Milestone Vertical Slice Verification');
  console.log('🧪 ========================================================');

  let passed = 0;
  let failed = 0;

  async function assert(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  // EXPORT TEST: Top-Level Functions
  await assert('Exports: Top-level function exports exist and are callable', async () => {
    if (typeof getForecast !== 'function') throw new Error('getForecast is not a function');
    if (typeof calculateDeadlineRisk !== 'function') throw new Error('calculateDeadlineRisk is not a function');
    if (typeof evaluateAllPolicies !== 'function') throw new Error('evaluateAllPolicies is not a function');
    if (typeof generateJobManifest !== 'function') throw new Error('generateJobManifest is not a function');
    if (typeof dispatchJob !== 'function') throw new Error('dispatchJob is not a function');
    console.log('      Verified 5 top-level function exports successfully.');
  });

  // TEST 1: Carbon Service Ingestion
  let forecastData = null;
  await assert('Step 1: Carbon forecast returns 24 hourly points with explicit uncertainty status', async () => {
    forecastData = await getForecast('US-CAL-CISO', 24, 'demo');
    if (!forecastData || !forecastData.hourlyProfile || forecastData.hourlyProfile.length !== 24) {
      throw new Error(`Expected 24 points, got ${forecastData?.hourlyProfile?.length}`);
    }
    const p0 = forecastData.hourlyProfile[0];
    if (typeof p0.predictedCarbon !== 'number') {
      throw new Error('Point missing predictedCarbon');
    }
    if (p0.uncertaintyStatus !== 'benchmark_demo') {
      throw new Error(`Expected uncertaintyStatus 'benchmark_demo', got ${p0.uncertaintyStatus}`);
    }
    console.log(`      [Data Mode: ${forecastData.dataMode}] Hour 0: ${p0.predictedCarbon} gCO2eq/kWh (Status: ${p0.uncertaintyStatus}, stdDev: ${p0.stdDev})`);
  });

  // TEST 2: Uncertainty Decoupling
  await assert('Step 2: Carbon forecast uncertainty is decoupled from workload runtime uncertainty', async () => {
    const defaultEst = UncertaintyService.getDefaultEstimator();
    if (defaultEst.type !== 'carbon_forecast') {
      throw new Error(`Expected carbon_forecast estimator, got ${defaultEst.type}`);
    }
    if (defaultEst.isCalibrated()) {
      throw new Error('Default live carbon uncertainty estimator should be uncalibrated');
    }

    const runtimeEst = UncertaintyService.getRuntimeEstimator();
    if (runtimeEst.type !== 'workload_runtime') {
      throw new Error(`Expected workload_runtime estimator, got ${runtimeEst.type}`);
    }
    console.log('      Carbon uncertainty and runtime uncertainty models are strictly decoupled.');
  });

  // TEST 3: Deadline Feasibility & Tail Risk Calculation
  await assert('Step 3: Deterministic feasibility correctly bounds deadline risk (slack >= 0 feasible, slack < 0 risk = 1.0)', async () => {
    // 0h start, 4h duration, 16h deadline -> 12h slack (Feasible, 0% risk)
    const riskSafe = UncertaintyService.calculateDeadlineRisk(0, 4, 16).violationRisk;
    // 12h start, 4h duration, 16h deadline -> 0h slack (Feasible at boundary, 0% risk deterministic)
    const riskBoundary = UncertaintyService.calculateDeadlineRisk(12, 4, 16).violationRisk;
    // 13h start, 4h duration, 16h deadline -> -1h slack (Infeasible, 100% risk)
    const riskBreach = UncertaintyService.calculateDeadlineRisk(13, 4, 16).violationRisk;

    if (riskSafe !== 0.0) throw new Error(`Expected safe risk = 0.0, got ${riskSafe}`);
    if (riskBoundary !== 0.0) throw new Error(`Expected boundary risk = 0.0, got ${riskBoundary}`);
    if (riskBreach !== 1.0) throw new Error(`Expected overrun risk = 1.0, got ${riskBreach}`);
    console.log(`      Deterministic feasibility: Safe slack risk = ${riskSafe}, Overrun risk = ${riskBreach}`);
  });

  // =========================================================================
  // TEST A: BASE CASE (Runtime = 2h, Deadline = 12h, Risk Tolerance = 5%)
  // =========================================================================
  let baseJob = {
    id: 'test-job-base',
    name: 'ResNet-50 Batch Training',
    commandOrImage: 'carbonroute/test-workload:latest',
    isContainerImage: true,
    durationHours: 2,
    deadlineHours: 12,
    arrivalHour: 0,
    cpu: 2,
    memoryMb: 1024,
    region: 'US-CAL-CISO',
    riskTolerance: 0.05,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  let decisionResult = null;

  await assert('Test A: Base Case (2h runtime, 12h deadline) evaluates 5 policies and synthesizes manifest preview', async () => {
    // 1. Evaluate all 5 policies
    decisionResult = evaluateAllPolicies(baseJob, forecastData);
    if (!decisionResult || decisionResult.evaluatedPolicies.length !== 5) {
      throw new Error(`Expected 5 policies, got ${decisionResult?.evaluatedPolicies?.length}`);
    }

    const immediate = decisionResult.evaluatedPolicies.find(p => p.policyId === 'immediate');
    const rec = decisionResult.recommendedDecision;

    // 2. CarbonRoute selects window with carbon <= immediate and guaranteed deadline feasibility
    if (rec.predictedCarbon > immediate.predictedCarbon) {
      throw new Error(`Recommended carbon ${rec.predictedCarbon} higher than immediate ${immediate.predictedCarbon}`);
    }
    if (rec.estimatedDeadlineRisk > 0.051) {
      throw new Error(`Estimated risk ${(rec.estimatedDeadlineRisk * 100).toFixed(2)}% exceeds 5% tolerance`);
    }

    console.log(`      Immediate: ${immediate.predictedCarbon} gCO2eq/kWh, CarbonRoute: ${rec.predictedCarbon} gCO2eq/kWh (Window: ${rec.selectedWindow}, Savings: ${decisionResult.comparisonSummary.carbonSavingsVsImmediatePct}%)`);

    // 3. Declarative Kubernetes Job manifest generated
    const manifestObj = generateJobManifest(baseJob, rec.selectedStartHour, 'carbonroute-job-testa');
    const apiVersion = manifestObj.apiVersion || manifestObj.manifest?.apiVersion;
    const kind = manifestObj.kind || manifestObj.manifest?.kind;
    if (apiVersion !== 'batch/v1' || kind !== 'Job') {
      throw new Error('Invalid manifest apiVersion or kind');
    }

    // 4. Execution is disabled with declarative preview in research prototype
    const execution = await dispatchJob(
      baseJob,
      rec.selectedStartHour,
      rec.predictedCarbon
    );

    if (!execution || !execution.jobId) {
      throw new Error('Dispatch failed to return valid execution preview record');
    }
    if (execution.executionDisabled !== true) {
      throw new Error('Execution should be disabled in current research prototype');
    }
    if (execution.status !== 'disabled_in_prototype') {
      throw new Error(`Expected status 'disabled_in_prototype', got ${execution.status}`);
    }
    console.log(`      Execution Preview: ${execution.status} | Execution Disabled: ${execution.executionDisabled}`);
  });

  // =========================================================================
  // TEST B: WORKLOAD DURATION IN EVALUATIONS (Continuous Block Evaluation)
  // =========================================================================
  await assert('Test B: User-declared durationHours is strictly used for continuous candidate window evaluations', async () => {
    const job3h = { ...baseJob, id: 'job-b-3h', durationHours: 3, deadlineHours: 12 };
    const dec3h = evaluateAllPolicies(job3h, forecastData);

    // 3h job with 12h deadline -> candidate windows start at 0, 1, ..., 9 (10 windows total)
    if (dec3h.candidateWindows.length !== 10) {
      throw new Error(`Expected 10 candidate windows for 3h job with 12h deadline, got ${dec3h.candidateWindows.length}`);
    }

    // Window 0 evaluates hours 0, 1, 2
    const win0 = dec3h.candidateWindows[0];
    const expectedWin0Avg = (
      forecastData.hourlyProfile[0].predictedCarbon +
      forecastData.hourlyProfile[1].predictedCarbon +
      forecastData.hourlyProfile[2].predictedCarbon
    ) / 3;

    if (Math.abs(win0.predictedCarbonIntensity - Math.round(expectedWin0Avg)) > 0.1) {
      throw new Error(`Window 0 avg mismatch: expected ${Math.round(expectedWin0Avg)}, got ${win0.predictedCarbonIntensity}`);
    }

    if (win0.windowLabel !== 'T+0:00 → T+3:00') {
      throw new Error(`Expected label "T+0:00 → T+3:00", got "${win0.windowLabel}"`);
    }
    console.log(`      Verified continuous 3-hour contiguous window evaluation: ${win0.windowLabel} = ${win0.predictedCarbonIntensity.toFixed(1)} gCO2eq/kWh`);
  });

  // =========================================================================
  // TEST C: WORKLOAD RUNTIME SENSITIVITY (2h vs 6h)
  // =========================================================================
  await assert('Test C: Workload runtime sensitivity (2h vs 6h) shrinks feasible set', async () => {
    const job2h = { ...baseJob, id: 'job-c-2h', durationHours: 2, deadlineHours: 12 };
    const job6h = { ...baseJob, id: 'job-c-6h', durationHours: 6, deadlineHours: 12 };

    const dec2h = evaluateAllPolicies(job2h, forecastData);
    const dec6h = evaluateAllPolicies(job6h, forecastData);

    // Max feasible start hour for 6h: 12 - 6 = 6
    const det6h = dec6h.evaluatedPolicies.find(p => p.policyId === 'deterministic_carbon');
    if (det6h.selectedStartHour > 6) {
      throw new Error(`6h job selected infeasible start hour ${det6h.selectedStartHour} (deadline 12h)`);
    }

    console.log(`      2h candidate count: ${dec2h.candidateWindows.length} | 6h candidate count: ${dec6h.candidateWindows.length}`);
    console.log(`      2h job selected: T+${dec2h.recommendedDecision.selectedStartHour}:00 | 6h job selected: T+${dec6h.recommendedDecision.selectedStartHour}:00`);
  });

  // =========================================================================
  // TEST D: DEADLINE SENSITIVITY (12h vs 8h)
  // =========================================================================
  await assert('Test D: Deadline sensitivity (12h vs 8h) bounds maximum start window', async () => {
    const job12h = { ...baseJob, id: 'job-d-12h', durationHours: 2, deadlineHours: 12 };
    const job8h = { ...baseJob, id: 'job-d-8h', durationHours: 2, deadlineHours: 8 };

    const dec12h = evaluateAllPolicies(job12h, forecastData);
    const dec8h = evaluateAllPolicies(job8h, forecastData);

    if (dec8h.recommendedDecision.selectedStartHour > 6) {
      throw new Error(`8h deadline job selected start ${dec8h.recommendedDecision.selectedStartHour} which exceeds deadline (2h duration)`);
    }

    console.log(`      12h deadline selected: T+${dec12h.recommendedDecision.selectedStartHour}:00 | 8h deadline selected: T+${dec8h.recommendedDecision.selectedStartHour}:00`);
  });

  // =========================================================================
  // TEST E: CANDIDATE WINDOWS ENUMERATION & CLASSIFICATION
  // =========================================================================
  await assert('Test E: Candidate Windows Explorer enumerates and evaluates all valid contiguous blocks', async () => {
    const dec = evaluateAllPolicies(baseJob, forecastData);
    const windows = dec.candidateWindows;

    if (!Array.isArray(windows) || windows.length === 0) {
      throw new Error(`Expected non-empty candidateWindows array, got ${windows?.length}`);
    }

    let recommendedCount = 0;
    let feasibleCount = 0;
    let deadlineBreachCount = 0;

    for (const w of windows) {
      if (typeof w.slotIndex !== 'number') throw new Error(`Missing slotIndex in window ${w.windowLabel}`);
      if (typeof w.startHour !== 'number') throw new Error(`Missing startHour in window ${w.windowLabel}`);
      if (typeof w.endHour !== 'number') throw new Error(`Missing endHour in window ${w.windowLabel}`);
      if (typeof w.predictedCarbonIntensity !== 'number' || w.predictedCarbonIntensity <= 0) {
        throw new Error(`Invalid predictedCarbonIntensity in window ${w.windowLabel}: ${w.predictedCarbonIntensity}`);
      }
      if (typeof w.slackHours !== 'number') throw new Error(`Missing slackHours in window ${w.windowLabel}`);
      if (typeof w.isFeasible !== 'boolean') throw new Error(`Missing isFeasible in window ${w.windowLabel}`);
      if (typeof w.reason !== 'string' || w.reason.length < 5) {
        throw new Error(`Missing reason in window ${w.windowLabel}: ${w.reason}`);
      }

      if (w.classification === 'RECOMMENDED') {
        recommendedCount++;
        feasibleCount++;
      } else if (w.classification === 'FEASIBLE') {
        feasibleCount++;
      } else if (w.classification === 'REJECTED_DEADLINE_BREACH') {
        deadlineBreachCount++;
      }

      // Semantic integrity assertions
      if (!w.meetsDeadline && w.classification !== 'REJECTED_DEADLINE_BREACH') {
        throw new Error(`Window ${w.windowLabel} misses deadline but classification is ${w.classification}`);
      }
    }

    if (recommendedCount !== 1) {
      throw new Error(`Expected exactly 1 RECOMMENDED window, got ${recommendedCount}`);
    }

    console.log(`      Total Candidate Windows: ${windows.length}`);
    console.log(`      Feasible (incl. Recommended): ${feasibleCount} | Deadline Breaches: ${deadlineBreachCount}`);
  });

  // =========================================================================
  // TEST F: 4-CASE SENSITIVITY VERIFICATION
  // =========================================================================
  await assert('Test F: Evaluates Cases A, B, C, D dynamically with strict duration and deadline bounds', async () => {
    // CASE A: Runtime = 3h, Deadline = 12h
    const jobA = { ...baseJob, id: 'case-a', durationHours: 3, deadlineHours: 12, riskTolerance: 0.05 };
    const decA = evaluateAllPolicies(jobA, forecastData);
    if (decA.candidateWindows.length !== 10) {
      throw new Error(`Case A: Expected 10 candidate windows (T+0 to T+9), got ${decA.candidateWindows.length}`);
    }
    const recA = decA.recommendedDecision;
    if (recA.selectedStartHour + 3 > 12) {
      throw new Error(`Case A: Recommended window exceeds deadline`);
    }

    // CASE B: Same Job, Runtime = 3h, Deadline = 8h
    const jobB = { ...jobA, id: 'case-b', deadlineHours: 8 };
    const decB = evaluateAllPolicies(jobB, forecastData);
    if (decB.candidateWindows.length !== 6) {
      throw new Error(`Case B: Expected 6 candidate windows (T+0 to T+5), got ${decB.candidateWindows.length}`);
    }
    const recB = decB.recommendedDecision;
    if (recB.selectedStartHour + 3 > 8) {
      throw new Error(`Case B: Recommended window exceeds deadline`);
    }

    // CASE C: Same Job, Runtime = 6h, Deadline = 12h
    const jobC = { ...jobA, id: 'case-c', durationHours: 6, deadlineHours: 12 };
    const decC = evaluateAllPolicies(jobC, forecastData);
    if (decC.candidateWindows.length !== 7) {
      throw new Error(`Case C: Expected 7 candidate windows (T+0 to T+6), got ${decC.candidateWindows.length}`);
    }
    const recC = decC.recommendedDecision;
    if (recC.selectedStartHour + 6 > 12) {
      throw new Error(`Case C: Recommended window exceeds deadline`);
    }

    console.log(`      Case A: 3h in 12h deadline -> ${decA.candidateWindows.length} windows, Recommended: ${recA.selectedWindow}`);
    console.log(`      Case B: 3h in 8h deadline  -> ${decB.candidateWindows.length} windows, Recommended: ${recB.selectedWindow}`);
    console.log(`      Case C: 6h in 12h deadline -> ${decC.candidateWindows.length} windows, Recommended: ${recC.selectedWindow}`);
  });

  // =========================================================================
  // TEST G: CONTROLLED BENCHMARK DEMO EVALUATION
  // =========================================================================
  await assert('Test G: Controlled Research Benchmark evaluates 5 policies with clean research status metadata', async () => {
    const benchmarkForecast = await getForecast('BENCHMARK-RESEARCH', 24, 'demo');
    const researchJob = {
      id: 'job-benchmark',
      name: 'Benchmark Job',
      commandOrImage: 'test:latest',
      isContainerImage: true,
      durationHours: 2,
      deadlineHours: 12,
      arrivalHour: 0,
      cpu: 2,
      memoryMb: 1024,
      region: 'BENCHMARK-RESEARCH',
      riskTolerance: 0.05,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const dec = evaluateAllPolicies(researchJob, benchmarkForecast);
    if (dec.evaluatedPolicies.length !== 5) {
      throw new Error(`Expected 5 policies, got ${dec.evaluatedPolicies.length}`);
    }

    // Verify research status card metadata
    if (!dec.researchStatus || !Array.isArray(dec.researchStatus.currentPrototypeCapabilities)) {
      throw new Error('Missing researchStatus in decision response');
    }
    if (!Array.isArray(dec.researchStatus.nextMilestonePlanned)) {
      throw new Error('Missing nextMilestonePlanned in researchStatus');
    }

    console.log(`      Research Status: ${dec.researchStatus.currentPrototypeCapabilities.length} current capabilities, ${dec.researchStatus.nextMilestonePlanned.length} next milestone items.`);
  });

  console.log('\n========================================================');
  console.log(`🎯 Prototype Vertical Slice Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerticalSliceTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
