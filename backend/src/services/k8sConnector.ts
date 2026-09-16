/**
 * CarbonRoute Kubernetes & Execution Integration Connector
 *
 * Prototype Milestone Specification:
 * - Provides declarative Kubernetes batch/v1 Job manifest synthesis.
 * - Workload execution is disabled in the current prototype milestone.
 * - No artificial execution runtimes (no 5-second/8-second fake timeouts).
 * - No fabricated realized carbon or random grid variance perturbations.
 * - Actual execution and energy measurement will be integrated in a future milestone.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface K8sJobExecutionRecord {
  success: boolean;
  jobId: string;
  k8sJobName: string;
  podId?: string;
  podName?: string;
  namespace: string;
  status: 'pending' | 'preview' | 'disabled_in_prototype';
  containerImage: string;
  command: string;
  scheduledStartTime: string;
  logs: string[];
  clusterMode: 'manifest_preview';
  clusterNotice: string;
  predictedCarbon: number;
  durationHours: number;
  manifestPreview: any;
  executionDisabled: boolean;
  realizedCarbon?: null;
  carbonError?: null;
}

// In-memory active record store
const executionRecords = new Map<string, K8sJobExecutionRecord>();

export class K8sConnector {
  /**
   * Checks if local Minikube / Kubectl cluster is accessible
   */
  public static async checkClusterHealth(): Promise<{ isAvailable: boolean; message: string }> {
    try {
      const { stdout } = await execAsync('kubectl cluster-info --request-timeout=2s');
      return {
        isAvailable: true,
        message: stdout.split('\n')[0] || 'Kubernetes cluster reachable.',
      };
    } catch {
      return {
        isAvailable: false,
        message:
          'Local Minikube/Kubernetes cluster not detected (Workload execution disabled in current prototype milestone).',
      };
    }
  }

  /**
   * Generates a valid declarative Kubernetes batch/v1 Job manifest from workload parameters
   */
  public static generateJobManifest(
    job: any,
    scheduledHour: number = 0,
    k8sJobName?: string
  ): any {
    const rawId = typeof job === 'object' && job !== null ? (job.id || 'job') : String(job || 'job');
    const cleanId = String(rawId).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 16);
    const name = k8sJobName || `carbonroute-${cleanId}`;
    const cpu = typeof job === 'object' && job !== null ? (job.cpu || 1) : 1;
    const memoryMb = typeof job === 'object' && job !== null ? (job.memoryMb || 512) : 512;

    let containerImage = 'ghcr.io/carbonroute/workload-synthetic:latest';
    let containerCommand: string[] = ['python', '/app/workload.py'];

    if (typeof job === 'object' && job !== null) {
      if (job.isContainerImage && job.commandOrImage && !job.commandOrImage.startsWith('python')) {
        containerImage = job.commandOrImage;
        containerCommand = ['sh', '-c', 'echo "Starting container workload..."'];
      } else if (job.commandOrImage) {
        containerCommand = ['sh', '-c', job.commandOrImage];
      }
    }

    return {
      apiVersion: 'batch/v1',
      kind: 'Job',
      metadata: {
        name,
        namespace: 'carbonroute-jobs',
        labels: {
          app: 'carbonroute-workload',
          'carbonroute.io/job-id': String(rawId),
          'carbonroute.io/scheduled-hour': `T+${scheduledHour}:00`,
          'carbonroute.io/managed-by': 'carbonroute-scheduler',
        },
      },
      spec: {
        backoffLimit: 2,
        ttlSecondsAfterFinished: 3600,
        template: {
          metadata: {
            name: `${name}-pod`,
            labels: {
              app: 'carbonroute-workload',
              'carbonroute.io/job-id': String(rawId),
            },
          },
          spec: {
            restartPolicy: 'Never',
            containers: [
              {
                name: 'batch-worker',
                image: containerImage,
                command: containerCommand,
                resources: {
                  limits: {
                    cpu: `${cpu}`,
                    memory: `${memoryMb}Mi`,
                  },
                  requests: {
                    cpu: `${Math.max(0.1, Number((cpu * 0.5).toFixed(1)))}`,
                    memory: `${Math.max(64, Math.round(memoryMb * 0.5))}Mi`,
                  },
                },
              },
            ],
          },
        },
      },
    };
  }

  /**
   * Prototype Dispatch handler:
   * Rather than running a fake 5-second/8-second execution, returns a declarative
   * execution manifest preview and clearly notes that physical execution is scheduled
   * for a future milestone.
   */
  public static async dispatchJob(
    jobOrId: any,
    containerImageOrDecision?: any,
    command?: string,
    cpu?: number,
    memoryMb?: number,
    predictedCarbon?: number
  ): Promise<K8sJobExecutionRecord> {
    let jobId: string;
    let containerImage: string;
    let cmd: string;
    let cores: number;
    let ram: number;
    let carbon: number;
    let durHours: number = 2;

    if (typeof jobOrId === 'object' && jobOrId !== null) {
      jobId = String(jobOrId.id || 'job-unknown');
      containerImage = jobOrId.isContainerImage
        ? jobOrId.commandOrImage
        : 'ghcr.io/carbonroute/workload-synthetic:latest';
      cmd = jobOrId.commandOrImage || 'python workload.py';
      cores = Number(jobOrId.cpu) || 1;
      ram = Number(jobOrId.memoryMb) || 512;
      durHours = Number(jobOrId.durationHours) || 2;
      carbon =
        typeof containerImageOrDecision === 'object' && containerImageOrDecision !== null
          ? Number(containerImageOrDecision.predictedCarbon) || 200
          : Number(predictedCarbon) || 200;
    } else {
      jobId = String(jobOrId || 'job-unknown');
      containerImage =
        typeof containerImageOrDecision === 'string'
          ? containerImageOrDecision
          : 'ghcr.io/carbonroute/workload-synthetic:latest';
      cmd = command || 'python workload.py';
      cores = Number(cpu) || 1;
      ram = Number(memoryMb) || 512;
      carbon = Number(predictedCarbon) || 200;
    }

    const cleanId = jobId.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 16);
    const k8sJobName = `carbonroute-${cleanId}`;
    const now = new Date();
    const manifest = this.generateJobManifest(
      { id: jobId, cpu: cores, memoryMb: ram, commandOrImage: cmd, isContainerImage: true },
      0,
      k8sJobName
    );

    const record: K8sJobExecutionRecord = {
      success: true,
      jobId,
      k8sJobName,
      namespace: 'carbonroute-jobs',
      status: 'disabled_in_prototype',
      containerImage,
      command: cmd,
      scheduledStartTime: now.toISOString(),
      durationHours: durHours,
      predictedCarbon: carbon,
      clusterMode: 'manifest_preview',
      clusterNotice:
        'Execution disabled in current research prototype. CarbonRoute evaluates and recommends execution windows; physical dispatch will be integrated after empirical validation is complete.',
      logs: [
        `[${now.toISOString()}] [Research Scope Notice] Workload execution is disabled in the current research prototype.`,
        `[${now.toISOString()}] [Manifest Generator] Declarative Kubernetes batch/v1 Job manifest synthesized for ${jobId}.`,
        `[${now.toISOString()}] Target Resources: ${cores} CPU Core(s), ${ram} MiB RAM.`,
        `[${now.toISOString()}] Workload duration: ${durHours} hour(s).`,
        `[${now.toISOString()}] Realized carbon validation and physical container execution are scheduled for the next research milestone.`,
      ],
      manifestPreview: manifest,
      executionDisabled: true,
    };

    executionRecords.set(jobId, record);
    return record;
  }

  public static getJobExecution(jobId: string): K8sJobExecutionRecord | undefined {
    return executionRecords.get(jobId);
  }

  public static getAllExecutions(): K8sJobExecutionRecord[] {
    return Array.from(executionRecords.values());
  }
}

// Top-level convenience exports
export function generateJobManifest(job: any, scheduledHour?: number, k8sJobName?: string): any {
  return K8sConnector.generateJobManifest(job, scheduledHour, k8sJobName);
}

export async function dispatchJob(
  jobOrId: any,
  containerImageOrDecision?: any,
  command?: string,
  cpu?: number,
  memoryMb?: number,
  predictedCarbon?: number
): Promise<K8sJobExecutionRecord> {
  return K8sConnector.dispatchJob(
    jobOrId,
    containerImageOrDecision,
    command,
    cpu,
    memoryMb,
    predictedCarbon
  );
}
