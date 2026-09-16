import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CarbonService } from '../services/carbonService';
import { SchedulerService, WorkloadJob } from '../services/schedulerService';
import { K8sConnector } from '../services/k8sConnector';

// In-memory store for registered jobs & experiments
const registeredJobs = new Map<string, WorkloadJob>();
const experimentRecords: any[] = [
  {
    id: 'exp-init-001',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    region: 'US-CAL-CISO',
    workload: 'Batch ML Training (ResNet-50)',
    durationHours: 2,
    deadlineHours: 12,
    riskTolerance: 0.05,
    selectedScheduler: 'CarbonRoute Optimization',
    selectedStartHour: 8,
    predictedCarbon: 170,
    waitingTimeHours: 8,
    deadlineRisk: 0.0,
    status: 'Scheduled',
  },
  {
    id: 'exp-init-002',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    region: 'US-TEX-ERCO',
    workload: 'Synthetic Trace Batch (N=50)',
    durationHours: 3,
    deadlineHours: 10,
    riskTolerance: 0.10,
    selectedScheduler: 'Deterministic Carbon-Aware',
    selectedStartHour: 3,
    predictedCarbon: 190,
    waitingTimeHours: 3,
    deadlineRisk: 0.0,
    status: 'Scheduled',
  },
];

export const submitJob = (req: Request, res: Response) => {
  try {
    const {
      name,
      commandOrImage,
      isContainerImage = true,
      durationHours = 2,
      deadlineHours = 12,
      arrivalHour = 0,
      cpu = 1,
      memoryMb = 512,
      region = 'US-CAL-CISO',
      riskTolerance = 0.05,
    } = req.body;

    if (!name || (!commandOrImage && !req.body.command)) {
      return res.status(400).json({
        success: false,
        message: 'Job Name and Command/Container Image are required.',
      });
    }

    const job: WorkloadJob = {
      id: `job-${uuidv4().substring(0, 8)}`,
      name: String(name),
      commandOrImage: String(commandOrImage || req.body.command),
      isContainerImage: Boolean(isContainerImage),
      durationHours: Number(durationHours),
      deadlineHours: Number(deadlineHours),
      arrivalHour: Number(arrivalHour),
      cpu: Number(cpu),
      memoryMb: Number(memoryMb),
      region: String(region),
      riskTolerance: Number(riskTolerance),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    registeredJobs.set(job.id, job);

    return res.status(201).json({
      success: true,
      message: `Workload "${job.name}" registered successfully.`,
      data: job,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const scheduleJob = async (req: Request, res: Response) => {
  try {
    const {
      jobId,
      jobData,
      region = 'US-CAL-CISO',
      uncertaintyMultiplier = 1.0,
    } = req.body;

    let targetJob: WorkloadJob | undefined;

    if (jobId && registeredJobs.has(jobId)) {
      targetJob = registeredJobs.get(jobId);
    } else if (jobData) {
      targetJob = {
        id: jobData.id || `job-${uuidv4().substring(0, 8)}`,
        name: jobData.name || 'Sample Batch Job',
        commandOrImage: jobData.commandOrImage || 'carbonroute/test-workload:latest',
        isContainerImage: jobData.isContainerImage ?? true,
        durationHours: Number(jobData.durationHours) || 2,
        deadlineHours: Number(jobData.deadlineHours) || 12,
        arrivalHour: Number(jobData.arrivalHour) || 0,
        cpu: Number(jobData.cpu) || 1,
        memoryMb: Number(jobData.memoryMb) || 512,
        region: jobData.region || region,
        riskTolerance: Number(jobData.riskTolerance) || 0.05,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      registeredJobs.set(targetJob.id, targetJob);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either jobId or jobData is required for scheduling.',
      });
    }

    const mode: 'live' | 'demo' =
      req.body.mode === 'demo' || req.body.dataSource === 'demo' ? 'demo' : 'live';

    const targetRegion = targetJob!.region || region;
    const forecast = await CarbonService.getForecast(targetRegion, 24, mode);
    const decisionResponse = SchedulerService.evaluateAllPolicies(
      targetJob!,
      forecast,
      Number(uncertaintyMultiplier)
    );

    targetJob!.status = 'scheduled';

    return res.json({
      success: true,
      data: decisionResponse,
    });
  } catch (error: any) {
    return res.status(503).json({
      success: false,
      message: error.message || 'Live carbon forecast unavailable.',
    });
  }
};

export const dispatchJobToExecution = async (req: Request, res: Response) => {
  try {
    const jobId = String(req.params.id);
    const job = registeredJobs.get(jobId);
    const {
      predictedCarbon = 200,
      scheduledHour = 0,
    } = req.body;

    const command = job?.commandOrImage || 'python workload.py';
    const cpu = job?.cpu || 1;
    const memoryMb = job?.memoryMb || 512;

    const executionRecord = await K8sConnector.dispatchJob(
      job || jobId,
      { predictedCarbon: Number(predictedCarbon), selectedStartHour: Number(scheduledHour) },
      command,
      cpu,
      memoryMb,
      Number(predictedCarbon)
    );

    return res.json({
      success: true,
      message: 'Workload execution is disabled in the current research prototype milestone. Declarative manifest preview generated.',
      data: executionRecord,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getJobStatus = (req: Request, res: Response) => {
  const jobId = String(req.params.id);
  const execution = K8sConnector.getJobExecution(jobId);

  if (!execution) {
    const registered = registeredJobs.get(jobId);
    if (registered) {
      return res.json({
        success: true,
        data: {
          jobId,
          status: registered.status,
          logs: ['[Waiting] Workload registered. Execution integration scheduled for next research milestone.'],
        },
      });
    }
    return res.status(404).json({ success: false, message: 'Job execution not found.' });
  }

  return res.json({
    success: true,
    data: execution,
  });
};

export const getJobResults = (req: Request, res: Response) => {
  const jobId = String(req.params.id);
  const execution = K8sConnector.getJobExecution(jobId);

  if (!execution) {
    return res.status(404).json({ success: false, message: 'No execution results found.' });
  }

  return res.json({
    success: true,
    data: {
      jobId: execution.jobId,
      k8sJobName: execution.k8sJobName,
      status: execution.status,
      scheduledStartTime: execution.scheduledStartTime,
      durationHours: execution.durationHours,
      predictedCarbon: execution.predictedCarbon,
      clusterMode: execution.clusterMode,
      clusterNotice: execution.clusterNotice,
      logs: execution.logs,
      manifestPreview: execution.manifestPreview,
      executionDisabled: execution.executionDisabled,
    },
  });
};

export const getJobManifest = (req: Request, res: Response) => {
  try {
    const jobId = String(req.params.id);
    const job = registeredJobs.get(jobId) || { id: jobId, cpu: 1, memoryMb: 512, region: 'US-CAL-CISO' };
    const scheduledHour = Number(req.query.hour) || 0;
    const manifest = K8sConnector.generateJobManifest(job, scheduledHour);
    return res.json({ success: true, data: manifest });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCarbonForecast = async (req: Request, res: Response) => {
  try {
    const region = String(req.query.region || 'US-CAL-CISO');
    const horizon = Number(req.query.horizon) || 24;
    const mode: 'live' | 'demo' =
      req.query.mode === 'demo' || req.query.dataSource === 'demo' ? 'demo' : 'live';
    const data = await CarbonService.getForecast(region, horizon, mode);
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(503).json({
      success: false,
      message: error.message || 'Live carbon forecast unavailable.',
    });
  }
};

export const getAvailableRegions = (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: CarbonService.getAvailableRegions(),
  });
};

export const getClusterHealth = async (_req: Request, res: Response) => {
  const health = await K8sConnector.checkClusterHealth();
  return res.json({ success: true, data: health });
};

export const recordExperiment = (req: Request, res: Response) => {
  try {
    const exp = {
      id: `exp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...req.body,
    };
    experimentRecords.unshift(exp);
    return res.status(201).json({ success: true, data: exp });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getExperiments = (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: experimentRecords,
  });
};
