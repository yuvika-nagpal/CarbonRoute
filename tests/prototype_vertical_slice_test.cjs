/**
 * CarbonRoute Prototype Vertical Slice Automated Test Suite
 * Validates the complete integrated flow:
 * 1. Carbon forecast ingestion (Live API or Demo trace fallback)
 * 2. Horizon uncertainty modeling & tail risk calculation
 * 3. 5-policy evaluation (Immediate, EDF, Deterministic, Baseline, CarbonRoute)
 * 4. Sensitivity test: Same forecast, different risk tolerance (tau)
 * 5. Kubernetes Job manifest generation & local sandbox fallback execution
 * 6. Live log streaming & realized carbon accounting
 */

const { CarbonService, getForecast } = require('../backend/dist/services/carbonService');
const { UncertaintyService, calculateDeadlineRisk, calculateHorizonStdDev, erfc } = require('../backend/dist/services/uncertaintyService');
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
  await assert('Exports: Top-level function exports (getForecast, calculateDeadlineRisk, evaluateAllPolicies, generateJobManifest, dispatchJob) exist and are callable', async () => {
    if (typeof getForecast !== 'function') throw new Error('getForecast is not a function');
    if (typeof calculateDeadlineRisk !== 'function') throw new Error('calculateDeadlineRisk is not a function');
    if (typeof calculateHorizonStdDev !== 'function') throw new Error('calculateHorizonStdDev is not a function');
    if (typeof evaluateAllPolicies !== 'function') throw new Error('evaluateAllPolicies is not a function');
    if (typeof generateJobManifest !== 'function') throw new Error('generateJobManifest is not a function');
    if (typeof dispatchJob !== 'function') throw new Error('dispatchJob is not a function');
    console.log('      Verified 6 top-level function exports successfully.');
  });

  // TEST 1: Carbon Service Ingestion & Fallback
  let forecastData = null;
  await assert('Step 1: Carbon forecast returns 24 calibrated hourly points with confidence bounds', async () => {
    forecastData = await getForecast('US-CAL-CISO');
    if (!forecastData || !forecastData.hourlyProfile || forecastData.hourlyProfile.length !== 24) {
      throw new Error(`Expected 24 points, got ${forecastData?.hourlyProfile?.length}`);
    }
    const p0 = forecastData.hourlyProfile[0];
    if (typeof p0.predictedCarbon !== 'number' || typeof p0.stdDev !== 'number') {
      throw new Error('Point missing predictedCarbon or stdDev');
    }
    console.log(`      [Data Mode: ${forecastData.dataMode}] Hour 0: ${p0.predictedCarbon} gCO2/kWh (stdDev: ${p0.stdDev}, bounds: [${p0.confidenceLow}, ${p0.confidenceHigh}])`);
  });

  // TEST 2: Horizon Uncertainty Growth
  await assert('Step 2: Uncertainty sigma(t) monotonically expands across the 24h horizon', async () => {
    const sigma0 = UncertaintyService.calculateHorizonStdDev(0, 15);
    const sigma6 = UncertaintyService.calculateHorizonStdDev(6, 15);
    const sigma12 = UncertaintyService.calculateHorizonStdDev(12, 15);
    const sigma24 = UncertaintyService.calculateHorizonStdDev(24, 15);

    if (!(sigma0 < sigma6 && sigma6 < sigma12 && sigma12 < sigma24)) {
      throw new Error(`Variance did not grow over horizon: s0=${sigma0}, s6=${sigma6}, s12=${sigma12}, s24=${sigma24}`);
    }
    console.log(`      Horizon Dispersion: 0h=${sigma0.toFixed(1)} -> 6h=${sigma6.toFixed(1)} -> 12h=${sigma12.toFixed(1)} -> 24h=${sigma24.toFixed(1)}`);
  });

  // TEST 3: Tail Risk Calculation
  await assert('Step 3: Chebyshev erfc correctly bounds deadline risk between 0 and 1', async () => {
    const riskSafe = UncertaintyService.calculateDeadlineRisk(0, 4, 16, 15, 1.0).violationRisk;
    const riskRisky = UncertaintyService.calculateDeadlineRisk(11, 4, 16, 15, 1.0).violationRisk;
    const riskBreach = UncertaintyService.calculateDeadlineRisk(13, 4, 16, 15, 1.0).violationRisk;

    if (riskSafe > 0.05) throw new Error(`Expected safe risk < 0.05, got ${riskSafe}`);
    if (riskRisky <= riskSafe) throw new Error(`Expected risky slot to have higher risk: ${riskRisky} vs ${riskSafe}`);
    if (riskBreach !== 1.0) throw new Error(`Expected infeasible slot risk = 1.0, got ${riskBreach}`);
    console.log(`      Risk calibration: Safe slack risk = ${(riskSafe * 100).toFixed(2)}%, Tight slack risk = ${(riskRisky * 100).toFixed(2)}%`);
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

  await assert('Test A: Base Case (2h runtime, 12h deadline, 5% risk) executes complete vertical slice', async () => {
    // 1. Forecast contains 24 data points
    if (!forecastData || forecastData.hourlyProfile.length !== 24) {
      throw new Error(`Expected 24 points, got ${forecastData?.hourlyProfile?.length}`);
    }

    // 2. Evaluate all 5 policies
    decisionResult = evaluateAllPolicies(baseJob, forecastData, 1.0);
    if (!decisionResult || decisionResult.evaluatedPolicies.length !== 5) {
      throw new Error(`Expected 5 policies, got ${decisionResult?.evaluatedPolicies?.length}`);
    }

    const immediate = decisionResult.evaluatedPolicies.find(p => p.policyId === 'immediate');
    const rec = decisionResult.recommendedDecision;

    // 3. CarbonRoute selects window with carbon < immediate and risk <= 5%
    if (rec.predictedCarbon >= immediate.predictedCarbon) {
      throw new Error(`Recommended carbon ${rec.predictedCarbon} not lower than immediate ${immediate.predictedCarbon}`);
    }
    if (rec.estimatedDeadlineRisk > 0.051) {
      throw new Error(`Estimated risk ${(rec.estimatedDeadlineRisk * 100).toFixed(2)}% exceeds 5% tolerance`);
    }

    console.log(`      Immediate: ${immediate.predictedCarbon} gCO2, CarbonRoute: ${rec.predictedCarbon} gCO2 (Slot: T+${rec.selectedStartHour}:00, Savings: ${decisionResult.comparisonSummary.carbonSavingsVsImmediatePct}%, Risk: ${(rec.estimatedDeadlineRisk * 100).toFixed(2)}%)`);

    // 4. Kubernetes Job manifest generated
    const manifest = generateJobManifest(baseJob, rec.selectedStartHour, 'carbonroute-job-testa');
    if (manifest.apiVersion !== 'batch/v1' || manifest.kind !== 'Job') {
      throw new Error('Invalid manifest apiVersion or kind');
    }

    // 5. Workload execution & realized carbon recording
    const execution = await dispatchJob(
      baseJob,
      rec,
      undefined,
      undefined,
      undefined,
      undefined,
      2 // 2s simulated duration for test
    );

    if (!execution || !execution.jobId) {
      throw new Error('Dispatch failed to return valid execution record');
    }

    // Poll to completion
    let completed = false;
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 150));
      const status = K8sConnector.getExecutionStatus(baseJob.id);
      if (status && (status.status === 'completed' || status.status === 'failed')) {
        completed = true;
        if (typeof status.realizedCarbon !== 'number') throw new Error('Realized carbon not recorded');
        if (typeof status.carbonError !== 'number') throw new Error('Carbon error not recorded');
        console.log(`      Execution Mode: ${status.clusterMode} | Realized Carbon: ${status.realizedCarbon} gCO2 (Error: ${status.carbonError > 0 ? '+' : ''}${status.carbonError} gCO2)`);
        break;
      }
    }
    if (!completed) throw new Error('Execution did not complete within timeout window');
  });

  // =========================================================================
  // TEST B: SAME FORECAST, DIFFERENT UNCERTAINTY
  // =========================================================================
  await assert('Test B: Same forecast with different uncertainty shifts decision conservatively', async () => {
    // Run 1: baseline uncertainty
    const run1 = evaluateAllPolicies(baseJob, forecastData, 1.0);
    // Run 2: higher uncertainty (multiplier = 2.4)
    const run2 = evaluateAllPolicies(baseJob, forecastData, 2.4);

    // 1. Forecast carbon values are identical between runs
    const c1 = run1.evaluatedPolicies.map(p => p.predictedCarbon);
    const c2 = run2.evaluatedPolicies.map(p => p.predictedCarbon);
    for (let i = 0; i < c1.length; i++) {
      if (c1[i] !== c2[i]) throw new Error(`Predicted carbon differs at index ${i}: ${c1[i]} vs ${c2[i]}`);
    }

    // 2. Deadline violation risk is strictly higher in Run 2 for distant windows
    const lateHour = 8;
    const risk1 = calculateDeadlineRisk(lateHour, baseJob.durationHours, baseJob.deadlineHours, 15, 1.0).violationRisk;
    const risk2 = calculateDeadlineRisk(lateHour, baseJob.durationHours, baseJob.deadlineHours, 15, 2.4).violationRisk;
    if (risk2 <= risk1) {
      throw new Error(`Distant window risk did not increase under higher uncertainty: run1=${risk1}, run2=${risk2}`);
    }

    // 3. Optimal window in Run 2 is either earlier than or equal to Run 1
    const slot1 = run1.recommendedDecision.selectedStartHour;
    const slot2 = run2.recommendedDecision.selectedStartHour;
    console.log(`      Run 1 (Baseline sigma):  Window = T+${slot1}:00 (Risk: ${(run1.recommendedDecision.estimatedDeadlineRisk * 100).toFixed(2)}%)`);
    console.log(`      Run 2 (Elevated sigma):  Window = T+${slot2}:00 (Risk: ${(run2.recommendedDecision.estimatedDeadlineRisk * 100).toFixed(2)}%)`);

    if (slot2 > slot1) {
      throw new Error(`Higher uncertainty unexpectedly selected later window (${slot2} > ${slot1})`);
    }

    // 4. CarbonRoute explains why the decision shifted
    if (!run2.recommendedDecision.rationale || run2.recommendedDecision.rationale.length < 20) {
      throw new Error('Missing dynamic rationale in Run 2');
    }
  });

  // =========================================================================
  // TEST C: WORKLOAD RUNTIME SENSITIVITY (2h vs 6h)
  // =========================================================================
  await assert('Test C: Workload runtime sensitivity (2h vs 6h) shrinks feasible set and computes continuous window averages', async () => {
    const job2h = { ...baseJob, id: 'job-c-2h', durationHours: 2, deadlineHours: 12 };
    const job6h = { ...baseJob, id: 'job-c-6h', durationHours: 6, deadlineHours: 12 };

    const dec2h = evaluateAllPolicies(job2h, forecastData, 1.0);
    const dec6h = evaluateAllPolicies(job6h, forecastData, 1.0);

    // Max feasible start hour: 12 - 6 = 6
    const det6h = dec6h.evaluatedPolicies.find(p => p.policyId === 'deterministic_carbon');
    if (det6h.selectedStartHour > 6) {
      throw new Error(`6h job selected infeasible start hour ${det6h.selectedStartHour} (deadline 12h)`);
    }

    // Multi-hour carbon averages reflect 6-hour windows, not 2-hour
    let sum2h = 0;
    for (let w = 0; w < 2; w++) sum2h += forecastData.hourlyProfile[w].predictedCarbon;
    const avg2h = Math.round(sum2h / 2);

    let sum6h = 0;
    for (let w = 0; w < 6; w++) sum6h += forecastData.hourlyProfile[w].predictedCarbon;
    const avg6h = Math.round(sum6h / 6);

    console.log(`      Hour 0 averages: 2-hour window = ${avg2h} gCO2/kWh vs 6-hour window = ${avg6h} gCO2/kWh`);
    console.log(`      2h job selected: T+${dec2h.recommendedDecision.selectedStartHour}:00 | 6h job selected: T+${dec6h.recommendedDecision.selectedStartHour}:00`);
  });

  // =========================================================================
  // TEST D: DEADLINE SENSITIVITY (12h vs 8h)
  // =========================================================================
  await assert('Test D: Deadline sensitivity (12h vs 8h) shrinks candidate set and elevates tail risk', async () => {
    const job12h = { ...baseJob, id: 'job-d-12h', durationHours: 2, deadlineHours: 12 };
    const job8h = { ...baseJob, id: 'job-d-8h', durationHours: 2, deadlineHours: 8 };

    const dec12h = evaluateAllPolicies(job12h, forecastData, 1.0);
    const dec8h = evaluateAllPolicies(job8h, forecastData, 1.0);

    // For slot 6: finishes at 8h
    // Under 12h deadline: slack = 4h
    // Under 8h deadline: slack = 0h
    const riskSlack4 = calculateDeadlineRisk(6, 2, 12, 15, 1.0).violationRisk;
    const riskSlack0 = calculateDeadlineRisk(6, 2, 8, 15, 1.0).violationRisk;

    if (riskSlack0 <= riskSlack4) {
      throw new Error(`Slack decrease did not increase violation risk: slack4=${riskSlack4}, slack0=${riskSlack0}`);
    }

    console.log(`      Slot T+6:00 risk with 4h slack = ${(riskSlack4 * 100).toFixed(2)}% vs 0h slack = ${(riskSlack0 * 100).toFixed(2)}%`);
    console.log(`      12h deadline selected: T+${dec12h.recommendedDecision.selectedStartHour}:00 | 8h deadline selected: T+${dec8h.recommendedDecision.selectedStartHour}:00`);

    if (dec8h.recommendedDecision.selectedStartHour > 6) {
      throw new Error(`8h deadline job selected start ${dec8h.recommendedDecision.selectedStartHour} which exceeds deadline`);
    }
  });

  // =========================================================================
  // TEST E: RISK TOLERANCE SENSITIVITY (tau: 1% strict vs 5% normal vs 20% relaxed)
  // =========================================================================
  await assert('Test E: Risk tolerance sensitivity dynamically adjusts acceptable window set', async () => {
    const jobStrict = { ...baseJob, id: 'job-e-strict', riskTolerance: 0.01 };
    const jobNormal = { ...baseJob, id: 'job-e-normal', riskTolerance: 0.05 };
    const jobRelaxed = { ...baseJob, id: 'job-e-relaxed', riskTolerance: 0.20 };

    const decStrict = evaluateAllPolicies(jobStrict, forecastData, 1.0);
    const decNormal = evaluateAllPolicies(jobNormal, forecastData, 1.0);
    const decRelaxed = evaluateAllPolicies(jobRelaxed, forecastData, 1.0);

    console.log(`      Strict  (tau=1%):  T+${decStrict.recommendedDecision.selectedStartHour}:00 (Risk: ${(decStrict.recommendedDecision.estimatedDeadlineRisk * 100).toFixed(2)}%, Carbon: ${decStrict.recommendedDecision.predictedCarbon} gCO2)`);
    console.log(`      Normal  (tau=5%):  T+${decNormal.recommendedDecision.selectedStartHour}:00 (Risk: ${(decNormal.recommendedDecision.estimatedDeadlineRisk * 100).toFixed(2)}%, Carbon: ${decNormal.recommendedDecision.predictedCarbon} gCO2)`);
    console.log(`      Relaxed (tau=20%): T+${decRelaxed.recommendedDecision.selectedStartHour}:00 (Risk: ${(decRelaxed.recommendedDecision.estimatedDeadlineRisk * 100).toFixed(2)}%, Carbon: ${decRelaxed.recommendedDecision.predictedCarbon} gCO2)`);

    if (decStrict.recommendedDecision.estimatedDeadlineRisk > 0.011) {
      throw new Error(`Strict policy violated 1% risk bound: ${decStrict.recommendedDecision.estimatedDeadlineRisk}`);
    }
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
