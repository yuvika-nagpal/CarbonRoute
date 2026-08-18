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
  };
  timeSlots: TimeSlotCarbon[];
  scenarios: {
    scenarioA: FeasibilityScenario;
    scenarioB: FeasibilityScenario;
  };
  feasibilityConclusion: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: User;
}
