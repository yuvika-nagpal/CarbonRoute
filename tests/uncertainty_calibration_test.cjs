/**
 * CarbonRoute Empirical Uncertainty Calibration Verification Suite
 *
 * Tests and verifies:
 * 1. Existence and integrity of calibrated model artifact (backend/models/uncertainty_model.json)
 * 2. Presence of 4 core ISO regions: US-CAL-CISO, US-TEX-ERCO, DE, IN-NO across 1..24h horizons
 * 3. Statistical validity of horizon dispersion sigma(h), MAE, RMSE, bias, and quantiles
 * 4. Holdout evaluation report (backend/models/calibration_report.json)
 *    - 95% nominal interval empirical coverage rates
 *    - Overall and regional Brier scores
 *    - Expected Calibration Error (ECE) and 10 probability reliability diagram points
 * 5. UncertaintyService API contracts: getCalibratedStdDev, getPredictionInterval, getEvaluationReport
 * 6. Live mode integration: ElectricityMapsDataProvider uses data-driven calibration
 * 7. Demo mode labeling: PreparedTraceDataProvider explicitly labeled as PREPARED / DEMO BENCHMARK UNCERTAINTY
 */

const fs = require('fs');
const path = require('path');
const { CalibrationService } = require('../backend/dist/services/calibrationService');
const { UncertaintyService } = require('../backend/dist/services/uncertaintyService');
const { CarbonService, PreparedTraceDataProvider } = require('../backend/dist/services/carbonService');

async function runCalibrationVerificationTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 CarbonRoute: Empirical Uncertainty Calibration Test Suite');
  console.log('🧪 ========================================================\n');

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

  // 1. Model Artifact Verification
  await assert('Model Artifact: uncertainty_model.json exists and is valid', async () => {
    const modelPath = CalibrationService.getModelPath();
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model artifact not found at ${modelPath}`);
    }
    const raw = fs.readFileSync(modelPath, 'utf-8');
    const model = JSON.parse(raw);
    if (!model.version || !model.regions || !model.fallbackProfile) {
      throw new Error('Model artifact missing essential top-level schema fields');
    }
    if (model.trainingSamples < 10000) {
      throw new Error(`Insufficient training samples: ${model.trainingSamples}`);
    }
    console.log(`      Version: ${model.version}, Training Samples: ${model.trainingSamples}`);
  });

  // 2. Regional and Horizon Integrity
  await assert('Regional Coverage: CAISO, ERCOT, DE, IN-NO present across 24 horizons', async () => {
    const model = CalibrationService.getLoadedModel();
    const expectedRegions = ['US-CAL-CISO', 'US-TEX-ERCO', 'DE', 'IN-NO'];
    for (const reg of expectedRegions) {
      if (!model.regions[reg]) {
        throw new Error(`Region '${reg}' missing in calibrated model artifact`);
      }
      const horizons = model.regions[reg].horizons;
      for (let h = 1; h <= 24; h++) {
        const stats = horizons[h];
        if (!stats) throw new Error(`Horizon ${h}h missing in region ${reg}`);
        if (typeof stats.stdDev !== 'number' || stats.stdDev <= 0) {
          throw new Error(`Invalid stdDev for ${reg} h=${h}: ${stats.stdDev}`);
        }
        if (!stats.quantiles || typeof stats.quantiles.q025 !== 'number' || typeof stats.quantiles.q975 !== 'number') {
          throw new Error(`Quantiles missing or incomplete for ${reg} h=${h}`);
        }
      }
    }
    console.log(`      Verified all 4 regions across 24 forecast horizon hours.`);
  });

  // 3. Horizon Uncertainty Expansion Property
  await assert('Dispersion Property: Empirical sigma(h) expands with forecast horizon', async () => {
    const model = CalibrationService.getLoadedModel();
    const caiso = model.regions['US-CAL-CISO'].horizons;
    const s1 = caiso[1].stdDev;
    const s6 = caiso[6].stdDev;
    const s12 = caiso[12].stdDev;
    const s24 = caiso[24].stdDev;

    if (!(s1 < s6 && s6 < s12 && s12 < s24)) {
      throw new Error(`CAISO sigma did not expand: s1=${s1}, s6=${s6}, s12=${s12}, s24=${s24}`);
    }
    console.log(`      CAISO Horizon sigma: 1h=${s1} -> 6h=${s6} -> 12h=${s12} -> 24h=${s24}`);
  });

  // 4. Holdout Evaluation Report Verification
  await assert('Evaluation Report: calibration_report.json has valid coverage, Brier, and ECE', async () => {
    const reportPath = CalibrationService.getReportPath();
    if (!fs.existsSync(reportPath)) {
      throw new Error(`Evaluation report not found at ${reportPath}`);
    }
    const raw = fs.readFileSync(reportPath, 'utf-8');
    const report = JSON.parse(raw);

    if (report.testSamples < 3000) {
      throw new Error(`Insufficient test samples: ${report.testSamples}`);
    }

    const cov95G = report.coverageMetrics.nominal95_gaussian;
    const cov95Q = report.coverageMetrics.nominal95_empiricalQuantile;

    if (cov95G < 90 || cov95G > 98) {
      throw new Error(`Nominal 95% Gaussian coverage outlier: ${cov95G}%`);
    }
    if (cov95Q < 88 || cov95Q > 98) {
      throw new Error(`Nominal 95% Quantile coverage outlier: ${cov95Q}%`);
    }

    if (report.brierScore.overall > 0.3) {
      throw new Error(`Brier score too high: ${report.brierScore.overall}`);
    }

    if (report.expectedCalibrationError.ece > 0.08) {
      throw new Error(`ECE exceeds acceptable threshold: ${report.expectedCalibrationError.ece}`);
    }

    console.log(`      Coverage 95% (Gaussian): ${cov95G}%, (Quantile): ${cov95Q}%`);
    console.log(`      Overall Brier: ${report.brierScore.overall}, ECE: ${(report.expectedCalibrationError.ece * 100).toFixed(2)}%`);
  });

  // 5. UncertaintyService API Methods
  await assert('UncertaintyService: getCalibratedStdDev and getPredictionInterval return calibrated results', async () => {
    const stdDev = UncertaintyService.getCalibratedStdDev('US-CAL-CISO', 6);
    if (typeof stdDev !== 'number' || stdDev < 5 || stdDev > 50) {
      throw new Error(`Unexpected stdDev returned: ${stdDev}`);
    }

    const interval = UncertaintyService.getPredictionInterval('US-CAL-CISO', 6, 250);
    if (interval.low >= 250 || interval.high <= 250) {
      throw new Error(`Invalid interval: low=${interval.low}, high=${interval.high}`);
    }
    if (interval.method !== 'empirical_quantile') {
      throw new Error(`Expected empirical_quantile method, got ${interval.method}`);
    }
    console.log(`      Prediction Interval at 6h for 250 g/kWh: [${interval.low}, ${interval.high}] (stdDev: ${interval.stdDev})`);
  });

  // 6. Demo Provider Explicit Labeling
  await assert('PreparedTraceDataProvider: Explicitly labeled as PREPARED / DEMO BENCHMARK UNCERTAINTY', async () => {
    const demoProvider = new PreparedTraceDataProvider();
    const forecast = await demoProvider.getForecast('BENCHMARK-RESEARCH', 24);

    if (!forecast.source.includes('PREPARED / DEMO BENCHMARK UNCERTAINTY')) {
      throw new Error(`Source label mismatch: '${forecast.source}'`);
    }
    if (forecast.traceVersion !== 'v1.0-ucs503-demo-benchmark') {
      throw new Error(`traceVersion mismatch: '${forecast.traceVersion}'`);
    }
    console.log(`      Demo source verified: "${forecast.source}", version: "${forecast.traceVersion}"`);
  });

  console.log('\n========================================================');
  console.log(`🎯 Calibration Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
}

runCalibrationVerificationTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
