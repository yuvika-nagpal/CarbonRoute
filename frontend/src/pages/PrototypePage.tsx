import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Zap,
  Activity,
  Server,
  BarChart3,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Terminal,
  Globe,
  ShieldCheck,
  Flame,
  Info,
  Layers,
  ChevronRight,
  RotateCw,
  ExternalLink,
  FileCode,
  X,
  Copy,
  Check,
  TrendingDown,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { api } from '../services/api';
import {
  WorkloadJob,
  CarbonForecastData,
  PolicyEvaluationResult,
  SchedulingDecisionResponse,
  K8sJobExecutionRecord,
} from '../types';
import { FeasibilityDemoVisualizer } from '../components/FeasibilityDemoVisualizer';

export const PrototypePage: React.FC = () => {
  // 1. Workload Form State
  const [jobName, setJobName] = useState<string>('ResNet-50 Batch Training');
  const [commandOrImage, setCommandOrImage] = useState<string>('carbonroute/test-workload:latest');
  const [isContainerImage, setIsContainerImage] = useState<boolean>(true);
  const [durationHours, setDurationHours] = useState<number>(2);
  const [deadlineHours, setDeadlineHours] = useState<number>(12);
  const [cpu, setCpu] = useState<number>(1);
  const [memoryMb, setMemoryMb] = useState<number>(512);
  const [region, setRegion] = useState<string>('US-CAL-CISO');
  const [riskTolerance, setRiskTolerance] = useState<number>(0.05);

  // 2. Data & Scheduling State
  const [dataSourceMode, setDataSourceMode] = useState<'live' | 'demo'>('live');
  const [forecast, setForecast] = useState<CarbonForecastData | null>(null);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [decision, setDecision] = useState<SchedulingDecisionResponse | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [candidateFilter, setCandidateFilter] = useState<'all' | 'feasible' | 'rejected'>('all');

  // 3. Kubernetes Manifest Preview State
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [manifestData, setManifestData] = useState<any>(null);
  const [manifestYaml, setManifestYaml] = useState<string>('');
  const [manifestLoading, setManifestLoading] = useState<boolean>(false);
  const [manifestCopied, setManifestCopied] = useState<boolean>(false);
  const [showManifestModal, setShowManifestModal] = useState<boolean>(false);
  const [clusterHealth, setClusterHealth] = useState<{ isAvailable: boolean; message: string } | null>(null);

  // Load Carbon Forecast on Region or Data Source Mode change
  const loadForecast = async (targetRegion: string, mode: 'live' | 'demo' = dataSourceMode) => {
    setForecastError(null);
    try {
      const res = await api.getCarbonForecast(targetRegion, mode);
      if (res.success && res.data) {
        setForecast(res.data);
      } else {
        setForecast(null);
        setForecastError(res.message || 'Live carbon forecast unavailable.');
      }
    } catch (err: any) {
      setForecast(null);
      setForecastError(err.message || 'Live carbon forecast unavailable.');
    }
  };

  const checkCluster = async () => {
    try {
      const res = await api.getClusterHealth();
      if (res.success && res.data) {
        setClusterHealth(res.data);
      }
    } catch {
      setClusterHealth({ isAvailable: false, message: 'Cluster status check offline.' });
    }
  };

  useEffect(() => {
    loadForecast(region, dataSourceMode);
    checkCluster();
  }, [region, dataSourceMode]);

  // Convert JSON manifest object to formatted YAML string
  const toYamlString = (obj: any, indent = 0): string => {
    const pad = '  '.repeat(indent);
    if (typeof obj !== 'object' || obj === null) {
      return String(obj);
    }
    if (Array.isArray(obj)) {
      return obj
        .map((item) => {
          if (typeof item === 'object' && item !== null) {
            const inner = toYamlString(item, indent + 1).trimStart();
            return `${pad}- ${inner}`;
          }
          return `${pad}- ${item}`;
        })
        .join('\n');
    }
    return Object.entries(obj)
      .map(([key, val]) => {
        if (typeof val === 'object' && val !== null) {
          return `${pad}${key}:\n${toYamlString(val, indent + 1)}`;
        }
        return `${pad}${key}: ${val}`;
      })
      .join('\n');
  };

  // Load or construct manifest preview
  const fetchManifestPreview = async (jobId: string, hour: number) => {
    setManifestLoading(true);
    try {
      const res = await api.getJobManifest(jobId, hour);
      if (res.success && res.data) {
        setManifestData(res.data.manifest || res.data);
        setManifestYaml(res.data.yamlPreview || toYamlString(res.data.manifest || res.data));
        return;
      }
    } catch (err) {
      console.warn('Backend manifest preview fallback:', err);
    }

    // Client-side fallback constructor
    const cleanId = (jobName || 'batch-job').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 16);
    const fallbackObj = {
      apiVersion: 'batch/v1',
      kind: 'Job',
      metadata: {
        name: `carbonroute-${cleanId}`,
        namespace: 'carbonroute-jobs',
        labels: {
          app: 'carbonroute-workload',
          'carbonroute.io/job-id': jobId || 'job-preview',
          'carbonroute.io/scheduled-hour': `T+${hour}`,
          'carbonroute.io/managed-by': 'carbonroute-scheduler',
        },
      },
      spec: {
        backoffLimit: 2,
        ttlSecondsAfterFinished: 3600,
        template: {
          metadata: {
            labels: {
              app: 'carbonroute-workload',
              'carbonroute.io/job-id': jobId || 'job-preview',
            },
          },
          spec: {
            restartPolicy: 'Never',
            containers: [
              {
                name: 'workload-runner',
                image: commandOrImage.startsWith('python') || commandOrImage.startsWith('tar')
                  ? 'ghcr.io/carbonroute/workload-synthetic:latest'
                  : commandOrImage,
                command: commandOrImage.startsWith('python')
                  ? ['python', '/app/workload.py', '--epochs', '5']
                  : ['sh', '-c', commandOrImage],
                resources: {
                  requests: { cpu: `${cpu}`, memory: `${memoryMb}Mi` },
                  limits: { cpu: `${cpu}`, memory: `${memoryMb}Mi` },
                },
                env: [
                  { name: 'CARBONROUTE_JOB_ID', value: jobId || 'job-preview' },
                  { name: 'CARBONROUTE_SCHEDULED_HOUR', value: String(hour) },
                  { name: 'CARBONROUTE_REGION', value: region },
                ],
              },
            ],
          },
        },
      },
    };
    setManifestData(fallbackObj);
    setManifestYaml(toYamlString(fallbackObj));
    setManifestLoading(false);
  };

  // Execute Scheduling Evaluation
  const handleEvaluateSchedule = async (e?: React.FormEvent, overrideMode?: 'live' | 'demo') => {
    if (e) e.preventDefault();
    const mode = overrideMode || dataSourceMode;
    setLoadingSchedule(true);
    setScheduleError(null);

    try {
      const jobData: Partial<WorkloadJob> = {
        name: jobName,
        commandOrImage,
        isContainerImage,
        durationHours,
        deadlineHours,
        arrivalHour: 0,
        cpu,
        memoryMb,
        region,
        riskTolerance,
      };

      const res = await api.scheduleJob({ jobData, region, mode });
      if (res.success && res.data) {
        setDecision(res.data);
        setActiveJobId(res.data.job.id);
        if (!forecast || forecast.region !== region || forecast.dataMode !== mode) {
          loadForecast(region, mode);
        }
        // Automatically fetch manifest preview for recommended start hour
        fetchManifestPreview(res.data.job.id, res.data.recommendedDecision.selectedStartHour);
      } else {
        setScheduleError(res.message || 'Scheduling evaluation failed.');
      }
    } catch (err: any) {
      setScheduleError(err.message || 'Network error during scheduling evaluation.');
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Run Scheduling once on mount
  useEffect(() => {
    handleEvaluateSchedule();
  }, []);

  // Preset Handlers
  const applyPreset = (
    name: string,
    cmdOrImg: string,
    dur: number,
    ddl: number,
    cpuCount: number,
    ram: number,
    tau: number,
    reg: string
  ) => {
    setJobName(name);
    setCommandOrImage(cmdOrImg);
    setIsContainerImage(!cmdOrImg.startsWith('python') && !cmdOrImg.startsWith('tar'));
    setDurationHours(dur);
    setDeadlineHours(ddl);
    setCpu(cpuCount);
    setMemoryMb(ram);
    setRiskTolerance(tau);
    setRegion(reg);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* 1. Header & Milestone Context */}
      <div className="space-y-4 pb-6 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">PROTOTYPE SCHEDULING RESEARCH DEMONSTRATOR</span>
            <span className="text-slate-500">&bull;</span>
            <span>Team TriFlux</span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
              API: <strong className="text-emerald-400">Online</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
              Execution: <strong className="text-amber-400">Declarative Preview Only</strong>
            </span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
          CarbonRoute Scheduling Decision Prototype
        </h1>
        <p className="text-sm text-slate-400 max-w-4xl leading-relaxed">
          Demonstrates carbon-aware batch scheduling: from flexible workload specification through live
          Electricity Maps carbon forecasting, candidate execution window evaluation, and risk-constrained carbon
          minimization to declarative Kubernetes <code className="text-emerald-400">batch/v1</code> Job manifest synthesis.
        </p>

        {/* Current Research Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono mt-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Current Prototype Capabilities</span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Live carbon forecast from Electricity Maps (point forecast in gCO2eq/kWh)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Candidate-window scheduling across continuous user-declared duration</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Deadline-aware scheduling with deterministic feasibility filtering</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>CarbonRoute recommendation &amp; 5-policy comparative matrix</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Declarative Kubernetes batch/v1 Job manifest synthesis</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Next Research Milestone</span>
            </div>
            <ul className="space-y-1.5 text-slate-400">
              <li className="flex items-center space-x-2">
                <span className="text-amber-400 font-bold">○</span>
                <span>Empirical carbon forecast uncertainty calibration (historical error archive)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-amber-400 font-bold">○</span>
                <span>Workload runtime distribution modeling (empirical execution history)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-amber-400 font-bold">○</span>
                <span>Brier score, ECE &amp; reliability diagram calibration</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-amber-400 font-bold">○</span>
                <span>Historical forecast-vs-realized post-hoc validation</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-amber-400 font-bold">○</span>
                <span>Live Kubernetes cluster dispatch &amp; physical hardware power measurement</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. SECTION A: JOB SUBMISSION */}
      <section className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                STEP 1 &bull; INPUT
              </span>
              <h2 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Submit Flexible Batch Workload</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Provide workload parameters and acceptable deadline risk tolerance &tau;.
            </p>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-500">Presets:</span>
            <button
              type="button"
              onClick={() => {
                setDataSourceMode('demo');
                applyPreset('ResNet-50 ML Training', 'carbonroute/test-workload:latest', 2, 12, 1, 512, 0.05, 'BENCHMARK-RESEARCH');
              }}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40"
            >
              1. Controlled Benchmark Demo
            </button>
            <button
              type="button"
              onClick={() =>
                applyPreset('Batch Data Transformation', 'python workload.py', 1, 6, 2, 1024, 0.10, 'US-TEX-ERCO')
              }
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40"
            >
              2. Data Pipeline
            </button>
            <button
              type="button"
              onClick={() =>
                applyPreset('DB Backup & Compression', 'tar -czf backup.tar.gz /data', 3, 9, 1, 256, 0.02, 'DE')
              }
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40"
            >
              3. Nightly Backup
            </button>
          </div>
        </div>

        <form onSubmit={handleEvaluateSchedule} className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
          {/* Workload Name */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">Workload Name</label>
            <input
              type="text"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              required
            />
            <span className="text-[10px] text-slate-500 block">Identifier for manifest &amp; telemetry</span>
          </div>

          {/* Container Image or Command */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">Container Image or Command</label>
            <input
              type="text"
              value={commandOrImage}
              onChange={(e) => setCommandOrImage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 focus:outline-none focus:border-emerald-500"
              required
            />
            <span className="text-[10px] text-slate-500 block">e.g. carbonroute/test-workload:latest or python workload.py</span>
          </div>

          {/* Grid Region */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">Target Grid Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              {dataSourceMode === 'demo' && (
                <option value="BENCHMARK-RESEARCH">
                  DEMO / BENCHMARK - Controlled Uncertainty Experiment
                </option>
              )}
              <option value="US-CAL-CISO">California (CAISO) — Solar duck-curve</option>
              <option value="US-TEX-ERCO">Texas (ERCOT) — Overnight wind surges</option>
              <option value="DE">Germany (Central Europe) — Mixed wind &amp; solar</option>
              <option value="IN-NO">Northern India — High thermal baseload &amp; midday solar</option>
            </select>
            <span className="text-[10px] text-slate-500 block">Queries selected region's live carbon profile</span>
          </div>

          {/* Carbon Data Source Mode */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-semibold">Carbon Data Source</label>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${
                  dataSourceMode === 'live'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {dataSourceMode === 'live' ? 'DEFAULT: LIVE' : 'DEMO BENCHMARK'}
              </span>
            </div>
            <select
              value={dataSourceMode}
              onChange={(e) => {
                const newMode = e.target.value as 'live' | 'demo';
                setDataSourceMode(newMode);
                if (newMode === 'demo' && (region === 'US-CAL-CISO' || !region)) {
                  setRegion('BENCHMARK-RESEARCH');
                } else if (newMode === 'live' && region === 'BENCHMARK-RESEARCH') {
                  setRegion('US-CAL-CISO');
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="live">Live Electricity Maps API (Production)</option>
              <option value="demo">Controlled Research Benchmark / Demo Trace</option>
            </select>
            <span className="text-[10px] text-slate-500 block">
              {dataSourceMode === 'live'
                ? 'Queries live point forecast from Electricity Maps API v3'
                : 'Uses calibrated research traces for offline reproducibility'}
            </span>
          </div>

          {/* Runtime Duration */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-slate-300 font-semibold">Expected Runtime Duration</label>
              <span className="text-emerald-400 font-bold">{durationHours} Hours</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={durationHours}
              onChange={(e) => setDurationHours(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <span className="text-[10px] text-slate-500 block">Workload execution block duration</span>
          </div>

          {/* Completion Deadline */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-slate-300 font-semibold">Completion Deadline</label>
              <span className="text-emerald-400 font-bold">T+{deadlineHours}:00</span>
            </div>
            <input
              type="range"
              min={durationHours}
              max="24"
              step="1"
              value={deadlineHours}
              onChange={(e) => setDeadlineHours(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <span className="text-[10px] text-slate-500 block">Maximum allowable finish time</span>
          </div>

          {/* Risk Tolerance tau */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-slate-300 font-semibold">Deadline Risk Tolerance (&tau;)</label>
              <span className="text-emerald-400 font-bold">{(riskTolerance * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.25"
              step="0.01"
              value={riskTolerance}
              onChange={(e) => setRiskTolerance(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <span className="text-[10px] text-slate-400 block">
              Deterministic feasibility enforced in current prototype; empirical runtime risk calibration planned for next research milestone.
            </span>
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={loadingSchedule}
              className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all font-mono flex items-center space-x-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSchedule ? 'animate-spin' : ''}`} />
              <span>Evaluate 5 Schedulers</span>
            </button>
          </div>
        </form>

        {/* Live Error Banner */}
        {(scheduleError || forecastError) && (
          <div className="mt-4 p-4 rounded-xl bg-rose-950/50 border border-rose-800/70 space-y-2 text-rose-200 font-mono text-xs">
            <div className="flex items-start space-x-2 font-bold text-rose-400">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{scheduleError || forecastError}</span>
            </div>
            {dataSourceMode === 'live' && (
              <div className="pt-2 border-t border-rose-900/50 flex flex-wrap items-center justify-between gap-3">
                <span className="text-slate-300 text-[11px]">
                  Electricity Maps live API requires <code className="text-emerald-300">ELECTRICITY_MAPS_API_KEY</code> on the backend. To evaluate the schedulers offline, switch to the calibrated benchmark trace:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDataSourceMode('demo');
                    handleEvaluateSchedule(undefined, 'demo');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all text-xs"
                >
                  Switch to Prepared Benchmark Trace (Demo)
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. SECTION B: CARBON INTENSITY FORECAST DATA */}
      {forecast && (
        <section className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  STEP 2 &bull; DATA
                </span>
                <h2 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Carbon Forecast: {forecast.regionName}</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                24-hour hourly lookahead intensity (gCO2eq/kWh).
              </p>
            </div>

            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${forecast.dataMode === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-400">Source:</span>
              <strong className="text-white">{forecast.source}</strong>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                forecast.dataMode === 'live'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
              }`}>
                {forecast.dataMode === 'live' ? 'LIVE ELECTRICITY MAPS' : 'CONTROLLED RESEARCH BENCHMARK'}
              </span>
            </div>
          </div>

          {/* Scientific Honesty Banner on Carbon Forecast Source & Uncertainty */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <Globe className="w-4 h-4" />
              <span>Carbon forecast source: Electricity Maps</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Electricity Maps provides the point carbon-intensity forecast. Forecast uncertainty is a separate quantity that must be estimated empirically from historical forecast errors.
            </p>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              {forecast.dataMode === 'live' ? (
                <span>
                  Uncertainty Calibration Status:{' '}
                  <strong className="text-amber-400">Not yet calibrated</strong> (historical forecast error archive not connected in live mode; point forecasts used directly).
                </span>
              ) : (
                <span>
                  Uncertainty Calibration Status:{' '}
                  <strong className="text-teal-400">Benchmark Demo Profile</strong> (controlled trace for algorithm validation).
                </span>
              )}
            </div>
          </div>

          {/* 24-Hour Horizon Bar Chart Visualization */}
          <div className="space-y-3">
            <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 items-end h-40 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              {forecast.hourlyProfile.map((point) => {
                const maxVal = forecast.maxCarbon || 500;
                const heightPercent = Math.max(15, Math.round((point.predictedCarbon / maxVal) * 100));
                const isOptimal = point.predictedCarbon === forecast.minCarbon;
                const isSelected = decision?.recommendedDecision.selectedStartHour === point.hour;

                return (
                  <div
                    key={point.hour}
                    className="flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    title={`T+${point.hour}:00: ${point.predictedCarbon} gCO2eq/kWh`}
                  >
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t transition-all ${
                        isSelected
                          ? 'bg-emerald-400 shadow-md shadow-emerald-500/50'
                          : isOptimal
                          ? 'bg-teal-400/80'
                          : 'bg-slate-700/60 hover:bg-slate-600'
                      }`}
                    />
                    <span className="text-[9px] text-slate-500 font-mono mt-1 hidden sm:block">
                      {point.hour}
                    </span>

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-30 w-44 p-2.5 bg-slate-900 text-[10px] font-mono text-slate-200 rounded border border-slate-700 shadow-xl pointer-events-none">
                      <div className="text-emerald-400 font-bold">T+{point.hour}:00</div>
                      <div>Intensity: {point.predictedCarbon} gCO2eq/kWh</div>
                      <div className="text-slate-400">
                        {point.uncertaintyAvailable && point.stdDev != null
                          ? `StdDev σ: ±${point.stdDev.toFixed(1)}`
                          : 'Uncertainty: Not calibrated'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 px-1">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-400" />
                  <span>CarbonRoute Selected Start</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-teal-400/80" />
                  <span>Global Carbon Minimum</span>
                </span>
              </div>
              <div>
                Min: <strong className="text-emerald-400">{forecast.minCarbon}</strong> &bull; Avg:{' '}
                <strong className="text-slate-200">{forecast.averageCarbon}</strong> &bull; Max:{' '}
                <strong className="text-rose-400">{forecast.maxCarbon}</strong> gCO2eq/kWh
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. SECTION C & D: SCHEDULING DECISION & POLICY COMPARISON */}
      {decision && (
        <section className="space-y-6">
          {/* SECTION D: ALL SCHEDULING OPTIONS (Candidate Scheduling Windows) */}
          {decision.candidateWindows && decision.candidateWindows.length > 0 && (
            <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                      STEP 3A &bull; CANDIDATE ENUMERATION
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2 mt-1">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>All Candidate Scheduling Windows</span>
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    Evaluating every continuous {durationHours}-hour window up to deadline (T+{deadlineHours})
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCandidateFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 ${
                      candidateFilter === 'all'
                        ? 'bg-slate-800 text-white font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>All Windows</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/60 text-slate-300">
                      {decision.candidateWindows.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateFilter('feasible')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 ${
                      candidateFilter === 'feasible'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-bold shadow'
                        : 'text-slate-400 hover:text-emerald-300'
                    }`}
                  >
                    <span>Feasible</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-900/60 text-emerald-300">
                      {decision.candidateWindows.filter((w) => w.isFeasible).length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateFilter('rejected')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 ${
                      candidateFilter === 'rejected'
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40 font-bold shadow'
                        : 'text-slate-400 hover:text-rose-300'
                    }`}
                  >
                    <span>Rejected</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-900/60 text-rose-300">
                      {decision.candidateWindows.filter((w) => !w.isFeasible).length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Candidate Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Execution Window</th>
                      <th className="p-3">Wait Delay</th>
                      <th className="p-3">Avg Grid Intensity (gCO2eq/kWh)</th>
                      <th className="p-3">Forecast Uncertainty</th>
                      <th className="p-3">Slack Time</th>
                      <th className="p-3">Feasibility</th>
                      <th className="p-3 min-w-[220px]">Evaluation Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {decision.candidateWindows
                      .filter((win) => {
                        if (candidateFilter === 'feasible') return win.isFeasible;
                        if (candidateFilter === 'rejected') return !win.isFeasible;
                        return true;
                      })
                      .map((win) => {
                        const isRec = win.classification === 'RECOMMENDED';

                        return (
                          <tr
                            key={win.slotIndex}
                            className={`transition-colors ${
                              isRec
                                ? 'bg-emerald-950/30 font-semibold border-l-2 border-l-emerald-500'
                                : 'hover:bg-slate-900/50'
                            }`}
                          >
                            <td className="p-3 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className="text-white font-bold">{win.windowLabel}</span>
                                {isRec && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                                    RECOMMENDED
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 whitespace-nowrap text-slate-300">
                              +{win.waitingTimeHours}h
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="text-emerald-400 font-bold">
                                {win.predictedCarbonIntensity.toFixed(1)}
                              </span>{' '}
                              <span className="text-slate-500 text-[10px]">gCO2eq/kWh</span>
                            </td>
                            <td className="p-3 whitespace-nowrap text-slate-300">
                              {win.uncertaintyStatus === 'calibrated' && win.stdDev != null ? (
                                <span>±{win.stdDev.toFixed(1)} σ</span>
                              ) : win.uncertaintyStatus === 'benchmark_demo' && win.stdDev != null ? (
                                <span className="text-teal-400">±{win.stdDev.toFixed(1)} σ (demo)</span>
                              ) : (
                                <span className="text-slate-500 italic">Not calibrated</span>
                              )}
                            </td>
                            <td className="p-3 whitespace-nowrap text-slate-400">
                              {win.slackHours >= 0 ? `${win.slackHours}h remaining` : `${Math.abs(win.slackHours)}h overrun`}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {isRec ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/50">
                                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  <span>RECOMMENDED</span>
                                </span>
                              ) : win.isFeasible ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-300 text-[11px] border border-sky-500/30">
                                  <span>FEASIBLE</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 text-[11px] border border-rose-500/40">
                                  <AlertCircle className="w-3 h-3 text-rose-400" />
                                  <span>REJECTED</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-400 text-[11px] leading-relaxed">
                              {win.reason}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CarbonRoute Highlight Card (CARBONROUTE RECOMMENDATION) */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-950/20 to-slate-900/80 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-emerald-500/30 gap-3">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500 text-slate-950">
                  STEP 3B &bull; CARBONROUTE RECOMMENDATION
                </span>
                <h3 className="text-xl font-extrabold text-white font-mono">
                  CarbonRoute Recommendation
                </h3>
              </div>

              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-xs font-mono text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Feasibility Enforced</span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/40 space-y-1">
                <span className="text-slate-400 block text-[11px]">Recommended Window</span>
                <div className="text-lg font-extrabold text-white">
                  {decision.recommendedDecision.selectedWindow}
                </div>
                <span className="text-slate-500 text-[10px]">Optimal start period</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/30 space-y-1">
                <span className="text-emerald-400 block text-[11px]">Predicted Grid Intensity</span>
                <div className="text-lg font-extrabold text-emerald-300">
                  {decision.recommendedDecision.predictedCarbonIntensity ?? decision.recommendedDecision.predictedCarbon}{' '}
                  <span className="text-xs text-slate-400">gCO2eq/kWh</span>
                </div>
                <span className="text-emerald-400/80 text-[10px]">
                  {decision.comparisonSummary.carbonSavingsVsImmediatePct}% reduction vs immediate
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Waiting Delay</span>
                <div className="text-lg font-extrabold text-white">
                  +{decision.recommendedDecision.waitingTimeHours} Hours
                </div>
                <span className="text-slate-500 text-[10px]">Intentional shift delay</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Deadline Compliance</span>
                <div className="text-lg font-extrabold text-emerald-400">
                  Guaranteed Feasible
                </div>
                <span className="text-slate-500 text-[10px]">
                  Finishes by T+{decision.recommendedDecision.selectedStartHour + durationHours}:00 (Deadline: T+{deadlineHours})
                </span>
              </div>
            </div>

            {/* Rationale Explanation */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 font-mono text-xs">
              <span className="text-emerald-400 font-bold block flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Decision Rationale:</span>
              </span>
              <p className="text-slate-300 leading-relaxed">
                {decision.recommendedDecision.rationale}
              </p>
            </div>

            {/* Execution Disablement Notice & Manifest Action */}
            <div className="pt-2 p-4 rounded-xl bg-slate-950/90 border border-amber-500/30 space-y-3 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Execution disabled in current research prototype</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed pt-1">
                    CarbonRoute currently evaluates and recommends an execution window. Actual workload execution will be integrated after the scheduling model and empirical validation are finalized.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowManifestModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold hover:text-emerald-300 hover:border-emerald-500/50 transition-all font-mono flex items-center space-x-2 shrink-0 self-start sm:self-auto"
                >
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>Inspect K8s Manifest</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION E: SCHEDULING TRADE-OFF VISUALIZER */}
          {(() => {
            const immPol = decision.evaluatedPolicies.find((p) => p.policyId === 'immediate');
            const detPol = decision.evaluatedPolicies.find((p) => p.policyId === 'deterministic_carbon');
            const recPol = decision.recommendedDecision;
            const immCarbon = immPol?.predictedCarbon ?? 0;
            const detCarbon = detPol?.predictedCarbon ?? 0;
            const recCarbon = recPol?.predictedCarbon ?? 0;

            return (
              <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                      <TrendingDown className="w-4 h-4 text-emerald-400" />
                      <span>Scheduling Trade-Off Visualizer (Carbon vs. Slack Margin)</span>
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-1">
                      Direct trade-off breakdown between immediate dispatch, greedy delay, and CarbonRoute's recommended schedule
                    </p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
                    Deadline: T+{deadlineHours}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono">
                  {/* Option 1: Immediate Execution */}
                  <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Option 1: Immediate
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          T+0:00
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="text-2xl font-extrabold text-white">
                          {immCarbon} <span className="text-xs font-normal text-slate-400">gCO2eq/kWh</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-slate-400">Wait Delay:</span>
                          <span className="text-white font-bold">0 Hours</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-slate-400">Slack Remaining:</span>
                          <span className="text-emerald-400 font-bold">{deadlineHours - durationHours}h</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                      Safe on-time completion, but incurs maximum carbon intensity because execution occurs immediately regardless of grid conditions.
                    </div>
                  </div>

                  {/* Option 2: Deterministic / Greedy Carbon */}
                  <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Option 2: Greedy Delay
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300">
                          T+{detPol?.waitingTimeHours || 0}:00
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="text-2xl font-extrabold text-amber-300">
                          {detCarbon} <span className="text-xs font-normal text-slate-400">gCO2eq/kWh</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-slate-400">Wait Delay:</span>
                          <span className="text-white font-bold">+{detPol?.waitingTimeHours || 0} Hours</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-slate-400">Slack Remaining:</span>
                          <span className="text-slate-300 font-bold">
                            {Math.max(0, deadlineHours - (detPol?.waitingTimeHours || 0) - durationHours)}h
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                      Greedily targets the lowest point forecast window within the deadline horizon.
                    </div>
                  </div>

                  {/* Option 3: CarbonRoute Optimum */}
                  <div className="p-5 rounded-xl bg-emerald-950/20 border-2 border-emerald-500/60 space-y-4 flex flex-col justify-between shadow-lg shadow-emerald-950/40 relative">
                    <div className="absolute -top-3 right-4 px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                      Optimal Balance
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          Option 3: CarbonRoute
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-500/40 text-emerald-300">
                          T+{recPol.waitingTimeHours}:00
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="text-2xl font-extrabold text-emerald-300">
                          {recCarbon} <span className="text-xs font-normal text-slate-400">gCO2eq/kWh</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-slate-400">Wait Delay:</span>
                          <span className="text-white font-bold">+{recPol.waitingTimeHours} Hours</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-slate-400">Carbon Reduction:</span>
                          <span className="text-emerald-300 font-bold">
                            -{decision.comparisonSummary.carbonSavingsVsImmediatePct}% vs Immediate
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-emerald-500/20 text-[11px] text-emerald-200/90 leading-relaxed">
                      Maximizes emissions reduction subject to deterministic deadline feasibility constraints.
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 5 Schedulers Policy Comparison Table */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>5-Policy Scheduling Comparison Matrix</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">
                Evaluated against identical 24h carbon profile
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Policy Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Selected Start</th>
                    <th className="p-3">Avg Intensity (gCO2eq/kWh)</th>
                    <th className="p-3">Wait Time</th>
                    <th className="p-3">Feasibility</th>
                    <th className="p-3">Overhead</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {decision.evaluatedPolicies.map((pol) => {
                    const isRecommended = pol.policyId === 'carbonroute_uncertainty';
                    return (
                      <tr
                        key={pol.policyId}
                        className={`hover:bg-slate-900/40 transition-colors ${
                          isRecommended ? 'bg-emerald-950/30 font-semibold' : ''
                        }`}
                      >
                        <td className="p-3 text-white flex items-center space-x-2">
                          {isRecommended && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          <span>{pol.policyName}</span>
                        </td>
                        <td className="p-3 text-slate-400">{pol.category}</td>
                        <td className="p-3 text-slate-200">T+{pol.selectedStartHour}:00</td>
                        <td className="p-3 text-emerald-400 font-bold">
                          {pol.predictedCarbonIntensity ?? pol.predictedCarbon} gCO2eq/kWh
                        </td>
                        <td className="p-3 text-slate-300">+{pol.waitingTimeHours}h</td>
                        <td className="p-3">
                          {pol.isFeasible ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                              Feasible
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-400 border border-rose-800 font-bold">
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400">{pol.schedulerOverheadMs} ms</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 5. SECTION E: DECLARATIVE KUBERNETES MANIFEST PREVIEW */}
      <section className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                STEP 4 &bull; INTEGRATION
              </span>
              <h3 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>Declarative Kubernetes Job Manifest Preview</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Synthesized declarative <code className="text-emerald-400">batch/v1</code> Job specification for downstream cluster dispatch.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800/60">
              Execution: Disabled in Prototype
            </span>
          </div>
        </div>

        {/* Prototype Scope Notice */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2 text-slate-300">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <Info className="w-4 h-4" />
            <span>Research Prototype Notice:</span>
          </div>
          <p className="leading-relaxed text-slate-400">
            CarbonRoute operates as a scheduling decision engine. The prototype outputs declarative Kubernetes manifests configured with the optimal execution window annotations, ready for deployment via standard cluster GitOps workflows (<code className="text-emerald-300">kubectl apply -f</code>). Direct in-prototype workload dispatch and physical hardware power telemetry will be integrated in the next milestone.
          </p>
        </div>

        {/* Manifest Code Preview */}
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Synthesized Manifest: <code className="text-emerald-300">manifest.yaml</code></span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(manifestYaml);
                setManifestCopied(true);
                setTimeout(() => setManifestCopied(false), 2000);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-emerald-400 hover:border-emerald-500/40 flex items-center space-x-1.5 transition-all"
            >
              {manifestCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Manifest YAML</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 text-xs overflow-x-auto leading-relaxed select-text font-mono max-h-96 overflow-y-auto">
            {manifestYaml || 'Scheduling decision pending...'}
          </pre>
        </div>
      </section>

      {/* 6. SECTION F: KEY FEASIBILITY DEMO (SAME FORECAST, DIFFERENT UNCERTAINTY) */}
      <section className="space-y-4">
        <div className="pb-2 border-b border-slate-800 space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono">
            <Flame className="w-3.5 h-3.5" />
            <span>Key Research Question Demonstration</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-mono">
            Same Forecast, Different Uncertainty Demonstration
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed font-mono">
            Proves that CarbonRoute does not simply select the lowest predicted carbon window. When forecast uncertainty
            rises, CarbonRoute adapts by choosing an earlier, risk-calibrated start window even when the predicted carbon
            intensity curve is 100% identical.
          </p>
        </div>

        <FeasibilityDemoVisualizer />
      </section>

      {/* 7. Kubernetes Manifest Modal */}
      {showManifestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  Kubernetes batch/v1 Job Manifest
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Declarative Spec
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowManifestModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto font-mono text-xs text-slate-300 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Specification: <code>apiVersion: batch/v1</code> &bull; <code>kind: Job</code>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(manifestYaml);
                    setManifestCopied(true);
                    setTimeout(() => setManifestCopied(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40 flex items-center space-x-1.5"
                >
                  {manifestCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied YAML</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy YAML</span>
                    </>
                  )}
                </button>
              </div>

              {manifestLoading ? (
                <div className="flex items-center justify-center h-48 space-x-2 text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Generating Kubernetes Manifest...</span>
                </div>
              ) : (
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 text-xs overflow-x-auto leading-relaxed select-text font-mono">
                  {manifestYaml}
                </pre>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>
                Deploy via: <code>kubectl apply -f manifest.yaml</code>
              </span>
              <button
                type="button"
                onClick={() => setShowManifestModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
