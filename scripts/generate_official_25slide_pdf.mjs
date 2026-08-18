import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generate25SlidePDF() {
  console.log('Generating official 25-slide Planning Presentation PDF for Team TriFlux...');

  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Landscape 16:9 Presentation Format (960 x 540 pt)
  const width = 960;
  const height = 540;

  const slidesData = [
    // Slide 1: Cover
    {
      type: 'cover',
      title: 'UCS503:\nCarbonRoute',
      subtitle: 'Uncertainty-Aware Carbon-Aware Batch Scheduling',
      teamName: 'Team Name: TriFlux',
      members: [
        'Yuvika Nagpal • 1024030141',
        'Kumkum Gupta • 1024030144',
        'Aaneya Sabharwal • 1024030147',
      ],
      batch: 'Batch: 3C15',
    },
    // Slide 2: Table of Contents
    {
      type: 'toc',
      title: 'TABLE OF CONTENTS',
      itemsCol1: [
        '01 | Introduction',
        '02 | Problem Statement & Research Gap',
        '03 | Project Scope & Objectives',
        '04 | Proposed Functions',
        '05 | Target Users',
        '06 | System Features',
        '07 | Interfaces & Technical Architecture',
        '08 | Performance Goals',
        '09 | Security Measures',
        '10 | Quality Attributes',
        '11 | Scheduling Policies & Baselines',
      ],
      itemsCol2: [
        '12 | Job Classes & Service Levels',
        '13 | Uncertainty-Aware Scheduling Method',
        '14 | Deadline-Risk Estimation & Calibration',
        '15 | Optimization & Risk-Aware Formulation',
        '16 | Data Sources & Trace Construction',
        '17 | Experiment Design & Scale',
        '18 | Evaluation & Reproducibility',
        '19 | Real Workload Connector & Public Website',
        '20 | Initial Planning',
        '21 | Team Responsibilities & Technical Risks',
        '22 | Conclusion',
        '23 | References',
      ],
    },
    // Slide 3: Introduction
    {
      page: '1',
      title: 'Introduction',
      paragraphs: [
        { label: 'Project overview: ', text: 'CarbonRoute is a software-only system for scheduling flexible batch workloads while reducing realized carbon emissions under uncertain carbon-intensity forecasts.' },
        { label: 'Why it matters: ', text: 'Carbon intensity varies across time and regions. Flexible workloads can be shifted, but forecast errors can make apparently clean schedules risky.' },
        { label: 'Presentation objective: ', text: 'Define the project scope, scheduling method, uncertainty/risk framework, system architecture, evaluation plan, deployment path and initial milestones.' },
      ],
    },
    // Slide 4: Problem Statement & Research Gap
    {
      page: '2',
      title: 'Problem Statement & Research Gap',
      paragraphs: [
        { label: 'Problem: ', text: 'Existing carbon-aware scheduling relies on forecasts that may contain bias, random error or missing values. Capacity limits, price changes, workload surges and tight deadlines can further affect decisions.' },
        { label: 'Research gap: ', text: 'CarbonRoute focuses on forecast-versus-realized analysis, deadline-violation probability, risk calibration, controlled stress testing and reproducible comparison of scheduling policies.' },
        { label: 'Positioning: ', text: 'CarbonRoute does not claim to invent carbon-aware scheduling; its contribution is an uncertainty-aware, calibrated and reproducible scheduling/evaluation framework.' },
      ],
    },
    // Slide 5: Project Scope & Objectives
    {
      page: '3',
      title: 'Project Scope & Objectives',
      paragraphs: [
        { label: 'In scope: ', text: 'Multi-region simulation, carbon traces, forecast-error modelling, cost/capacity modelling, scheduling algorithms, deadline-risk estimation, calibration, benchmark, dashboard, API, workload connector and public website.' },
        { label: 'Core objectives: ', text: 'Implement required baselines; develop uncertainty-aware scheduling; estimate and calibrate deadline risk; run controlled experiments; report statistical comparisons; connect the API to a real software workload interface.' },
        { label: 'Out of scope: ', text: 'Hardware/sensors, physical data-centre control, production workload migration, complete cloud-provider replacement, LLM-based scheduling and production-scale orchestration.' },
        { label: 'Project constraint: ', text: 'The project is completely software-based. No hardware component or LLM is required for scheduling logic.' },
      ],
    },
    // Slide 6: Proposed Functions
    {
      page: '4',
      title: 'Proposed Functions',
      bullets: [
        { num: '1. Job submission: ', text: 'Accept workload requirements such as release time, duration, resources, deadline, cost limit, region and risk tolerance.' },
        { num: '2. Scheduling: ', text: 'Generate candidate execution windows and select a feasible low-carbon option.' },
        { num: '3. Risk estimation: ', text: 'Estimate the probability of deadline violation using forecast uncertainty and workload conditions.' },
        { num: '4. Evaluation: ', text: 'Record realized outcomes and compare policies using carbon, deadline, risk and statistical metrics.' },
        { num: '5. Dispatch: ', text: 'After the framework is stable, send a containerized batch workload to a real software connector.' },
      ],
    },
    // Slide 7: Target Users
    {
      page: '5',
      title: 'Target Users',
      paragraphs: [
        { label: 'Cloud engineers: ', text: 'Schedule flexible workloads while controlling carbon and cost.' },
        { label: 'Data/ML engineers: ', text: 'Run training and analytics jobs within deadlines.' },
        { label: 'DevOps teams: ', text: 'Use an API to make scheduling decisions for containerized jobs.' },
        { label: 'Sustainability teams: ', text: 'Measure actual carbon reduction using quantitative evidence.' },
        { label: 'Researchers and students: ', text: 'Reproduce and compare scheduling policies and risk calibration.' },
      ],
    },
    // Slide 8: System Features
    {
      page: '6',
      title: 'System Features',
      paragraphs: [
        { label: 'Carbon-aware scheduling: ', text: 'Select lower-carbon feasible execution opportunities.' },
        { label: 'Uncertainty modelling: ', text: 'Represent forecast error rather than treating predictions as certain.' },
        { label: 'Deadline-risk estimation: ', text: 'Predict the probability of missing a deadline.' },
        { label: 'Risk calibration: ', text: 'Compare predicted risk with observed violation frequency using Brier Score, calibration error and reliability plots.' },
        { label: 'Benchmarking: ', text: 'Compare immediate, EDF, cost-aware, CarbonAware, CarbonRoute and oracle policies.' },
        { label: 'Reproducibility: ', text: 'Version traces, workloads, seeds, algorithms, parameters and solver limits.' },
        { label: 'Dashboard & API: ', text: 'Configure experiments, inspect decisions and publish results.' },
        { label: 'Workload connector: ', text: 'Dispatch a trusted containerized batch job.' },
      ],
    },
    // Slide 9: Interfaces & Technical Architecture
    {
      page: '7',
      title: 'Interfaces & Technical Architecture',
      isArch: true,
      tiers: [
        ['Public Website', 'Frontend Dashboard', 'FastAPI Backend'],
        ['Scheduling', 'Risk / Calibration', 'Experiment Engine'],
        ['PostgreSQL', 'Object Storage'],
        ['Simulator / Connector'],
      ],
      footerNote: 'Interfaces: REST/HTTPS • Carbon-data API • PostgreSQL • Object storage • Kubernetes/selected workload interface',
    },
    // Slide 10: Performance Goals
    {
      page: '8',
      title: 'Performance Goals',
      paragraphs: [
        { label: 'Scheduling response: ', text: 'Target low API latency for interactive scheduling decisions.' },
        { label: 'Experiment throughput: ', text: 'Support repeated runs across regions, workloads, forecast-error levels and seeds.' },
        { label: 'Data handling: ', text: 'Store traces and results efficiently while preserving version metadata.' },
        { label: 'Reliability: ', text: 'Detect infeasible schedules and connector failures without silently producing invalid results.' },
        { label: 'Achievement strategy: ', text: 'Modular Python services, efficient data processing, indexed result storage, bounded solver execution and continuous testing.' },
      ],
    },
    // Slide 11: Security Measures
    {
      page: '9',
      title: 'Security Measures',
      paragraphs: [
        { label: 'Authentication: ', text: 'Secure login for the administrative interface.' },
        { label: 'Authorization: ', text: 'Role-based access for publishing and project administration.' },
        { label: 'Data protection: ', text: 'Hashed passwords, secure object-storage access and protected credentials.' },
        { label: 'File security: ', text: 'Validate file types and sizes before storage.' },
        { label: 'Backend security: ', text: 'Validate API inputs, enforce authorization and maintain audit logs.' },
        { label: 'Workload security: ', text: 'Use trusted container images only; do not execute arbitrary unsafe code.' },
      ],
    },
    // Slide 12: Quality Attributes
    {
      page: '10',
      title: 'Quality Attributes',
      paragraphs: [
        { label: 'Reliability: ', text: 'Constraint validation, failure handling, unit/integration tests and reproducibility checks.' },
        { label: 'Usability: ', text: 'Clear scheduling explanations, visible risk values and an intuitive experiment dashboard.' },
        { label: 'Maintainability: ', text: 'Modular scheduler/risk/API components, version-controlled data and documented workflows.' },
        { label: 'Consistency: ', text: 'Run the same experiment configuration and seed to reproduce the same main results.' },
        { label: 'Testing: ', text: 'Scheduling correctness, API, constraint, performance and experiment-consistency tests.' },
      ],
    },
    // Slide 13: Scheduling Policies & Baselines
    {
      page: '11',
      title: 'Scheduling Policies & Baselines',
      paragraphs: [
        { label: 'Immediate execution: ', text: 'Runs the job as soon as resources are available.' },
        { label: 'Earliest Deadline First (EDF): ', text: 'Prioritizes jobs with the closest deadlines.' },
        { label: 'Cost-aware scheduling: ', text: 'Selects the cheapest feasible execution option.' },
        { label: 'CarbonAware Scheduler: ', text: 'Required external baseline for carbon-aware scheduling.' },
        { label: 'CarbonRoute: ', text: 'Proposed uncertainty-aware scheduler using carbon, uncertainty, risk and constraints.' },
        { label: 'Realized-data oracle: ', text: 'Uses future realized carbon only as a best-possible reference; it is not deployable.' },
      ],
    },
    // Slide 14: Job Classes & Service Levels
    {
      page: '12',
      title: 'Job Classes & Service Levels',
      paragraphs: [
        { label: 'Strict-deadline jobs: ', text: 'Deadlines cannot be violated. If no feasible schedule exists, the system reports infeasibility and explains the conflicting constraints. Example: A backup must finish before 11:00 PM.' },
        { label: 'Probabilistic-service jobs: ', text: 'A deadline may be treated as a service-level requirement. Example: A data-analysis job should finish before 10:00 PM with at least 95% probability.' },
        { label: 'Risk constraint: ', text: 'P(deadline violation) <= 0.05 for a 95% service requirement.' },
        { label: 'Decision output: ', text: 'The estimated deadline risk is displayed alongside the selected schedule.' },
      ],
    },
    // Slide 15: Uncertainty-Aware Scheduling Method
    {
      page: '13',
      title: 'Uncertainty-Aware Scheduling Method',
      paragraphs: [
        { label: 'Method: ', text: 'For every candidate window, combine carbon forecast + forecast uncertainty + workload conditions to estimate deadline risk, apply hard/risk constraints and select a feasible schedule.' },
        { label: 'Feasibility demonstration: ', text: 'Use the same job and the same predicted carbon values while changing only forecast uncertainty.' },
        { label: 'Low uncertainty: ', text: 'Example risk 2% -> delay to cleaner period.' },
        { label: 'High uncertainty: ', text: 'Example risk 18% -> start earlier.' },
        { label: 'Validation: ', text: 'Repeat the scenarios using realized outcomes and compare predicted risk with observed deadline violations.' },
      ],
    },
    // Slide 16: Deadline-Risk Estimation & Calibration
    {
      page: '14',
      title: 'Deadline-Risk Estimation & Calibration',
      paragraphs: [
        { label: 'Risk being estimated: ', text: 'Probability that a scheduled job will violate its deadline.' },
        { label: 'Calibration example: ', text: 'If 100 comparable jobs are predicted at 20% risk, about 20 should violate the deadline for a well-calibrated model.' },
        { label: 'Brier Score: ', text: 'Measures probabilistic prediction error.' },
        { label: 'Calibration Error / ECE: ', text: 'Measures the difference between predicted probability and observed outcome frequency.' },
        { label: 'Reliability plot: ', text: 'Predicted deadline-violation probability vs actual violation frequency; good calibration is close to the diagonal.' },
        { label: 'Required outputs: ', text: 'Brier Score + calibration error + reliability plot.' },
      ],
    },
    // Slide 17: Optimization & Risk-Aware Formulation
    {
      page: '15',
      title: 'Optimization & Risk-Aware Formulation',
      paragraphs: [
        { label: 'Objective factors: ', text: 'Expected/realized carbon, cloud cost, delay, deadline risk and forecast uncertainty.' },
        { label: 'Important design choice: ', text: 'CarbonRoute will not rely only on a weighted objective.' },
        { label: 'Constrained formulation: ', text: 'For probabilistic-service jobs, enforce P(deadline violation) <= epsilon.' },
        { label: 'Example: ', text: 'For a 95% service requirement, P(deadline violation) <= 0.05.' },
        { label: 'Sensitivity analysis: ', text: 'Vary risk thresholds, objective weights and forecast-error levels to test how decisions and outcomes change.' },
      ],
    },
    // Slide 18: Data Sources & Trace Construction
    {
      page: '16',
      title: 'Data Sources & Trace Construction',
      paragraphs: [
        { label: 'Data source to freeze: ', text: 'The current project plan references Electricity Maps. Before implementation, the team will freeze the provider, licence, supported regions, API/data limits and exact data fields.' },
        { label: 'Required specification: ', text: 'Region, time resolution, forecast horizon, missing-data treatment and forecast-realized alignment.' },
        { label: 'Trace fields: ', text: 'Timestamp, region, forecast carbon, realized carbon, energy cost, available CPU/memory and capacity status.' },
        { label: 'Versioning: ', text: 'Every trace receives a version identifier so experiments remain reproducible.' },
        { label: 'Alignment principle: ', text: 'Forecast values must be paired with the realized value for the same target time and region.' },
      ],
    },
    // Slide 19: Experiment Design & Scale
    {
      page: '17',
      title: 'Experiment Design & Scale',
      paragraphs: [
        { label: 'Initial scale: ', text: '3 regions; 30-minute resolution; 24-hour forecast horizon; 3 workload classes.' },
        { label: 'Workload volume: ', text: '100, 500 and 1,000 jobs per trace.' },
        { label: 'Forecast-error levels: ', text: '0%, 5%, 10%, 20% and 30%.' },
        { label: 'Repeated seeds: ', text: 'At least 30 seeds per configuration.' },
        { label: 'Workload classes: ', text: 'Flexible batch, tight-deadline and mixed workloads.' },
        { label: 'Stress scenarios: ', text: 'Forecast bias, random error, missing forecasts, capacity loss, price changes, workload surges and tight deadlines.' },
      ],
    },
    // Slide 20: Evaluation & Reproducibility
    {
      page: '18',
      title: 'Evaluation & Reproducibility',
      paragraphs: [
        { label: 'Carbon: ', text: 'Total realized emissions and carbon reduction percentage.' },
        { label: 'Deadline: ', text: 'Deadline-violation rate and mean job delay.' },
        { label: 'Risk: ', text: 'Brier Score, calibration error and reliability plots.' },
        { label: 'Comparison: ', text: 'Regret against oracle, paired algorithm comparisons and confidence intervals.' },
        { label: 'System: ', text: 'Scheduler runtime, resource utilization and completed jobs.' },
        { label: 'Reproducibility record: ', text: 'Trace version, workload version, seed, algorithm version, parameters and solver limit.' },
        { label: 'Workflow: ', text: 'The repository will provide one documented workflow to regenerate the main benchmark results, plots and summary tables.' },
      ],
    },
    // Slide 21: Real Workload Connector & Public Website
    {
      page: '19',
      title: 'Real Workload Connector & Public Website',
      paragraphs: [
        { label: 'Real connector: ', text: 'After the simulator and scheduling framework are stable, connect to at least one real software workload interface.' },
        { label: 'Planned connector: ', text: 'Kubernetes Jobs (preferred), using a small trusted containerized batch workload.' },
        { label: 'Final flow: ', text: 'Containerized job -> CarbonRoute API -> scheduling decision -> constraint/risk explanation -> Kubernetes dispatch -> execution status.' },
        { label: 'Public website: ', text: 'Homepage, Planning Presentation V1, future presentation/demo pages, admin interface and permanent versioned presentation pages.' },
        { label: 'Website requirement: ', text: 'Backend must actually handle authentication, upload, metadata, publishing and preservation of previous versions.' },
      ],
    },
    // Slide 22: Initial Planning — Feasibility, Gantt & Milestones
    {
      page: '20',
      title: 'Initial Planning — Feasibility, Gantt & Milestones',
      isTable: true,
      tableHeaders: ['Weeks', 'Phase', 'Milestone'],
      tableRows: [
        ['1–2', 'Requirements & research', 'Scope frozen'],
        ['3–4', 'Job/region/trace models', 'Simulation base'],
        ['5–6', 'Immediate + EDF + cost', 'Baselines'],
        ['7–8', 'CarbonAware + Oracle', 'Baseline set complete'],
        ['9–10', 'Forecast error + versioning', 'Trace pipeline'],
        ['11–12', 'Uncertainty + calibration', 'Risk model'],
        ['13', 'Stress testing', 'Robustness results'],
        ['14', 'API + dashboard', 'Hosted prototype'],
        ['15', 'Repeated experiments', 'Statistical results'],
        ['16', 'Testing + deployment + connector', 'End-to-end demo'],
        ['17', 'Final results + viva', 'Final delivery'],
      ],
    },
    // Slide 23: Team Responsibilities & Technical Risks
    {
      page: '21',
      title: 'Team Responsibilities & Technical Risks',
      paragraphs: [
        { label: 'Yuvika — Simulation & Traces: ', text: 'Simulation architecture, workload generation, carbon/workload traces and forecast-error scenarios.' },
        { label: 'Kumkum — Scheduling & Calibration: ', text: 'Scheduling algorithms, uncertainty model, deadline-risk estimation, calibration and baseline comparison.' },
        { label: 'Aaneya — API, Dashboard & Deployment: ', text: 'FastAPI, experiment dashboard, public website, file storage/versioning, testing, deployment and workload connector.' },
        { label: 'Key risks: ', text: 'Incomplete carbon data, scheduler complexity, insufficient calibration data, dashboard distraction, connector failure, reproducibility issues and deployment problems.' },
        { label: 'Mitigation: ', text: 'Freeze the data source; start with simple baselines; use repeated controlled traces; build the simulator first; start with a simple connector; version everything; deploy a minimal API early.' },
      ],
    },
    // Slide 24: Conclusion & Next Steps
    {
      page: '22',
      title: 'Conclusion & Next Steps',
      paragraphs: [
        { label: 'Summary: ', text: 'CarbonRoute is a software-only framework for uncertainty-aware carbon-aware batch scheduling under imperfect forecasts.' },
        { label: 'Core contribution: ', text: 'Combine scheduling, deadline-risk estimation, calibration and reproducible benchmark evaluation.' },
        { label: 'Final deliverables: ', text: 'Scheduling API, experiment dashboard, reproducible benchmark, public project website and real workload connector.' },
        { label: 'Immediate next steps: ', text: 'Freeze data-source and experiment specifications; implement the simulator and required baselines; define the uncertainty/risk model; establish the reproducibility workflow.' },
        { label: 'Expected outcome: ', text: 'Demonstrate which schedule is selected, why it is selected, which constraints affect it, how uncertain the decision is and whether predicted risk matches observed outcomes.' },
      ],
    },
    // Slide 25: References
    {
      page: '23',
      title: 'References',
      bullets: [
        { num: '1. CarbonAware Scheduler Documentation: ', text: 'https://docs.carbonaware.dev/scheduler/' },
        { num: '2. CarbonAware Python Scheduler Documentation: ', text: 'https://docs.carbonaware.dev/scheduler/python/' },
        { num: '3. Electricity Maps API Documentation: ', text: 'https://app.electricitymaps.com/api/docs/reference' },
        { num: '4. SimPy Documentation: ', text: 'https://simpy.readthedocs.io/' },
        { num: '5. NIST: ', text: 'Digital Twins and Digital-Twin Systems.' },
        { num: '6. Research literature: ', text: 'Carbon-aware scheduling, forecast uncertainty, constrained optimization and deadline-risk calibration.' },
      ],
    },
  ];

  for (let i = 0; i < slidesData.length; i++) {
    const s = slidesData[i];
    const page = pdfDoc.addPage([width, height]);

    // Background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.97, 0.98, 0.98),
    });

    if (s.type === 'cover') {
      // Cover Top Left Teal Block
      page.drawRectangle({
        x: 0,
        y: 200,
        width: 740,
        height: 340,
        color: rgb(0.24, 0.48, 0.46),
      });

      // UCS503: CarbonRoute
      page.drawText('UCS503:', {
        x: 40,
        y: 450,
        size: 42,
        font: helveticaBold,
        color: rgb(0.12, 0.22, 0.21),
      });

      page.drawText('CarbonRoute', {
        x: 40,
        y: 380,
        size: 56,
        font: helveticaBold,
        color: rgb(0.12, 0.22, 0.21),
      });

      page.drawText('Uncertainty-Aware Carbon-Aware Batch Scheduling', {
        x: 40,
        y: 320,
        size: 22,
        font: helvetica,
        color: rgb(0.15, 0.30, 0.28),
      });

      // Bottom Left Team Info
      page.drawText('Team Name: TriFlux', {
        x: 40,
        y: 160,
        size: 22,
        font: helveticaBold,
        color: rgb(0.15, 0.20, 0.22),
      });

      let my = 125;
      for (const m of s.members) {
        page.drawText(m, {
          x: 40,
          y: my,
          size: 16,
          font: helveticaBold,
          color: rgb(0.20, 0.25, 0.28),
        });
        my -= 26;
      }

      page.drawText(s.batch, {
        x: 40,
        y: 35,
        size: 16,
        font: helveticaBold,
        color: rgb(0.15, 0.20, 0.22),
      });

      continue;
    }

    if (s.type === 'toc') {
      // Top Green Header Bar
      page.drawRectangle({
        x: 0,
        y: height - 100,
        width,
        height: 100,
        color: rgb(0.24, 0.48, 0.46),
      });

      page.drawText('TABLE OF CONTENTS', {
        x: 290,
        y: height - 65,
        size: 34,
        font: helveticaBold,
        color: rgb(0.12, 0.22, 0.21),
      });

      // Column 1
      let y1 = height - 140;
      for (const item of s.itemsCol1) {
        page.drawRectangle({
          x: 100,
          y: y1 - 4,
          width: 32,
          height: 22,
          color: rgb(0.18, 0.48, 0.52),
        });
        page.drawText(item.substring(0, 2), {
          x: 108,
          y: y1 + 1,
          size: 13,
          font: helveticaBold,
          color: rgb(1, 1, 1),
        });
        page.drawText(item.substring(4), {
          x: 145,
          y: y1 + 1,
          size: 13.5,
          font: helveticaBold,
          color: rgb(0.2, 0.28, 0.3),
        });
        y1 -= 32;
      }

      // Column 2
      let y2 = height - 140;
      for (const item of s.itemsCol2) {
        page.drawRectangle({
          x: 520,
          y: y2 - 4,
          width: 32,
          height: 22,
          color: rgb(0.18, 0.48, 0.52),
        });
        page.drawText(item.substring(0, 2), {
          x: 528,
          y: y2 + 1,
          size: 13,
          font: helveticaBold,
          color: rgb(1, 1, 1),
        });
        page.drawText(item.substring(4), {
          x: 565,
          y: y2 + 1,
          size: 13.5,
          font: helveticaBold,
          color: rgb(0.2, 0.28, 0.3),
        });
        y2 -= 30;
      }

      continue;
    }

    // Standard Slide Header
    page.drawRectangle({
      x: 0,
      y: height - 60,
      width: 70,
      height: 60,
      color: rgb(0.24, 0.48, 0.46),
    });

    page.drawText(s.title, {
      x: 95,
      y: height - 48,
      size: 28,
      font: helveticaBold,
      color: rgb(0.15, 0.22, 0.25),
    });

    // Green Divider Line
    page.drawLine({
      start: { x: 80, y: height - 70 },
      end: { x: width - 50, y: height - 70 },
      thickness: 1.5,
      color: rgb(0.24, 0.48, 0.46),
    });

    // Content Rendering
    let currentY = height - 110;

    if (s.isArch) {
      // Draw Architectural Hierarchy Boxes
      const drawBox = (txt, bx, by, bw, bh) => {
        page.drawRectangle({
          x: bx,
          y: by,
          width: bw,
          height: bh,
          color: rgb(0.95, 0.98, 0.98),
          borderColor: rgb(0.7, 0.82, 0.82),
          borderWidth: 1.5,
        });
        const textWidth = helveticaBold.widthOfTextAtSize(txt, 13);
        page.drawText(txt, {
          x: bx + (bw - textWidth) / 2,
          y: by + (bh - 13) / 2 + 2,
          size: 13,
          font: helveticaBold,
          color: rgb(0.18, 0.28, 0.3),
        });
      };

      // Tier 1: 3 boxes
      drawBox('Public Website', 120, height - 130, 200, 42);
      drawBox('Frontend Dashboard', 380, height - 130, 200, 42);
      drawBox('FastAPI Backend', 640, height - 130, 200, 42);

      // Tier 2: 3 boxes
      drawBox('Scheduling', 120, height - 210, 200, 42);
      drawBox('Risk / Calibration', 380, height - 210, 200, 42);
      drawBox('Experiment Engine', 640, height - 210, 200, 42);

      // Tier 3: 2 boxes
      drawBox('PostgreSQL', 240, height - 290, 220, 42);
      drawBox('Object Storage', 500, height - 290, 220, 42);

      // Tier 4: 1 box
      drawBox('Simulator / Connector', 340, height - 370, 280, 42);

      // Bottom Note
      page.drawText(s.footerNote, {
        x: 60,
        y: 40,
        size: 12,
        font: helvetica,
        color: rgb(0.35, 0.45, 0.48),
      });

    } else if (s.isTable) {
      // Table Header
      let ty = height - 110;
      page.drawRectangle({
        x: 70,
        y: ty - 6,
        width: 820,
        height: 28,
        color: rgb(0.24, 0.48, 0.46),
      });

      page.drawText('Weeks', { x: 85, y: ty + 2, size: 13, font: helveticaBold, color: rgb(1, 1, 1) });
      page.drawText('Phase', { x: 260, y: ty + 2, size: 13, font: helveticaBold, color: rgb(1, 1, 1) });
      page.drawText('Milestone', { x: 580, y: ty + 2, size: 13, font: helveticaBold, color: rgb(1, 1, 1) });

      ty -= 30;
      for (const row of s.tableRows) {
        page.drawText(row[0], { x: 85, y: ty, size: 12, font: helvetica, color: rgb(0.2, 0.25, 0.28) });
        page.drawText(row[1], { x: 260, y: ty, size: 12, font: helvetica, color: rgb(0.2, 0.25, 0.28) });
        page.drawText(row[2], { x: 580, y: ty, size: 12, font: helvetica, color: rgb(0.2, 0.25, 0.28) });
        ty -= 24;
      }

    } else if (s.bullets) {
      for (const b of s.bullets) {
        page.drawText(b.num, {
          x: 80,
          y: currentY,
          size: 14.5,
          font: helveticaBold,
          color: rgb(0.15, 0.2, 0.25),
        });
        const numWidth = helveticaBold.widthOfTextAtSize(b.num, 14.5);
        
        // Simple text wrap for bullet
        const words = b.text.split(' ');
        let line = '';
        let bx = 80 + numWidth;
        let isFirst = true;

        for (const w of words) {
          const testLine = line + (line ? ' ' : '') + w;
          const lineWidth = helvetica.widthOfTextAtSize(testLine, 14.5);
          if (bx + lineWidth > width - 70 && !isFirst) {
            page.drawText(line, {
              x: bx,
              y: currentY,
              size: 14.5,
              font: helvetica,
              color: rgb(0.25, 0.3, 0.35),
            });
            currentY -= 22;
            line = w;
            bx = 80;
          } else {
            line = testLine;
          }
        }
        if (line) {
          page.drawText(line, {
            x: bx,
            y: currentY,
            size: 14.5,
            font: helvetica,
            color: rgb(0.25, 0.3, 0.35),
          });
        }
        currentY -= 36;
      }

    } else if (s.paragraphs) {
      for (const p of s.paragraphs) {
        // Label in bold
        const labelWidth = helveticaBold.widthOfTextAtSize(p.label, 14.5);
        page.drawText(p.label, {
          x: 80,
          y: currentY,
          size: 14.5,
          font: helveticaBold,
          color: rgb(0.15, 0.2, 0.25),
        });

        // Text wrap after label
        const words = p.text.split(' ');
        let line = '';
        let px = 80 + labelWidth;
        let firstLine = true;

        for (const w of words) {
          const test = line + (line ? ' ' : '') + w;
          const testW = helvetica.widthOfTextAtSize(test, 14.5);
          if (px + testW > width - 70 && !firstLine) {
            page.drawText(line, {
              x: px,
              y: currentY,
              size: 14.5,
              font: helvetica,
              color: rgb(0.25, 0.3, 0.35),
            });
            currentY -= 22;
            line = w;
            px = 80;
          } else if (px + testW > width - 70 && firstLine) {
            page.drawText(line, {
              x: px,
              y: currentY,
              size: 14.5,
              font: helvetica,
              color: rgb(0.25, 0.3, 0.35),
            });
            currentY -= 22;
            line = w;
            px = 80;
            firstLine = false;
          } else {
            line = test;
          }
        }
        if (line) {
          page.drawText(line, {
            x: px,
            y: currentY,
            size: 14.5,
            font: helvetica,
            color: rgb(0.25, 0.3, 0.35),
          });
        }
        currentY -= 36;
      }
    }

    // Page Number
    if (s.page) {
      page.drawText(s.page, {
        x: 80,
        y: 35,
        size: 13,
        font: helveticaBold,
        color: rgb(0.24, 0.48, 0.46),
      });
    }

    // Bottom Right Teal Accent Block
    page.drawRectangle({
      x: width - 65,
      y: 0,
      width: 65,
      height: 55,
      color: rgb(0.24, 0.48, 0.46),
    });
  }

  const pdfBytes = await pdfDoc.save();

  const out1 = path.resolve('./backend/uploads/presentations/CarbonRoute_Planning_Presentation_V1.pdf');
  const out2 = path.resolve('./frontend/public/CarbonRoute_Planning_Presentation_V1.pdf');

  fs.mkdirSync(path.dirname(out1), { recursive: true });
  fs.mkdirSync(path.dirname(out2), { recursive: true });

  fs.writeFileSync(out1, pdfBytes);
  fs.writeFileSync(out2, pdfBytes);

  console.log(`Generated official 25-slide PDF! Size: ${pdfBytes.length} bytes.`);
}

generate25SlidePDF().catch(console.error);
