/**
 * CarbonRoute Uncertainty & Calibration Controller
 *
 * Exposes endpoints for inspecting calibrated uncertainty models,
 * querying holdout test evaluation metrics, and triggering re-calibration.
 */

import { Request, Response } from 'express';
import * as fs from 'fs';
import { CalibrationService } from '../services/calibrationService';

/**
 * GET /api/uncertainty/model
 * Returns the currently active calibrated uncertainty model artifact.
 */
export async function getUncertaintyModel(req: Request, res: Response): Promise<void> {
  try {
    const region = req.query.region as string | undefined;
    const model = CalibrationService.getLoadedModel();

    if (region) {
      const regModel = model.regions[region];
      if (!regModel) {
        res.status(404).json({
          success: false,
          error: `Region '${region}' not found in calibrated model. Available regions: ${Object.keys(
            model.regions
          ).join(', ')}`,
        });
        return;
      }
      res.json({
        success: true,
        region: regModel,
        version: model.version,
        calibrationTimestamp: model.calibrationTimestamp,
      });
      return;
    }

    res.json({
      success: true,
      data: model,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to retrieve calibrated uncertainty model',
    });
  }
}

/**
 * GET /api/uncertainty/evaluation
 * Returns the empirical holdout test evaluation metrics:
 * Coverage rates (95%, 90%, 80%), Brier scores, ECE, reliability diagram curve points.
 */
export async function getUncertaintyEvaluation(_req: Request, res: Response): Promise<void> {
  try {
    const report = CalibrationService.getLoadedReport();
    res.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to retrieve calibration evaluation report',
    });
  }
}

/**
 * POST /api/uncertainty/calibrate
 * Triggers an on-demand re-calibration run on historical training data
 * and re-evaluates against the holdout test partition.
 */
export async function triggerRecalibration(_req: Request, res: Response): Promise<void> {
  try {
    const trainPath = CalibrationService.getTrainDataPath();
    const testPath = CalibrationService.getTestDataPath();

    if (!fs.existsSync(trainPath) || !fs.existsSync(testPath)) {
      res.status(400).json({
        success: false,
        error: 'Calibration data files missing. Please run data generation script first.',
      });
      return;
    }

    const trainRaw = fs.readFileSync(trainPath, 'utf-8');
    const trainData = JSON.parse(trainRaw);

    const testRaw = fs.readFileSync(testPath, 'utf-8');
    const testData = JSON.parse(testRaw);

    // Calibrate model
    const model = CalibrationService.calibrate(trainData);
    // Evaluate model on holdout set
    const report = CalibrationService.evaluate(model, testData);
    // Save artifacts
    CalibrationService.saveArtifacts(model, report);

    res.json({
      success: true,
      message: 'Uncertainty model successfully recalibrated and verified against holdout set.',
      data: {
        version: model.version,
        calibrationTimestamp: model.calibrationTimestamp,
        trainingSamples: model.trainingSamples,
        testSamples: report.testSamples,
        overallMae: report.overallMetrics.mae,
        overallRmse: report.overallMetrics.rmse,
        coverage95Gaussian: report.coverageMetrics.nominal95_gaussian,
        coverage95Quantile: report.coverageMetrics.nominal95_empiricalQuantile,
        expectedCalibrationError: report.expectedCalibrationError.ece,
        overallBrierScore: report.brierScore.overall,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to execute uncertainty calibration',
    });
  }
}
