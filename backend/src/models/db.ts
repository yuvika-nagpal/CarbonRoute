import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'student' | 'evaluator';
  createdAt: string;
}

export type DeliverableType = 'software_grid' | 'planning' | 'midterm' | 'final' | 'other';
export type PresentationStatus = 'published' | 'draft' | 'archived';

export interface PresentationItem {
  id: string;
  title: string;
  deliverableType: DeliverableType;
  versionTag: string; // 'v1', 'v2', 'midterm', 'final'
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
}

export interface Resource {
  id: string;
  title: string;
  category: string;
  description: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  isPublished: boolean;
  createdAt: string;
  authors?: string;
  version?: string;
  date?: string;
  type?: string;
  format?: string;
  badge?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
  displayOrder: number;
}

export interface RoadmapMilestone {
  id: string;
  phaseName?: string;
  weekRange: string; // e.g. 'Weeks 1-2'
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  deliverables: string[];
  displayOrder: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'presentation' | 'resource' | 'team' | 'auth';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface DatabaseSchema {
  users: User[];
  presentations: PresentationItem[];
  resources: Resource[];
  teamMembers: TeamMember[];
  roadmapMilestones: RoadmapMilestone[];
  activityLogs: ActivityLog[];
}

class JsonDatabase {
  private dbPath: string;
  private data: DatabaseSchema;

  constructor() {
    const dataDir = path.resolve(__dirname, '../../../database');
    fs.mkdirSync(dataDir, { recursive: true });
    this.dbPath = path.join(dataDir, 'carbonroute.db.json');
    this.data = this.loadDatabase();
    this.seedDefaultsIfEmpty();
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [],
          presentations: parsed.presentations || [],
          resources: parsed.resources || [],
          teamMembers: parsed.teamMembers || [],
          roadmapMilestones: parsed.roadmapMilestones || [],
          activityLogs: parsed.activityLogs || parsed.auditLogs || [],
        };
      } catch (err) {
        console.error('Failed to parse database file, initializing default schema:', err);
      }
    }
    return {
      users: [],
      presentations: [],
      resources: [],
      teamMembers: [],
      roadmapMilestones: [],
      activityLogs: [],
    };
  }

  private saveDatabase(): void {
    fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  private seedDefaultsIfEmpty(): void {
    let changed = false;

    // Seed Admin User
    if (this.data.users.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync('CarbonRoute2026!Secure', salt);
      this.data.users.push({
        id: uuidv4(),
        username: 'admin',
        email: 'admin@carbonroute.org',
        passwordHash,
        role: 'admin',
        createdAt: new Date().toISOString(),
      });
      changed = true;
    }

    // Seed Team Members strictly matching prompt:
    // Yuvika Nagpal: Simulation / Data / Workload Modelling
    // Kumkum Gupta: Scheduling Algorithms / Uncertainty / Risk Calibration
    // Aaneya Sabharwal: Backend / Dashboard / Deployment / Integration
    if (!this.data.teamMembers || this.data.teamMembers.length === 0 || this.data.teamMembers[0].name === 'Yuvika') {
      this.data.teamMembers = [
        {
          id: 'team-1',
          name: 'Yuvika Nagpal',
          role: 'Simulation / Data / Workload Modelling',
          bio: 'Focuses on discrete-event cloud region simulation, carbon-intensity trace ingestion & standardization, and synthetic batch workload models.',
          avatarUrl: '',
          displayOrder: 1,
        },
        {
          id: 'team-2',
          name: 'Kumkum Gupta',
          role: 'Scheduling Algorithms / Uncertainty / Risk Calibration',
          bio: 'Focuses on baseline schedulers (Immediate, EDF, Cost-Aware), carbon-aware optimization, forecast error distribution modeling, and deadline-risk calibration (Brier score & ECE).',
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
      changed = true;
    }

    // Seed Presentations strictly adhering to prompt:
    // Software Grid (Status: Published)
    // Planning Presentation V1 (Status: Published, Date: 17 August 2026)
    // Planning Presentation V2 (Status: Not Published / Draft)
    // Mid-Sem Presentation (Status: Not Published)
    // Final Presentation (Status: Not Published)
    if (!this.data.presentations || this.data.presentations.length === 0 || !this.data.presentations.find(p => p.versionTag === 'v1')) {
      this.data.presentations = [
        {
          id: 'pres-grid-v1',
          title: 'Software Engineering Course Grid & Deliverables Specification',
          deliverableType: 'software_grid',
          versionTag: 'v1',
          description: 'Official Software Engineering UCS503 curriculum project grid and milestone roadmap overview.',
          fileName: 'CarbonRoute_Software_Grid.pdf',
          filePath: 'uploads/presentations/CarbonRoute_Software_Grid.pdf',
          fileSize: 45200,
          mimeType: 'application/pdf',
          fileUrl: '/api/storage/presentations/CarbonRoute_Software_Grid.pdf',
          authors: ['Yuvika Nagpal', 'Kumkum Gupta', 'Aaneya Sabharwal'],
          uploaderName: 'CarbonRoute Team',
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
          filePath: 'uploads/presentations/CarbonRoute_Planning_Presentation_V1.pdf',
          fileSize: 28033,
          mimeType: 'application/pdf',
          fileUrl: '/api/storage/presentations/CarbonRoute_Planning_Presentation_V1.pdf',
          authors: [
            'Yuvika Nagpal (1024030141)',
            'Kumkum Gupta (1024030144)',
            'Aaneya Sabharwal (1024030147)'
          ],
          uploaderName: 'Team TriFlux (Batch: 3C15)',
          status: 'published',
          presentationDate: '2026-08-17',
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
          filePath: 'uploads/presentations/CarbonRoute_Planning_Presentation_V2_Draft.pdf',
          fileSize: 124000,
          mimeType: 'application/pdf',
          fileUrl: '/api/storage/presentations/CarbonRoute_Planning_Presentation_V2_Draft.pdf',
          authors: ['Yuvika Nagpal', 'Kumkum Gupta', 'Aaneya Sabharwal'],
          uploaderName: 'CarbonRoute Team',
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
          uploaderName: 'CarbonRoute Team',
          status: 'draft',
          presentationDate: '2026-10-12',
          sha256Checksum: '',
          changeSummary: 'Scheduled mid-semester deliverable placeholder.',
          createdAt: '2026-08-18T00:00:00.000Z',
        },
        {
          id: 'pres-final-v1',
          title: 'Final Presentation',
          deliverableType: 'final',
          versionTag: 'final-v1',
          description: 'Comprehensive final project demonstration, statistical benchmark results, live Kubernetes container connector demo, and semester defense.',
          fileName: '',
          filePath: '',
          fileSize: 0,
          mimeType: 'application/pdf',
          fileUrl: '',
          authors: ['Yuvika Nagpal', 'Kumkum Gupta', 'Aaneya Sabharwal'],
          uploaderName: 'CarbonRoute Team',
          status: 'draft',
          presentationDate: '2026-12-21',
          sha256Checksum: '',
          changeSummary: 'Scheduled final presentation deliverable placeholder.',
          createdAt: '2026-08-18T00:00:00.000Z',
        },
      ];
      changed = true;
    }

    // Seed 17-Week Roadmap strictly matching prompt:
    if (!this.data.roadmapMilestones || this.data.roadmapMilestones.length === 0 || this.data.roadmapMilestones.length !== 11) {
      this.data.roadmapMilestones = [
        {
          id: 'w1-2',
          weekRange: 'WEEKS 1–2',
          title: 'Requirements, research and initial simulator prototype',
          description: 'Problem formulation, literature review, carbon intensity data ingestion specification, baseline simulator architecture, and website deployment.',
          status: 'in-progress',
          deliverables: ['Planning Presentation V1', 'Project Portal Deployment', 'Initial Simulator Spec'],
          displayOrder: 1,
        },
        {
          id: 'w3-4',
          weekRange: 'WEEKS 3–4',
          title: 'Simulator models and workload generation',
          description: 'Development of discrete-event simulator core, multi-region cloud capacity and pricing models, and synthetic batch workload generators (short, medium, long jobs).',
          status: 'planned',
          deliverables: ['Discrete-Event Simulator Core', 'Workload Generator Trace Engine'],
          displayOrder: 2,
        },
        {
          id: 'w5-6',
          weekRange: 'WEEKS 5–6',
          title: 'Baseline scheduling policies',
          description: 'Implementation of reference scheduling policies: Immediate Execution, Earliest Deadline First (EDF), Cost-Aware Scheduler, and Realized-Data Oracle solver.',
          status: 'planned',
          deliverables: ['Baseline Suite', 'Oracle Upper-Bound Reference Solver'],
          displayOrder: 3,
        },
        {
          id: 'w7-8',
          weekRange: 'WEEKS 7–8',
          title: 'Carbon-aware scheduler',
          description: 'Implementation of deterministic carbon-aware scheduling algorithms and heuristic multi-region workload shifting strategies.',
          status: 'planned',
          deliverables: ['Deterministic Carbon Scheduler', 'Trace Alignment Module'],
          displayOrder: 4,
        },
        {
          id: 'w9-10',
          weekRange: 'WEEKS 9–10',
          title: 'Forecast uncertainty and error modelling',
          description: 'Parametric and empirical forecast error distribution modeling across 1h to 48h look-ahead horizons to model variance growth over time.',
          status: 'planned',
          deliverables: ['Forecast Error Engine', 'Multi-Horizon Error Distribution Models'],
          displayOrder: 5,
        },
        {
          id: 'w11-12',
          weekRange: 'WEEKS 11–12',
          title: 'Uncertainty-aware scheduler and deadline-risk calibration',
          description: 'Core CarbonRoute scheduling algorithm enforcing P(deadline violation | decision) <= tau, combined with Brier score calibration and Reliability Diagrams.',
          status: 'planned',
          deliverables: ['CarbonRoute Uncertainty Scheduler', 'Risk Calibration Module (Brier/ECE)'],
          displayOrder: 6,
        },
        {
          id: 'w13',
          weekRange: 'WEEK 13',
          title: 'Stress testing',
          description: 'Systematic stress testing against sudden renewable drop-offs, cloud capacity contention, flash price spikes, and severe forecast skew.',
          status: 'planned',
          deliverables: ['Stress-Testing Matrix', 'Degradation & Robustness Analysis'],
          displayOrder: 7,
        },
        {
          id: 'w14',
          weekRange: 'WEEK 14',
          title: 'API and dashboard integration',
          description: 'FastAPI REST endpoint exposure for scheduling decisions and interactive web dashboard integration for visualizing schedules and risk curves.',
          status: 'planned',
          deliverables: ['FastAPI Endpoints', 'Interactive Scheduling Dashboard'],
          displayOrder: 8,
        },
        {
          id: 'w15',
          weekRange: 'WEEK 15',
          title: 'Large-scale repeated experiments and benchmark',
          description: 'Execution of multi-seed, multi-region reproducible benchmark suite across varying forecast error levels, producing paired statistical evaluations.',
          status: 'planned',
          deliverables: ['Reproducible Benchmark Bundle', 'Statistical Significance Tests'],
          displayOrder: 9,
        },
        {
          id: 'w16',
          weekRange: 'WEEK 16',
          title: 'Containerized workload connector, testing and deployment',
          description: 'Integration of container execution connector dispatching scheduled batch jobs to Kubernetes Jobs with explanation summaries.',
          status: 'planned',
          deliverables: ['Kubernetes Workload Connector', 'End-to-End Container Runner'],
          displayOrder: 10,
        },
        {
          id: 'w17',
          weekRange: 'WEEK 17',
          title: 'Final integration, evaluation, documentation and presentation',
          description: 'Comprehensive project evaluation, final documentation, open-source repository packaging, and university semester defense presentation.',
          status: 'planned',
          deliverables: ['Final Project Thesis / Report', 'Final Presentation V1', 'Release Artifact'],
          displayOrder: 11,
        },
      ];
      changed = true;
    }

    if (this.data.activityLogs.length === 0) {
      this.data.activityLogs.push({
        id: uuidv4(),
        userId: 'system',
        userName: 'System Init',
        action: 'PUBLISH',
        entityType: 'presentation',
        entityId: 'pres-planning-v1',
        details: 'Planning Presentation V1 published to public repository.',
        timestamp: '2026-08-17T10:00:00.000Z',
      });
      changed = true;
    }

    if (changed) {
      this.saveDatabase();
    }
  }

  // User Operations
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase());
  }

  // Presentation Operations
  getPresentations(includeDrafts = false): PresentationItem[] {
    if (includeDrafts) {
      return this.data.presentations;
    }
    return this.data.presentations.filter((p) => p.status === 'published');
  }

  getPresentationById(id: string): PresentationItem | undefined {
    return this.data.presentations.find((p) => p.id === id || p.versionTag.toLowerCase() === id.toLowerCase());
  }

  getPresentationByVersion(versionTag: string): PresentationItem | undefined {
    const norm = versionTag.toLowerCase().trim();
    if (norm === 'v1' || norm === 'planning-v1' || norm === 'planning') {
      const planning = this.data.presentations.find(
        (p) => p.deliverableType === 'planning' && p.versionTag === 'v1'
      );
      if (planning) return planning;
    }
    return this.data.presentations.find(
      (p) => p.versionTag.toLowerCase() === norm || p.id.toLowerCase() === norm
    );
  }

  addPresentation(item: Omit<PresentationItem, 'id' | 'createdAt'>): PresentationItem {
    const newItem: PresentationItem = {
      ...item,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    this.data.presentations.unshift(newItem);

    this.addActivityLog(
      'admin',
      item.uploaderName || 'Admin',
      'UPLOAD_PRESENTATION',
      'presentation',
      newItem.id,
      `Uploaded presentation ${newItem.title} (${newItem.versionTag})`
    );

    this.saveDatabase();
    return newItem;
  }

  updatePresentation(id: string, updates: Partial<PresentationItem>): PresentationItem | null {
    const idx = this.data.presentations.findIndex((p) => p.id === id || p.versionTag.toLowerCase() === id.toLowerCase());
    if (idx === -1) return null;

    const old = this.data.presentations[idx];
    const updated: PresentationItem = {
      ...old,
      ...updates,
    };

    if (updates.status === 'published' && old.status !== 'published') {
      updated.publishedAt = new Date().toISOString();
    }

    this.data.presentations[idx] = updated;

    this.addActivityLog(
      'admin',
      'Admin',
      'UPDATE_PRESENTATION',
      'presentation',
      updated.id,
      `Updated presentation ${updated.title} (${updated.versionTag}) - Status: ${updated.status}`
    );

    this.saveDatabase();
    return updated;
  }

  deletePresentation(id: string): boolean {
    const target = this.data.presentations.find((p) => p.id === id || p.versionTag.toLowerCase() === id.toLowerCase());
    if (!target) return false;

    // Never delete baseline v1
    if (target.versionTag.toLowerCase() === 'v1' && target.deliverableType === 'planning') {
      return false;
    }

    this.data.presentations = this.data.presentations.filter((p) => p.id !== target.id);

    this.addActivityLog(
      'admin',
      'Admin',
      'DELETE_PRESENTATION',
      'presentation',
      target.id,
      `Deleted presentation ${target.title} (${target.versionTag})`
    );

    this.saveDatabase();
    return true;
  }

  // Resources Operations
  getResources(category?: string): Resource[] {
    if (category && category !== 'all') {
      const norm = category.toLowerCase().replace(/[^a-z0-9]/g, '');
      return this.data.resources.filter(
        (r) =>
          r.isPublished &&
          (r.category.toLowerCase().replace(/[^a-z0-9]/g, '') === norm ||
            (r.type && r.type.toLowerCase().replace(/[^a-z0-9]/g, '') === norm))
      );
    }
    return this.data.resources.filter((r) => r.isPublished);
  }

  getAllResourcesAdmin(): Resource[] {
    return this.data.resources;
  }

  addResource(resource: Omit<Resource, 'id' | 'createdAt'>): Resource {
    const newResource: Resource = {
      ...resource,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    this.data.resources.unshift(newResource);
    this.saveDatabase();
    return newResource;
  }

  updateResource(id: string, updates: Partial<Resource>): Resource | null {
    const idx = this.data.resources.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.resources[idx] = {
      ...this.data.resources[idx],
      ...updates,
    };
    this.saveDatabase();
    return this.data.resources[idx];
  }

  deleteResource(id: string): boolean {
    const initialLen = this.data.resources.length;
    this.data.resources = this.data.resources.filter((r) => r.id !== id);
    if (this.data.resources.length !== initialLen) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // Team Members
  getTeamMembers(): TeamMember[] {
    return [...this.data.teamMembers].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  updateTeamMember(id: string, updates: Partial<TeamMember>): TeamMember | null {
    const idx = this.data.teamMembers.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.data.teamMembers[idx] = {
      ...this.data.teamMembers[idx],
      ...updates,
    };
    this.saveDatabase();
    return this.data.teamMembers[idx];
  }

  // Roadmap Milestones
  getRoadmapMilestones(): RoadmapMilestone[] {
    return [...this.data.roadmapMilestones].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  updateRoadmapMilestone(id: string, updates: Partial<RoadmapMilestone>): RoadmapMilestone | null {
    const idx = this.data.roadmapMilestones.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    this.data.roadmapMilestones[idx] = {
      ...this.data.roadmapMilestones[idx],
      ...updates,
    };
    this.saveDatabase();
    return this.data.roadmapMilestones[idx];
  }

  // Activity Log
  addActivityLog(
    userId: string,
    userName: string,
    action: string,
    entityType: ActivityLog['entityType'],
    entityId: string,
    details: string
  ): void {
    this.data.activityLogs.unshift({
      id: uuidv4(),
      userId,
      userName,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    });
    this.saveDatabase();
  }

  addAuditLog(
    action: string,
    entityType: string,
    entityId: string,
    details: string,
    performedBy: string = 'System'
  ): void {
    this.data.activityLogs.unshift({
      id: uuidv4(),
      userId: performedBy,
      userName: performedBy,
      action,
      entityType: entityType as any,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    });
    this.saveDatabase();
  }

  getActivityLogs(): ActivityLog[] {
    return this.data.activityLogs.slice(0, 50);
  }

  getAuditLogs(): ActivityLog[] {
    return this.data.activityLogs.slice(0, 50);
  }
}

export const db = new JsonDatabase();
