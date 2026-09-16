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
  category: string;
  description: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  fileUrl?: string;
  isPublished?: boolean;
  createdAt?: string;
  type?: string;
  format?: string;
  date?: string;
  version?: string;
  actionType?: 'view' | 'download' | 'external';
  isExternal?: boolean;
  badge?: string;
  authors?: string;
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
  stdDev?: number | null;
  uncertaintyAvailable?: boolean;
  uncertaintyStatus?: string;
  confidenceLow?: number | null;
  confidenceHigh?: number | null;
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
  uncertaintyStatus?: string;
}

export interface PolicyEvaluationResult {
  policyId: string;
  policyName: string;
  category: 'Baseline' | 'Deterministic' | 'Uncertainty-Aware';
  selectedStartHour: number;
  selectedEndHour?: number;
  selectedWindow: string;
  predictedCarbon: number; // grid intensity alias
  predictedCarbonIntensity?: number; // gCO2eq/kWh
  carbonIntensityUnit?: string; // 'gCO2eq/kWh'
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
  stdDev?: number | null; // null when uncalibrated
  uncertaintyAvailable?: boolean;
  uncertaintyStatus?: string;
  uncertaintyRange?: string;
  deadlineRisk: number;
  deadlineRiskPct: string;
  slackHours: number;
  waitingTimeHours: number;
  isFeasible: boolean;
  meetsDeadline: boolean;
  classification:
    | 'RECOMMENDED'
    | 'FEASIBLE'
    | 'REJECTED_HIGH_RISK'
    | 'REJECTED_DEADLINE_BREACH';
  classificationLabel: string;
  reason: string;
}

export interface ResearchInsightLowestVsSafest {
  lowestCarbonWindow: CandidateWindowEvaluation;
  recommendedWindow: CandidateWindowEvaluation;
  isLowestCarbonSafe: boolean;
  carbonInsurancePenaltyGramsPerKwh: number;
  explanation: string;
}

export interface SchedulingDecisionResponse {
  job: WorkloadJob;
  carbonSource: string;
  dataMode: 'live' | 'demo';
  region: string;
  durationHours?: number;
  candidateWindows?: CandidateWindowEvaluation[];
  evaluatedPolicies: PolicyEvaluationResult[];
  recommendedDecision: PolicyEvaluationResult;
  comparisonSummary: {
    carbonSavingsVsImmediatePct: number;
    delayPenaltyHours: number;
    riskDifferenceVsDeterministic?: number;
  };
  researchInsight?: ResearchInsightLowestVsSafest;
  researchStatus?: {
    liveForecastSource: string;
    carbonUncertaintyStatus: string;
    runtimeRiskStatus: string;
    executionStatus: string;
    realizedCarbonStatus: string;
  };
}

export interface K8sJobExecutionRecord {
  jobId: string;
  k8sJobName: string;
  podName?: string;
  namespace?: string;
  status: 'pending' | 'scheduled' | 'running' | 'completed' | 'failed' | 'preview' | 'disabled_in_prototype';
  containerImage: string;
  command: string;
  scheduledStartTime: string;
  actualStartTime?: string;
  completionTime?: string;
  exitCode?: number | string;
  logs: string[];
  clusterMode?: 'minikube' | 'offline_fallback' | 'manifest_preview';
  clusterNotice: string;
  predictedCarbon: number;
  durationHours?: number;
  durationSeconds?: number;
  manifestPreview?: any;
  executionDisabled?: boolean;
  realizedCarbon?: number | null;
  carbonError?: number | null;
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
  realizedCarbon?: number | string | null;
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
