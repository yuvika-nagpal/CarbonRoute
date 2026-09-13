/**
 * Central Resource & Deliverables Data Structure for CarbonRoute
 * 
 * To add a new deliverable to the Resources section:
 * Simply append a new item to the `DEFAULT_PROJECT_RESOURCES` array below.
 * The Resources UI will automatically generate the card, format badge, and action button.
 */

export type ResourceCategory =
  | 'Planning'
  | 'Research'
  | 'Documentation'
  | 'Presentations'
  | 'Design'
  | 'Development'
  | 'Testing'
  | 'Dataset / ML'
  | 'Reports'
  | 'Prototype'
  | 'Final Deliverables';

export type ResourceFormat =
  | 'pdf'
  | 'ppt'
  | 'docx'
  | 'xlsx'
  | 'zip'
  | 'image'
  | 'link'
  | 'json';

export interface ProjectDeliverable {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  type: string; // e.g., 'Document', 'Presentation', 'Report', 'Specification', 'Dataset', 'Prototype'
  format: ResourceFormat;
  url: string; // Relative URL (e.g. '/CarbonRoute_Planning_Presentation_V1.pdf') or full HTTP/HTTPS URL
  date: string; // e.g. 'August 2026', 'September 2026'
  version?: string; // e.g. 'v1.0', 'v2'
  fileSize?: string; // e.g. '28 KB', '571 KB'
  isExternal?: boolean; // Set true for external documentation/links
  actionType: 'view' | 'download' | 'external';
  badge?: string; // e.g., 'Verified', 'Submitted', 'Live'
  authors?: string;
}

export const RESOURCE_CATEGORIES: { id: string; name: string; category?: ResourceCategory }[] = [
  { id: 'all', name: 'All' },
  { id: 'planning', name: 'Planning', category: 'Planning' },
  { id: 'research', name: 'Research', category: 'Research' },
  { id: 'documentation', name: 'Documentation', category: 'Documentation' },
  { id: 'presentations', name: 'Presentations', category: 'Presentations' },
  { id: 'design', name: 'Design', category: 'Design' },
  { id: 'development', name: 'Development', category: 'Development' },
  { id: 'testing', name: 'Testing', category: 'Testing' },
  { id: 'dataset_ml', name: 'Dataset / ML', category: 'Dataset / ML' },
  { id: 'reports', name: 'Reports', category: 'Reports' },
  { id: 'prototype', name: 'Prototype', category: 'Prototype' },
  { id: 'final', name: 'Final Deliverables', category: 'Final Deliverables' },
];

export const DEFAULT_PROJECT_RESOURCES: ProjectDeliverable[] = [
  {
    id: 'res-pres-v1',
    title: 'CarbonRoute Planning Presentation V1',
    description: 'Official 25-slide software engineering planning presentation submitted to instructor Sukhpal Singh. Covers problem formulation, lookahead uncertainty modelling, deadline risk bounds, benchmark scale, and 17-week Gantt milestones.',
    category: 'Presentations',
    type: 'Presentation',
    format: 'pdf',
    url: '/CarbonRoute_Planning_Presentation_V1.pdf',
    date: '17 August 2026',
    version: 'v1.0',
    fileSize: '28 KB',
    actionType: 'view',
    badge: 'Submitted',
    authors: 'Yuvika Nagpal, Kumkum Gupta, Aaneya Sabharwal',
  },
  {
    id: 'res-pres-v2',
    title: 'CarbonRoute Planning Presentation V2 (Final Draft)',
    description: 'Comprehensive 25-slide presentation deck incorporating instructor review feedback, expanded regional grid emission variations, and multi-policy comparative evaluation curves.',
    category: 'Presentations',
    type: 'Presentation',
    format: 'pdf',
    url: '/api/storage/presentations/1787045453794-CarbonRoute_Planning_Presentation_final.pdf',
    date: '18 August 2026',
    version: 'v2.0',
    fileSize: '571 KB',
    actionType: 'view',
    badge: 'Latest Version',
    authors: 'Yuvika Nagpal, Kumkum Gupta, Aaneya Sabharwal',
  },
  {
    id: 'res-report-v1',
    title: 'CarbonRoute Project Progress Report',
    description: 'Formal academic project progress report detailing problem background, Scope 2 data center emissions motivation, mathematical uncertainty modeling, and initial benchmark results.',
    category: 'Reports',
    type: 'Report',
    format: 'pdf',
    url: '/api/storage/presentations/1787033813483-CarbonRoute_Report.pdf',
    date: '18 August 2026',
    version: 'r1.0',
    fileSize: '129 KB',
    actionType: 'view',
    badge: 'Verified',
    authors: 'Yuvika Nagpal, Kumkum Gupta, Aaneya Sabharwal',
  },
  {
    id: 'res-software-grid',
    title: 'Software Engineering Course Grid & Deliverables',
    description: 'Official UCS503 curriculum project deliverables grid, grading criteria, phase milestones, and group responsibility matrix.',
    category: 'Planning',
    type: 'Specification',
    format: 'pdf',
    url: '/api/storage/presentations/CarbonRoute_Software_Grid.pdf',
    date: '10 August 2026',
    version: 'v1.0',
    fileSize: '45 KB',
    actionType: 'view',
    badge: 'Curriculum',
    authors: 'Team TriFlux',
  },
  {
    id: 'res-arch-flowchart',
    title: 'CarbonRoute System Architecture & Feasibility Flowchart',
    description: 'End-to-end component interaction architecture diagram showing workload ingestion, Electricity Maps live feed, uncertainty calibration engine, and Kubernetes dispatch pipeline.',
    category: 'Design',
    type: 'Diagram',
    format: 'link',
    url: '/architecture',
    date: 'August 2026',
    version: 'v1.0',
    actionType: 'external',
    badge: 'Interactive',
    authors: 'Team TriFlux',
  },
  {
    id: 'res-system-design',
    title: 'Mathematical System Design & Formulation Document',
    description: 'Rigorous derivation of horizon error dispersion sigma(t) = sigma_0 * (1 + beta*(t - t0)^gamma) and tail deadline risk probability constraint P(violation) <= tau.',
    category: 'Research',
    type: 'Specification',
    format: 'link',
    url: '/system-design',
    date: 'August 2026',
    version: 'v1.0',
    actionType: 'external',
    badge: 'Mathematical Spec',
    authors: 'Team TriFlux',
  },
  {
    id: 'res-electricitymaps-api',
    title: 'Electricity Maps Real-Time API & Grid Telemetry Specification',
    description: 'Upstream documentation and API reference for fetching 24-hour marginal and average grid carbon intensity forecasts across target ISO zones.',
    category: 'Documentation',
    type: 'Document',
    format: 'link',
    url: 'https://api-portal.electricitymaps.com/',
    date: 'Live Telemetry',
    isExternal: true,
    actionType: 'external',
    badge: 'External API',
  },
  {
    id: 'res-iso-traces',
    title: 'Multi-Region 24-Hour ISO Carbon Benchmark Traces',
    description: 'Calibrated historical hourly grid carbon intensity datasets across CAISO (California), ERCOT (Texas), Germany (DE), and Northern India (IN-NO) used for reproducible simulation replay.',
    category: 'Dataset / ML',
    type: 'Dataset',
    format: 'json',
    url: '/prototype',
    date: 'Calibrated 2026',
    version: '24h Traces',
    actionType: 'external',
    badge: '4 ISO Zones',
  },
  {
    id: 'res-prototype-engine',
    title: 'CarbonRoute Interactive 5-Scheduler Benchmark Prototype',
    description: 'Live interactive vertical slice prototype evaluating Immediate, EDF, Deterministic, Baseline, and CarbonRoute policies with container dispatch.',
    category: 'Prototype',
    type: 'Prototype',
    format: 'link',
    url: '/prototype',
    date: 'Current Release',
    version: 'v1.0-slice',
    actionType: 'external',
    badge: 'Live Interactive',
  },
  {
    id: 'res-k8s-manifest-spec',
    title: 'Kubernetes batch/v1 Job Manifest Synthesis Specification',
    description: 'Template schema and temporal scheduling annotation generator producing standard production-ready Kubernetes batch/v1 Job definitions for cloud execution.',
    category: 'Development',
    type: 'Specification',
    format: 'link',
    url: '/prototype',
    date: 'August 2026',
    version: 'batch/v1',
    actionType: 'external',
    badge: 'K8s Native',
  },
  {
    id: 'res-testing-suite',
    title: 'End-to-End Vertical Slice Test Suite',
    description: 'Automated integration and vertical slice verification suite testing 19/19 functional assertions across workload ingestion, forecast dispersion, and scheduler optimization.',
    category: 'Testing',
    type: 'Document',
    format: 'link',
    url: '/experiments',
    date: 'August 2026',
    version: '19/19 Passing',
    actionType: 'external',
    badge: 'Automated CI',
  },
];
