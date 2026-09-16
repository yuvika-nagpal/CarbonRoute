/**
 * CarbonRoute Uncertainty Model Calibration Runner
 *
 * Ingests empirical historical training trace data, fits horizon-dependent
 * empirical uncertainty distributions (stdDev, bias, quantiles, normality),
 * evaluates calibration metrics on holdout test partition, and saves
 * versioned model artifacts:
 *   - backend/models/uncertainty_model.json
 *   - backend/models/calibration_report.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { CalibrationService } from '../src/services/calibrationService';
import { generateDataset } from './generateHistoricalData';

async function main() {
  console.log('===============================================================');
  console.log('  CARBONROUTE EMPIRICAL UNCERTAINTY CALIBRATION PIPELINE');
  console.log('===============================================================\n');

  const trainPath = CalibrationService.getTrainDataPath();
  const testPath = CalibrationService.getTestDataPath();

  // If datasets do not exist, generate them
  if (!fs.existsSync(trainPath) || !fs.existsSync(testPath)) {
    console.log('Calibration datasets missing. Generating synthetic historical partitions...');
    const { train, test } = generateDataset(60, 24);
    const calDir = path.dirname(trainPath);
    if (!fs.existsSync(calDir)) fs.mkdirSync(calDir, { recursive: true });
    fs.writeFileSync(trainPath, JSON.stringify(train, null, 2), 'utf-8');
    fs.writeFileSync(testPath, JSON.stringify(test, null, 2), 'utf-8');
  }

  console.log(`Loading training partition from: ${trainPath}`);
  const trainRaw = fs.readFileSync(trainPath, 'utf-8');
  const trainData = JSON.parse(trainRaw);
  console.log(`-> Loaded ${trainData.length} training observations (70% chronological partition).`);

  console.log(`Loading holdout test partition from: ${testPath}`);
  const testRaw = fs.readFileSync(testPath, 'utf-8');
  const testData = JSON.parse(testRaw);
  console.log(`-> Loaded ${testData.length} test observations (30% holdout validation partition).\n`);

  console.log('Fitting empirical uncertainty distributions across (region, horizon)...');
  const model = CalibrationService.calibrate(trainData);
  console.log(`-> Calibrated model version: ${model.version}`);
  console.log(`-> Regions calibrated: ${Object.keys(model.regions).join(', ')}`);

  console.log('\nEvaluating calibrated model against holdout test partition...');
  const report = CalibrationService.evaluate(model, testData);

  console.log('\n===============================================================');
  console.log('  EVALUATION & CALIBRATION METRICS (HOLDOUT TEST PARTITION)');
  console.log('===============================================================');
  console.log(`Test Sample Count: ${report.testSamples}`);
  console.log(`Overall MAE:       ${report.overallMetrics.mae} gCO2eq/kWh`);
  console.log(`Overall RMSE:      ${report.overallMetrics.rmse} gCO2eq/kWh`);
  console.log(`Overall Bias:      ${report.overallMetrics.meanBias} gCO2eq/kWh`);
  console.log(`Overall Brier:     ${report.brierScore.overall}`);
  console.log(`Expected Cal Error:${(report.expectedCalibrationError.ece * 100).toFixed(2)}% (ECE = ${report.expectedCalibrationError.ece})`);

  console.log('\n--- Prediction Interval Empirical Coverage ---');
  console.log(`Nominal 95% Interval:`);
  console.log(`  - Parametric Gaussian (±1.96σ):   ${report.coverageMetrics.nominal95_gaussian}%`);
  console.log(`  - Empirical Quantiles [q025,q975]: ${report.coverageMetrics.nominal95_empiricalQuantile}%`);
  console.log(`Nominal 90% Interval:`);
  console.log(`  - Parametric Gaussian (±1.645σ):  ${report.coverageMetrics.nominal90_gaussian}%`);
  console.log(`  - Empirical Quantiles [q05,q95]:   ${report.coverageMetrics.nominal90_empiricalQuantile}%`);
  console.log(`Nominal 80% Interval:`);
  console.log(`  - Parametric Gaussian (±1.282σ):  ${report.coverageMetrics.nominal80_gaussian}%`);
  console.log(`  - Empirical Quantiles [q10,q90]:   ${report.coverageMetrics.nominal80_empiricalQuantile}%`);

  console.log('\n--- Regional Breakdown ---');
  for (const [reg, met] of Object.entries(report.regionalBreakdown)) {
    console.log(`[${reg}]`);
    console.log(`  MAE: ${met.mae} | RMSE: ${met.rmse} | Bias: ${met.bias} gCO2eq/kWh`);
    console.log(`  Coverage (Nominal 95%): Gaussian=${met.coverage95Gaussian}% | Quantile=${met.coverage95Quantile}%`);
    console.log(`  Brier Score: ${met.brierScore}`);
  }

  console.log('\n--- Reliability Diagram Points (10 Probability Bins) ---');
  console.log('Bin Range    | Count | Mean Forecast P | Observed Freq | Cal Error');
  console.log('-------------|-------|-----------------|---------------|----------');
  for (const b of report.expectedCalibrationError.bins) {
    const range = `[${b.binStart.toFixed(1)}, ${b.binEnd.toFixed(1)})`.padEnd(12);
    const count = String(b.sampleCount).padEnd(5);
    const meanP = b.meanForecastProb.toFixed(4).padEnd(15);
    const obsF = b.observedFreq.toFixed(4).padEnd(13);
    const err = b.calibrationError.toFixed(4);
    console.log(`${range} | ${count} | ${meanP} | ${obsF} | ${err}`);
  }

  console.log('\nSaving calibrated artifacts to disk...');
  const { modelPath, reportPath } = CalibrationService.saveArtifacts(model, report);
  console.log(`-> Saved Model:  ${modelPath}`);
  console.log(`-> Saved Report: ${reportPath}`);

  console.log('\n[SUCCESS] Uncertainty calibration completed successfully.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Calibration failed:', err);
    process.exit(1);
  });
}
