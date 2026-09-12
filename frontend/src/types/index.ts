export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'student' | 'evaluator';
}

export type DeliverableType = 'software_grid' | 'planning' | 'midterm' | 'final' | 'other';
export type PresentationStatus = 'published' | 'draft' | 'archived';

export interface PresentationItem {
  id: string;
  title: string;
  deliverableType: DeliverableType;
  versionTag: string; // 'v1', 'v2', etc.
  description: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  authors: string[];
  uploaderName: string;
  status: PresentationStatus;
  presentationDate: string;
  sha256Checksum: string;
  changeSummary: string;
  previousVersionId?: string;
  createdAt: string;
  publishedAt?: string;
  allVersions?: {
    id: string;
    versionTag: string;
    title: string;
    presentationDate: string;
    changeSummary: string;
    status: PresentationStatus;
    createdAt: string;
  }[];
}

// Aliases for compatibility
export type Presentation = PresentationItem;
export type PresentationVersion = PresentationItem;

export interface Resource {
  id: string;
  title: string;
  category: 'presentation' | 'report' | 'dataset' | 'diagram' | 'documentation';
  description: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  isPublished: boolean;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
  githubUrl?: string;
  linkedinUrl?: string;
  displayOrder: number;
}

export interface RoadmapMilestone {
  id: string;
  phaseNumber?: number;
  phaseName?: string;
  weekRange?: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  dependencies?: string[];
  deliverables: string[];
  startDate?: string;
  targetDate?: string;
  displayOrder: number;
}

export interface TimeSlotCarbon {
  hour: number;
  predictedCarbon: number;
  uncertaintyLow: { stdDev: number; violationRisk: number };
  uncertaintyHigh: { stdDev: number; violationRisk: number };
}

export interface FeasibilityScenario {
  name: string;
  predictedCarbonCurve: string;
  uncertaintyLevel: string;
  selectedStartHour: number;
  selectedWindow: string;
  predictedCarbonAtStart: number;
  estimatedViolationRisk: number;
  riskToleranceSatisfied: boolean;
  decisionRationale: string;
}

export interface FeasibilityResult {
  input: {
    durationHours: number;
    deadlineHours: number;
    riskTolerance: number;
    region?: string;
  };
  timeSlots: TimeSlotCarbon[];
  scenarios: {
    scenarioA: FeasibilityScenario;
    scenarioB: FeasibilityScenario;
  };
  feasibilityConclusion: string;
}

// ==========================================
// Prototype & Scheduling Types
// ==========================================
export interface WorkloadJob {
  id: string;
  name: string;
  commandOrImage: string;
  isContainerImage: boolean;
  durationHours: number;
  deadlineHours: number;
  arrivalHour: number;
  cpu: number;
  memoryMb: number;
  region: string;
  riskTolerance: number; // tau
  status?: 'pending' | 'scheduled' | 'running' | 'completed' | 'failed';
  createdAt: string;
}

export interface HourlyCarbonPoint {
  hour: number;
  timestamp: string;
  predictedCarbon: number;
  stdDev: number;
}

export interface CarbonForecastData {
  source: string;
  region: string;
  regionName: string;
  timestamp: string;
  dataMode: 'live' | 'demo';
  traceVersion: string;
  forecastHorizonHours: number;
  timeResolution: string;
  hourlyProfile: HourlyCarbonPoint[];
  averageCarbon: number;
  minCarbon: number;
  maxCarbon: number;
}

export interface PolicyEvaluationResult {
  policyId: string;
  policyName: string;
  category: 'Baseline' | 'Deterministic' | 'Uncertainty-Aware';
  selectedStartHour: number;
  selectedWindow: string;
  predictedCarbon: number; // legacy alias for grid intensity
  predictedCarbonIntensity?: number; // gCO2eq/kWh
  estimatedWorkloadEmissionsGrams?: number; // gCO2eq
  carbonIntensityUnit?: string; // 'gCO2eq/kWh'
  workloadEmissionsUnit?: string; // 'gCO2eq'
  estimatedDeadlineRisk: number;
  waitingTimeHours: number;
  isFeasible: boolean;
  schedulerOverheadMs: number;
  rationale: string;
}

export interface CandidateWindowEvaluation {
  slotIndex: number;
  startHour: number;
  endHour: number;
  windowLabel: string;
  predictedCarbonIntensity: number; // gCO2eq/kWh
  predictedCarbonImpactGrams: number; // estimated total grams CO2
  stdDev: number; // forecast uncertainty sigma
  uncertaintyRange: string;
  deadlineRisk: number; // decimal probability
  deadlineRiskPct: string; // e.g. "4.0%"
  slackHours: number;
  waitingTimeHours: number;
  isFeasible: boolean;
  meetsDeadline: boolean;
  classification:
    | 'RECOMMENDED'
    | 'FEASIBLE'
    | 'REJECTED_HIGH_RISK'
    | 'REJECTED_DEADLINE_BREACH';
  classificationLabel: string; // "RECOMMENDED" | "FEASIBLE BUT NOT OPTIMAL" | "REJECTED — HIGH DEADLINE RISK" | "REJECTED — MISSES DEADLINE"
  reason: string;
}

export interface SchedulingDecisionResponse {
  job: WorkloadJob;
  carbonSource: string;
  dataMode: 'live' | 'demo';
  region: string;
  candidateWindows?: CandidateWindowEvaluation[];
  evaluatedPolicies: PolicyEvaluationResult[];
  recommendedDecision: PolicyEvaluationResult;
  comparisonSummary: {
    carbonSavingsVsImmediatePct: number;
    delayPenaltyHours: number;
    riskDifferenceVsDeterministic: number;
  };
}

export interface K8sJobExecutionRecord {
  jobId: string;
  k8sJobName: string;
  podName: string;
  namespace: string;
  status: 'pending' | 'scheduled' | 'running' | 'completed' | 'failed';
  containerImage: string;
  command: string;
  scheduledStartTime: string;
  actualStartTime?: string;
  completionTime?: string;
  exitCode?: number | string;
  logs: string[];
  clusterMode: 'minikube' | 'offline_fallback';
  clusterNotice: string;
  predictedCarbon: number;
  realizedCarbon?: number;
  carbonError?: number;
  durationSeconds: number;
}

export interface ExperimentRecord {
  id: string;
  timestamp: string;
  region: string;
  workload: string;
  durationHours: number;
  deadlineHours: number;
  riskTolerance: number;
  selectedScheduler: string;
  selectedStartHour: number;
  predictedCarbon: number;
  realizedCarbon: number | string;
  waitingTimeHours: number;
  deadlineRisk: number;
  status: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: User;
}
