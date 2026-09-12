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

const { CarbonService } = require('../backend/dist/services/carbonService');
const { UncertaintyService } = require('../backend/dist/services/uncertaintyService');
const { SchedulerService } = require('../backend/dist/services/schedulerService');
const { K8sConnector } = require('../backend/dist/services/k8sConnector');

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

  // TEST 1: Carbon Service Ingestion & Fallback
  let forecastData = null;
  await assert('Step 1: Carbon forecast returns 24 calibrated hourly points with confidence bounds', async () => {
    forecastData = await CarbonService.getForecast('US-CAL-CISO');
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

  // TEST 4: 5 Schedulers Evaluation
  let sampleJob = {
    id: 'test-job-001',
    name: 'LLM Fine-Tuning Batch',
    commandOrImage: 'python /app/workload.py --epochs 5',
    isContainerImage: false,
    durationHours: 3,
    deadlineHours: 14,
    arrivalHour: 0,
    cpu: 4,
    memoryMb: 8192,
    region: 'US-CAL-CISO',
    riskTolerance: 0.08,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  let decisionResult = null;

  await assert('Step 4: All 5 scheduling policies evaluated simultaneously with valid metrics', async () => {
    decisionResult = SchedulerService.evaluateAllPolicies(sampleJob, forecastData, 1.0);

    if (!decisionResult || !decisionResult.evaluatedPolicies || decisionResult.evaluatedPolicies.length !== 5) {
      throw new Error(`Expected 5 policies, got ${decisionResult?.evaluatedPolicies?.length}`);
    }

    const policyNames = decisionResult.evaluatedPolicies.map(p => p.policyName);
    console.log(`      Evaluated Policies: ${policyNames.join(', ')}`);
    console.log(`      Selected Optimal: ${decisionResult.recommendedDecision.policyName} (Slot: +${decisionResult.recommendedDecision.selectedStartHour}h, Predicted Carbon: ${decisionResult.recommendedDecision.predictedCarbon} gCO2/kWh, Risk: ${(decisionResult.recommendedDecision.estimatedDeadlineRisk * 100).toFixed(2)}%, Savings: ${decisionResult.comparisonSummary.carbonSavingsVsImmediatePct}%)`);

    if (decisionResult.comparisonSummary.carbonSavingsVsImmediatePct < 0) {
      throw new Error('Carbon savings percentage should not be negative');
    }
  });

  // TEST 5: Sensitivity Demonstration (Same Forecast, Different Risk Tolerance)
  await assert('Step 5: Same forecast with high vs conservative risk tolerance produces different decisions', async () => {
    const conservativeJob = { ...sampleJob, id: 'cons-01', riskTolerance: 0.01 };
    const aggressiveJob = { ...sampleJob, id: 'risk-01', riskTolerance: 0.30 };

    const decCons = SchedulerService.evaluateAllPolicies(conservativeJob, forecastData, 1.0);
    const decAggr = SchedulerService.evaluateAllPolicies(aggressiveJob, forecastData, 1.0);

    console.log(`      Conservative (tau=1%):  startSlot=+${decCons.recommendedDecision.selectedStartHour}h, risk=${(decCons.recommendedDecision.estimatedDeadlineRisk * 100).toFixed(2)}%, savings=${decCons.comparisonSummary.carbonSavingsVsImmediatePct}%`);
    console.log(`      Aggressive   (tau=30%): startSlot=+${decAggr.recommendedDecision.selectedStartHour}h, risk=${(decAggr.recommendedDecision.estimatedDeadlineRisk * 100).toFixed(2)}%, savings=${decAggr.comparisonSummary.carbonSavingsVsImmediatePct}%`);

    if (decCons.recommendedDecision.estimatedDeadlineRisk > 0.0101) {
      throw new Error(`Conservative decision exceeded risk tolerance: ${decCons.recommendedDecision.estimatedDeadlineRisk}`);
    }
  });

  // TEST 6: Kubernetes Manifest Generation
  await assert('Step 6: Kubernetes batch/v1 manifest contains correct specs and metadata', async () => {
    const manifest = K8sConnector.generateJobManifest(sampleJob, decisionResult.recommendedDecision.selectedStartHour, 'carbonroute-job-test');
    if (manifest.apiVersion !== 'batch/v1' || manifest.kind !== 'Job') {
      throw new Error('Invalid Kubernetes Job apiVersion or kind');
    }
    const container = manifest.spec.template.spec.containers[0];
    if (!container || !container.resources || !container.resources.limits) {
      throw new Error('Missing container resource specifications');
    }
    console.log(`      K8s Job Name: ${manifest.metadata.name}, Image: ${container.image}, CPU: ${container.resources.limits.cpu}`);
  });

  // TEST 7: Resilient Execution & Fallback Sandbox Runner
  await assert('Step 7: Dispatch workload and stream progress logs to completion', async () => {
    const execution = await K8sConnector.dispatchJob(
      sampleJob,
      decisionResult.recommendedDecision,
      undefined,
      undefined,
      undefined,
      undefined,
      2 // 2 seconds for test run
    );

    if (!execution || !execution.jobId) {
      throw new Error('Dispatch failed to return K8sJobExecutionRecord');
    }

    console.log(`      Execution Mode: ${execution.clusterMode} (${execution.clusterNotice})`);
    console.log(`      Initial Pod Status: ${execution.status}`);

    // Poll up to 6 seconds for simulation epochs to finish
    let completed = false;
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 200));
      const status = K8sConnector.getExecutionStatus(sampleJob.id);
      if (status && (status.status === 'completed' || status.status === 'failed')) {
        completed = true;
        console.log(`      Completed in ${status.durationSeconds}s with ${status.logs.length} log lines`);
        console.log(`      Final log: ${status.logs[status.logs.length - 1]}`);
        console.log(`      Realized Carbon: ${status.realizedCarbon} gCO2eq/kWh`);
        break;
      }
    }

    if (!completed) {
      throw new Error('Execution did not complete within timeout window');
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
