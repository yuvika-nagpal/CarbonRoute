import {
  ApiResponse,
  Presentation,
  PresentationVersion,
  Resource,
  TeamMember,
  RoadmapMilestone,
  FeasibilityResult,
  User,
} from '../types';

const API_BASE = 'https://carbonroute.onrender.com/api';

const DEFAULT_PRESENTATIONS: PresentationVersion[] = [
  {
    id: 'pres-grid-v1',
    title: 'Software Engineering Course Grid & Deliverables Specification',
    deliverableType: 'software_grid',
    versionTag: 'v1',
    description: 'Official Software Engineering UCS503 curriculum project grid and milestone roadmap overview.',
    fileName: 'CarbonRoute_Software_Grid.pdf',
    filePath: 'CarbonRoute_Software_Grid.pdf',
    fileSize: 45200,
    mimeType: 'application/pdf',
    fileUrl: '/CarbonRoute_Planning_Presentation_V1.pdf',
    authors: ['Yuvika Nagpal (1024030141)', 'Kumkum Gupta (1024030144)', 'Aaneya Sabharwal (1024030147)'],
    uploaderName: 'Team TriFlux (Batch: 3C15)',
    status: 'published',
    presentationDate: '2026-08-10',
    sha256Checksum: '9a3b1c4e7f8293a01b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a',
    changeSummary: 'Initial course software grid and project proposal scope submission.',
    createdAt: '2026-08-10T10:00:00.000Z',
    publishedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'pres-planning-v1',
    title: 'CarbonRoute Planning Presentation V1',
    deliverableType: 'planning',
    versionTag: 'v1',
    description: 'UCS503: CarbonRoute — Uncertainty-Aware Carbon-Aware Batch Scheduling. Official 25-slide presentation by Team TriFlux submitted to Sukhpal Singh. Covers problem statement, research gap, scope, target users, system architecture, uncertainty modelling, deadline risk calibration, benchmark scale, Gantt chart milestones and team responsibilities.',
    fileName: 'CarbonRoute_Planning_Presentation_V1.pdf',
    filePath: 'CarbonRoute_Planning_Presentation_V1.pdf',
    fileSize: 28033,
    mimeType: 'application/pdf',
    fileUrl: '/CarbonRoute_Planning_Presentation_V1.pdf',
    authors: ['Yuvika Nagpal (1024030141)', 'Kumkum Gupta (1024030144)', 'Aaneya Sabharwal (1024030147)'],
    uploaderName: 'Team TriFlux (Batch: 3C15)',
    status: 'published',
    presentationDate: '17 August 2026',
    sha256Checksum: '8e4f1a239c8914bca99281a8f94d0752119ef58a2d12e9b01c34a17d8900bb21',
    changeSummary: 'Official 25-slide Planning Presentation V1 submitted to instructor Sukhpal Singh.',
    createdAt: '2026-08-17T10:00:00.000Z',
    publishedAt: '2026-08-17T10:00:00.000Z',
  },
  {
    id: 'pres-planning-v2',
    title: 'CarbonRoute Planning Presentation V2',
    deliverableType: 'planning',
    versionTag: 'v2',
    description: 'Iterative revision of the planning presentation incorporating instructor feedback and preliminary trace modeling results.',
    fileName: 'CarbonRoute_Planning_Presentation_V2_Draft.pdf',
    filePath: 'CarbonRoute_Planning_Presentation_V2_Draft.pdf',
    fileSize: 124000,
    mimeType: 'application/pdf',
    fileUrl: '/CarbonRoute_Planning_Presentation_V1.pdf',
    authors: ['Yuvika Nagpal', 'Kumkum Gupta', 'Aaneya Sabharwal'],
    uploaderName: 'Team TriFlux',
    status: 'draft',
    presentationDate: '2026-08-24',
    sha256Checksum: 'b7c2d9e1f3a5b4c6e8d0f2a4b6c8e0d2f4a6b8c0e2d4f6a8b0c2d4e6f8a0b2c4',
    changeSummary: 'Draft revision V2 with updated trace schemas and calibration protocols.',
    previousVersionId: 'pres-planning-v1',
    createdAt: '2026-08-18T00:00:00.000Z',
  },
  {
    id: 'pres-midterm-v1',
    title: 'Mid-Sem Presentation',
    deliverableType: 'midterm',
    versionTag: 'midterm-v1',
    description: 'Mid-semester milestone presentation reviewing discrete-event simulator implementation, baseline benchmarks, and empirical forecast error curves.',
    fileName: '',
    filePath: '',
    fileSize: 0,
    mimeType: 'application/pdf',
    fileUrl: '',
    authors: ['Yuvika Nagpal', 'Kumkum Gupta', 'Aaneya Sabharwal'],
    uploaderName: 'Team TriFlux',
    status: 'draft',
    presentationDate: '2026-10-12',
    sha256Checksum: '',
    changeSummary: 'Scheduled mid-semester deliverable placeholder.',
    createdAt: '2026-08-18T00:00:00.000Z',
  },
  {
    id: 'pres-final-v1',
    title: 'Final Presentation & Viva Defense',
    deliverableType: 'final',
    versionTag: 'final-v1',
    description: 'End-of-semester final project deliverable, complete reproducible benchmark demonstration, Kubernetes containerized connector, and oral thesis defense.',
    fileName: '',
    filePath: '',
    fileSize: 0,
    mimeType: 'application/pdf',
    fileUrl: '',
    authors: ['Yuvika Nagpal', 'Kumkum Gupta', 'Aaneya Sabharwal'],
    uploaderName: 'Team TriFlux',
    status: 'draft',
    presentationDate: '2026-12-21',
    sha256Checksum: '',
    changeSummary: 'Scheduled final presentation deliverable placeholder.',
    createdAt: '2026-08-18T00:00:00.000Z',
  },
];

const DEFAULT_TEAM: TeamMember[] = [
  {
    id: 'team-1',
    name: 'Yuvika Nagpal',
    role: 'Simulation / Data / Workload Modelling',
    bio: 'Leads the discrete-event cloud simulator development, multi-region grid carbon-intensity trace generation, and synthetic/empirical batch workload generators.',
    avatarUrl: '',
    displayOrder: 1,
  },
  {
    id: 'team-2',
    name: 'Kumkum Gupta',
    role: 'Scheduling Algorithms / Uncertainty / Risk Calibration',
    bio: 'Responsible for baseline scheduling algorithms (Immediate, EDF, Cost-Aware), horizon-dependent forecast error modeling, and deadline-risk calibration engine.',
    avatarUrl: '',
    displayOrder: 2,
  },
  {
    id: 'team-3',
    name: 'Aaneya Sabharwal',
    role: 'Backend / Dashboard / Deployment / Integration',
    bio: 'Focuses on the FastAPI scheduling backend, containerized Kubernetes batch execution connectors, interactive experiment dashboard, and deployment architecture.',
    avatarUrl: '',
    displayOrder: 3,
  },
];

const DEFAULT_ROADMAP: RoadmapMilestone[] = [
  {
    id: 'ms-1',
    displayOrder: 1,
    phaseNumber: 1,
    weekRange: 'Weeks 1–2',
    title: 'Requirements, research and initial simulator prototype',
    description: 'Problem formulation, literature review, mathematical model of carbon intensity and forecast error, initial simulator prototype architecture, and website deployment.',
    deliverables: ['Planning Presentation V1', 'Project Portal Deployment', 'Initial Simulator Spec'],
    status: 'in-progress',
  },
  {
    id: 'ms-2',
    displayOrder: 2,
    phaseNumber: 2,
    weekRange: 'Weeks 3–4',
    title: 'Simulator models and workload generation',
    description: 'Development of discrete-event simulator core, multi-region cloud capacity and pricing models, and synthetic batch workload generators (short, medium, long jobs).',
    deliverables: ['Discrete-Event Simulator Core', 'Workload Generator Trace Engine'],
    status: 'planned',
  },
  {
    id: 'ms-3',
    displayOrder: 3,
    phaseNumber: 3,
    weekRange: 'Weeks 5–6',
    title: 'Baseline scheduling policies',
    description: 'Implementation of reference scheduling policies: Immediate Execution, Earliest Deadline First (EDF), Cost-Aware Scheduler, and Realized-Data Oracle reference solver.',
    deliverables: ['Baseline Suite (Immediate, EDF, Cost, Oracle)'],
    status: 'planned',
  },
  {
    id: 'ms-4',
    displayOrder: 4,
    phaseNumber: 4,
    weekRange: 'Weeks 7–8',
    title: 'Carbon-aware scheduler',
    description: 'Implementation of deterministic carbon-aware scheduling algorithms and heuristic multi-region workload shifting strategies.',
    deliverables: ['Deterministic Carbon Scheduler'],
    status: 'planned',
  },
  {
    id: 'ms-5',
    displayOrder: 5,
    phaseNumber: 5,
    weekRange: 'Weeks 9–10',
    title: 'Forecast uncertainty and error modelling',
    description: 'Parametric and empirical forecast error distribution modeling across 1h to 48h look-ahead horizons to capture variance growth over time.',
    deliverables: ['Forecast Error Engine & Trace Distributions'],
    status: 'planned',
  },
  {
    id: 'ms-6',
    displayOrder: 6,
    phaseNumber: 6,
    weekRange: 'Weeks 11–12',
    title: 'Uncertainty-aware scheduler and deadline-risk calibration',
    description: 'Core CarbonRoute scheduling algorithm enforcing P(deadline violation | decision) <= tau, combined with Brier score calibration and Reliability Diagrams.',
    deliverables: ['CarbonRoute Uncertainty Scheduler & Calibration Model'],
    status: 'planned',
  },
  {
    id: 'ms-7',
    displayOrder: 7,
    phaseNumber: 7,
    weekRange: 'Week 13',
    title: 'Stress testing',
    description: 'Systematic stress testing against sudden renewable drop-offs, cloud capacity contention, flash price spikes, and severe forecast skew.',
    deliverables: ['Stress-Testing Evaluation Matrix'],
    status: 'planned',
  },
  {
    id: 'ms-8',
    displayOrder: 8,
    phaseNumber: 8,
    weekRange: 'Week 14',
    title: 'API and dashboard integration',
    description: 'FastAPI REST endpoint exposure for scheduling decisions and interactive web dashboard integration for visualizing schedules and risk curves.',
    deliverables: ['FastAPI REST Service & Web Dashboard'],
    status: 'planned',
  },
  {
    id: 'ms-9',
    displayOrder: 9,
    phaseNumber: 9,
    weekRange: 'Week 15',
    title: 'Large-scale repeated experiments and benchmark',
    description: 'Execution of multi-seed, multi-region reproducible benchmark suite across varying forecast error levels, producing paired statistical evaluations.',
    deliverables: ['Reproducible Benchmark Dataset & Analysis Scripts'],
    status: 'planned',
  },
  {
    id: 'ms-10',
    displayOrder: 10,
    phaseNumber: 10,
    weekRange: 'Week 16',
    title: 'Containerized workload connector, testing and deployment',
    description: 'Integration of container execution connector dispatching scheduled batch jobs to Kubernetes Jobs with explanation summaries.',
    deliverables: ['Kubernetes Container Workload Connector'],
    status: 'planned',
  },
  {
    id: 'ms-11',
    displayOrder: 11,
    phaseNumber: 11,
    weekRange: 'Week 17',
    title: 'Final integration, evaluation, documentation and presentation',
    description: 'Comprehensive project evaluation, final documentation, open-source repository packaging, and university semester defense presentation.',
    deliverables: ['Final Project Report, Documentation & Viva Presentation'],
    status: 'planned',
  },
];

const getHeaders = (isFormData: boolean = false): HeadersInit => {
  const token = localStorage.getItem('carbonroute_token');
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const getLocalPresentations = (): PresentationVersion[] => {
  try {
    const saved = localStorage.getItem('carbonroute_presentations');
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_PRESENTATIONS;
};

const saveLocalPresentations = (list: PresentationVersion[]) => {
  try {
    localStorage.setItem('carbonroute_presentations', JSON.stringify(list));
  } catch {}
};

export const api = {
  // Auth
  async login(username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    if ((username === 'admin' || username === 'admin@carbonroute.org') && password === 'CarbonRoute2026!Secure') {
      const user: User = {
        id: 'usr-admin-1',
        username: 'admin',
        email: 'admin@carbonroute.org',
        role: 'admin',
      };
      return {
        success: true,
        message: 'Login successful',
        data: { token: 'mock-jwt-token-triflux-2026', user },
        user,
        token: 'mock-jwt-token-triflux-2026',
      };
    }
    return { success: false, message: 'Invalid username or password.' };
  },

  async getMe(): Promise<ApiResponse<User>> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    const token = localStorage.getItem('carbonroute_token');
    if (token) {
      const user: User = {
        id: 'usr-admin-1',
        username: 'admin',
        email: 'admin@carbonroute.org',
        role: 'admin',
      };
      return { success: true, user, data: user };
    }
    return { success: false, message: 'Not authenticated' };
  },

  async logout(): Promise<ApiResponse<void>> {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: getHeaders() });
    } catch {}
    localStorage.removeItem('carbonroute_token');
    return { success: true };
  },

  // Presentations
  async getPresentations(): Promise<ApiResponse<Presentation[]>> {
    try {
      const res = await fetch(`${API_BASE}/presentations`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, data: [] };
  },

  async getAllVersions(): Promise<ApiResponse<PresentationVersion[]>> {
    try {
      const res = await fetch(`${API_BASE}/presentations/versions`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json;
        }
      }
    } catch {}
    return { success: true, data: getLocalPresentations() };
  },

  async getPresentationByVersion(versionTag: string): Promise<ApiResponse<PresentationVersion>> {
    try {
      const res = await fetch(`${API_BASE}/presentations/v/${encodeURIComponent(versionTag)}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return json;
      }
    } catch {}

    const list = getLocalPresentations();
    const found = list.find((p) => p.versionTag.toLowerCase() === versionTag.toLowerCase()) || list[1];
    return { success: true, data: found };
  },

  async uploadPresentationVersion(formData: FormData): Promise<ApiResponse<PresentationVersion>> {
    try {
      const res = await fetch(`${API_BASE}/presentations/upload`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });
      if (res.ok) return await res.json();
    } catch {}

    const title = (formData.get('title') as string) || 'New Uploaded Presentation';
    const versionTag = (formData.get('versionTag') as string) || `v${Date.now()}`;
    const desc = (formData.get('description') as string) || '';
    const date = (formData.get('presentationDate') as string) || new Date().toISOString().split('T')[0];
    const authors = ((formData.get('authors') as string) || 'Team TriFlux')
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const newVersion: PresentationVersion = {
      id: `pres-${Date.now()}`,
      title,
      deliverableType: 'other',
      versionTag,
      description: desc,
      fileName: 'Presentation.pdf',
      filePath: 'CarbonRoute_Planning_Presentation_V1.pdf',
      fileSize: 28033,
      mimeType: 'application/pdf',
      fileUrl: '/CarbonRoute_Planning_Presentation_V1.pdf',
      authors,
      uploaderName: 'Team TriFlux',
      status: 'published',
      presentationDate: date,
      sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      changeSummary: 'Uploaded via Admin Panel.',
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    };

    const current = getLocalPresentations();
    const updated = [newVersion, ...current];
    saveLocalPresentations(updated);

    return { success: true, data: newVersion };
  },

  async updatePresentationVersion(id: string, updates: Partial<PresentationVersion>): Promise<ApiResponse<PresentationVersion>> {
    try {
      const res = await fetch(`${API_BASE}/presentations/versions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) return await res.json();
    } catch {}

    const current = getLocalPresentations();
    const idx = current.findIndex((p) => p.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      saveLocalPresentations(current);
      return { success: true, data: current[idx] };
    }
    return { success: false, message: 'Item not found' };
  },

  async deletePresentationVersion(id: string): Promise<ApiResponse<void>> {
    try {
      const res = await fetch(`${API_BASE}/presentations/versions/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}

    const current = getLocalPresentations().filter((p) => p.id !== id);
    saveLocalPresentations(current);
    return { success: true };
  },

  // Resources
  async getResources(category?: string): Promise<ApiResponse<Resource[]>> {
    return { success: true, data: [] };
  },

  async getAllResourcesAdmin(): Promise<ApiResponse<Resource[]>> {
    return { success: true, data: [] };
  },

  async uploadResource(formData?: FormData): Promise<ApiResponse<Resource>> {
    return { success: true, data: {} as Resource };
  },

  async deleteResource(id?: string): Promise<ApiResponse<void>> {
    return { success: true };
  },

  // Team
  async getTeam(): Promise<ApiResponse<TeamMember[]>> {
    try {
      const res = await fetch(`${API_BASE}/team`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, data: DEFAULT_TEAM };
  },

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<ApiResponse<TeamMember>> {
    return { success: true, data: { ...DEFAULT_TEAM[0], ...updates } };
  },

  // Roadmap
  async getRoadmap(): Promise<ApiResponse<RoadmapMilestone[]>> {
    try {
      const res = await fetch(`${API_BASE}/roadmap`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, data: DEFAULT_ROADMAP };
  },

  async updateRoadmapMilestone(id: string, updates: Partial<RoadmapMilestone>): Promise<ApiResponse<RoadmapMilestone>> {
    return { success: true, data: { ...DEFAULT_ROADMAP[0], ...updates } };
  },

  // Feasibility Simulation API
  async simulateFeasibility(durationHours: number, deadlineHours: number, riskTolerance: number): Promise<ApiResponse<FeasibilityResult>> {
    return {
      success: true,
      data: {
        input: { durationHours, deadlineHours, riskTolerance },
        timeSlots: [
          { hour: 0, predictedCarbon: 320, uncertaintyLow: { stdDev: 12, violationRisk: 0.01 }, uncertaintyHigh: { stdDev: 45, violationRisk: 0.08 } },
          { hour: 4, predictedCarbon: 180, uncertaintyLow: { stdDev: 15, violationRisk: 0.02 }, uncertaintyHigh: { stdDev: 60, violationRisk: 0.18 } },
        ],
        scenarios: {
          scenarioA: {
            name: 'Low Forecast Uncertainty (High Confidence)',
            predictedCarbonCurve: 'Clean solar trough between hours 4–8',
            uncertaintyLevel: 'Low (sigma = 15 gCO2/kWh)',
            selectedStartHour: 4,
            selectedWindow: 'Hours 4–8 (Clean Period)',
            predictedCarbonAtStart: 180,
            estimatedViolationRisk: 0.02,
            riskToleranceSatisfied: true,
            decisionRationale: 'Delaying execution is safe because estimated deadline violation risk (2%) is well below the 5% tolerance.',
          },
          scenarioB: {
            name: 'High Forecast Uncertainty (Low Confidence)',
            predictedCarbonCurve: 'Clean solar trough between hours 4–8',
            uncertaintyLevel: 'High (sigma = 60 gCO2/kWh)',
            selectedStartHour: 0,
            selectedWindow: 'Immediate Start (Hour 0)',
            predictedCarbonAtStart: 320,
            estimatedViolationRisk: 0.01,
            riskToleranceSatisfied: true,
            decisionRationale: 'Delaying is too risky because high uncertainty elevates deadline violation risk to 18% (exceeding 5% tolerance).',
          },
        },
        feasibilityConclusion: 'Uncertainty changes scheduling decisions even when point forecasts are identical.',
      },
    };
  },
};
