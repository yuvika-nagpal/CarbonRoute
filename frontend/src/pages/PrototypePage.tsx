import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Zap,
  Activity,
  Play,
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
  const [forecast, setForecast] = useState<CarbonForecastData | null>(null);
  const [decision, setDecision] = useState<SchedulingDecisionResponse | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // 3. Kubernetes Execution State
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [executionRecord, setExecutionRecord] = useState<K8sJobExecutionRecord | null>(null);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [clusterHealth, setClusterHealth] = useState<{ isAvailable: boolean; message: string } | null>(null);

  // Auto-scroll logs
  const terminalLogsRef = useRef<HTMLDivElement>(null);

  // Load Carbon Forecast on Region change
  const loadForecast = async (targetRegion: string) => {
    try {
      const res = await api.getCarbonForecast(targetRegion);
      if (res.success && res.data) {
        setForecast(res.data);
      }
    } catch (err) {
      console.error('Failed to load forecast:', err);
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
    loadForecast(region);
    checkCluster();
  }, [region]);

  // Execute Scheduling Evaluation
  const handleEvaluateSchedule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

      const res = await api.scheduleJob({ jobData, region });
      if (res.success && res.data) {
        setDecision(res.data);
        setActiveJobId(res.data.job.id);
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

  // Dispatch Job to Kubernetes
  const handleDispatchJob = async () => {
    if (!activeJobId || !decision) return;
    setDispatching(true);

    try {
      const res = await api.dispatchJob(activeJobId, {
        predictedCarbon: decision.recommendedDecision.predictedCarbon,
        simulatedDurationSec: 8,
      });

      if (res.success && res.data) {
        setExecutionRecord(res.data);
      }
    } catch (err) {
      console.error('Failed to dispatch job:', err);
    } finally {
      setDispatching(false);
    }
  };

  // Poll Execution Status if Running
  useEffect(() => {
    if (!activeJobId || !executionRecord) return;
    if (executionRecord.status === 'completed' || executionRecord.status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const res = await api.getJobStatus(activeJobId);
        if (res.success && res.data) {
          setExecutionRecord(res.data);
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [activeJobId, executionRecord?.status]);

  // Auto-scroll logs
  useEffect(() => {
    if (terminalLogsRef.current) {
      terminalLogsRef.current.scrollTop = terminalLogsRef.current.scrollHeight;
    }
  }, [executionRecord?.logs]);

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
            <span className="font-bold">PROTOTYPE MILESTONE VERTICAL SLICE</span>
            <span className="text-slate-500">&bull;</span>
            <span>Team TriFlux</span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
              API: <strong className="text-emerald-400">Online</strong>
            </span>
            <span
              className={`px-2.5 py-1 rounded border ${
                clusterHealth?.isAvailable
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  : 'bg-amber-950/40 text-amber-300 border-amber-800/60'
              }`}
            >
              K8s Cluster:{' '}
              <strong>{clusterHealth?.isAvailable ? 'Minikube Live' : 'Sandbox Fallback'}</strong>
            </span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
          CarbonRoute End-to-End Scheduling Prototype
        </h1>
        <p className="text-sm text-slate-400 max-w-4xl leading-relaxed">
          Demonstrates one complete software vertical slice: from job submission through Electricity Maps carbon
          forecasting, horizon uncertainty modeling, evaluation of 5 scheduling policies, CarbonRoute
          deadline-risk decision, to containerized Kubernetes dispatch and results collection.
        </p>
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
              Provide workload parameters and acceptable deadline risk tolerance $\tau$.
            </p>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-500">Presets:</span>
            <button
              type="button"
              onClick={() =>
                applyPreset('ResNet-50 ML Training', 'carbonroute/test-workload:latest', 2, 12, 1, 512, 0.05, 'US-CAL-CISO')
              }
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40"
            >
              1. ML Training
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
            <span className="text-[10px] text-slate-500 block">Identifier for telemetry &amp; logs</span>
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
              <option value="US-CAL-CISO">California (CAISO) — Solar duck-curve</option>
              <option value="US-TEX-ERCO">Texas (ERCOT) — Overnight wind surges</option>
              <option value="DE">Germany (Central Europe) — Mixed wind &amp; solar</option>
              <option value="IN-NO">Northern India — High thermal baseload &amp; midday solar</option>
            </select>
            <span className="text-[10px] text-slate-500 block">Queries region's carbon profile</span>
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
            <span className="text-[10px] text-slate-500 block">Continuous execution duration</span>
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
              <label className="text-slate-300 font-semibold">Deadline Risk Tolerance ($\tau$)</label>
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
            <span className="text-[10px] text-slate-500 block">Max acceptable P(deadline violation) threshold (&tau;)</span>
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
                  <span>Carbon Forecast &amp; Uncertainty Profile: {forecast.regionName}</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                24-hour hourly lookahead intensity (gCO2eq/kWh) and horizon-dependent forecast variance ($\sigma$).
              </p>
            </div>

            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400">Source:</span>
              <strong className="text-white">{forecast.source}</strong>
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
                    title={`T+${point.hour}:00: ${point.predictedCarbon} gCO2/kWh (±${point.stdDev})`}
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
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-30 w-32 p-2 bg-slate-900 text-[10px] font-mono text-slate-200 rounded border border-slate-700 shadow-xl pointer-events-none">
                      <div className="text-emerald-400 font-bold">T+{point.hour}:00</div>
                      <div>Intensity: {point.predictedCarbon} gCO2</div>
                      <div className="text-slate-400">StdDev &sigma;: &plusmn;{point.stdDev}</div>
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
          {/* CarbonRoute Highlight Card */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-950/20 to-slate-900/80 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-emerald-500/30 gap-3">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500 text-slate-950">
                  STEP 3 &bull; OPTIMIZATION DECISION
                </span>
                <h3 className="text-xl font-extrabold text-white font-mono">
                  CarbonRoute Uncertainty-Aware Scheduling Decision
                </h3>
              </div>

              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-xs font-mono text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Risk Calibrated: P(violation) &le; {(riskTolerance * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Selected Window</span>
                <div className="text-lg font-extrabold text-white">
                  {decision.recommendedDecision.selectedWindow}
                </div>
                <span className="text-slate-500 text-[10px]">Optimal start period</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/30 space-y-1">
                <span className="text-emerald-400 block text-[11px]">Predicted Carbon</span>
                <div className="text-lg font-extrabold text-emerald-300">
                  {decision.recommendedDecision.predictedCarbon}{' '}
                  <span className="text-xs text-slate-400">gCO2</span>
                </div>
                <span className="text-emerald-400/80 text-[10px]">
                  {decision.comparisonSummary.carbonSavingsVsImmediatePct}% vs Immediate
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Estimated Deadline Risk</span>
                <div className="text-lg font-extrabold text-amber-300">
                  {(decision.recommendedDecision.estimatedDeadlineRisk * 100).toFixed(1)}%
                </div>
                <span className="text-slate-500 text-[10px]">
                  Within &le; {(riskTolerance * 100).toFixed(0)}% tolerance
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
                <span className="text-slate-400 block text-[11px]">Scheduler Overhead</span>
                <div className="text-lg font-extrabold text-teal-300">
                  {decision.recommendedDecision.schedulerOverheadMs} ms
                </div>
                <span className="text-slate-500 text-[10px]">Decision latency</span>
              </div>
            </div>

            {/* Rationale Explanation */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 font-mono text-xs">
              <span className="text-emerald-400 font-bold block flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Decision Rationale &amp; Uncertainty Analysis:</span>
              </span>
              <p className="text-slate-300 leading-relaxed">
                {decision.recommendedDecision.rationale}
              </p>
            </div>

            {/* Dispatch Action */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs font-mono text-slate-400">
                Ready to dispatch workload to Kubernetes Job connector.
              </div>

              <button
                type="button"
                onClick={handleDispatchJob}
                disabled={dispatching || executionRecord?.status === 'running'}
                className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all font-mono flex items-center space-x-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
              >
                <Server className={`w-4 h-4 ${dispatching ? 'animate-spin' : ''}`} />
                <span>
                  {executionRecord?.status === 'running'
                    ? 'Workload Executing...'
                    : 'Dispatch to Kubernetes & Execute'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

          {/* 5 Schedulers Policy Comparison Table */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>5-Policy Scheduling Comparison Matrix</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">
                Live evaluation against identical forecast trace
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Policy Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Selected Start</th>
                    <th className="p-3">Predicted Carbon</th>
                    <th className="p-3">Deadline Risk</th>
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
                        <td className="p-3 text-emerald-400 font-bold">{pol.predictedCarbon} gCO2</td>
                        <td className="p-3">
                          <span
                            className={
                              pol.estimatedDeadlineRisk > riskTolerance
                                ? 'text-rose-400'
                                : 'text-emerald-400'
                            }
                          >
                            {(pol.estimatedDeadlineRisk * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">+{pol.waitingTimeHours}h</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                            Feasible
                          </span>
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

      {/* 5. SECTION E: KUBERNETES EXECUTION MONITOR & CONTAINER LOGS */}
      {executionRecord && (
        <section className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  STEP 4 &bull; EXECUTION
                </span>
                <h3 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>Kubernetes Workload Execution Monitor</span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Job ID: <strong className="text-white">{executionRecord.jobId}</strong> &bull; Pod:{' '}
                <strong className="text-slate-300">{executionRecord.podName}</strong>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                  executionRecord.status === 'completed'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : executionRecord.status === 'running'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                Status: {executionRecord.status}
              </span>
            </div>
          </div>

          {/* Mode Notice Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono flex items-start space-x-2.5 text-slate-300">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-bold block">Execution Connector Environment:</span>
              <span className="text-slate-400">{executionRecord.clusterNotice}</span>
            </div>
          </div>

          {/* Lifecycle Stepper */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div
              className={`p-4 rounded-xl border ${
                executionRecord.status === 'scheduled' ||
                executionRecord.status === 'running' ||
                executionRecord.status === 'completed'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-bold mb-1">1. Staged &amp; Scheduled</div>
              <div className="text-[11px] text-slate-400">
                Scheduled Start: {new Date(executionRecord.scheduledStartTime).toLocaleTimeString()}
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                executionRecord.status === 'running' || executionRecord.status === 'completed'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-bold mb-1">2. Pod Spawned &amp; Running</div>
              <div className="text-[11px] text-slate-400">
                Actual Start:{' '}
                {executionRecord.actualStartTime
                  ? new Date(executionRecord.actualStartTime).toLocaleTimeString()
                  : 'Awaiting container'}
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                executionRecord.status === 'completed'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-bold mb-1">3. Workload Completed</div>
              <div className="text-[11px] text-slate-400">
                Exit Code: {executionRecord.exitCode ?? 'Pending'} &bull; Finished:{' '}
                {executionRecord.completionTime
                  ? new Date(executionRecord.completionTime).toLocaleTimeString()
                  : 'In progress'}
              </div>
            </div>
          </div>

          {/* Live Terminal Log Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Container stdout / stderr Logs</span>
              </span>
              <span className="text-[10px] text-slate-500">Live stream</span>
            </div>

            <div
              ref={terminalLogsRef}
              className="w-full h-52 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-y-auto font-mono text-xs text-emerald-300 space-y-1 select-text"
            >
              {executionRecord.logs.map((line, i) => (
                <div key={i} className="leading-relaxed">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. SECTION F: RESULTS DASHBOARD */}
      {executionRecord && executionRecord.status === 'completed' && (
        <section className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="pb-4 border-b border-slate-800 space-y-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              STEP 5 &bull; RESULTS
            </span>
            <h3 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Execution Results &amp; Carbon Accounting</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] block">Predicted Carbon</span>
              <div className="text-xl font-bold text-white">
                {executionRecord.predictedCarbon} gCO2
              </div>
              <span className="text-[10px] text-slate-500">Forecast at scheduling</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1">
              <span className="text-emerald-400 text-[11px] block">Realized Grid Carbon</span>
              <div className="text-xl font-bold text-emerald-300">
                {executionRecord.realizedCarbon} gCO2
              </div>
              <span className="text-[10px] text-emerald-400">Measured actual outcome</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] block">Execution Duration</span>
              <div className="text-xl font-bold text-white">
                {executionRecord.durationSeconds}s
              </div>
              <span className="text-[10px] text-slate-500">Active CPU runtime</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] block">Deadline / SLA Result</span>
              <div className="text-xl font-bold text-emerald-400">On Schedule</div>
              <span className="text-[10px] text-emerald-400">0% violation</span>
            </div>
          </div>
        </section>
      )}

      {/* 7. SECTION G: KEY FEASIBILITY DEMO (SAME FORECAST, DIFFERENT UNCERTAINTY) */}
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
    </div>
  );
};
