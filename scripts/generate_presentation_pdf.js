const path = require('path');
const fs = require('fs');

// Resolve pdf-lib from backend node_modules
const pdfLibPath = path.resolve(__dirname, '../backend/node_modules/pdf-lib');
const { PDFDocument, rgb, StandardFonts } = require(pdfLibPath);

async function createPlanningPresentationPdf() {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const width = 960;
  const height = 540; // 16:9 widescreen presentation slide format

  const darkBg = rgb(15 / 255, 23 / 255, 42 / 255); // Slate-900
  const emeraldAccent = rgb(52 / 255, 211 / 255, 153 / 255); // Emerald-400
  const tealAccent = rgb(45 / 255, 212 / 255, 191 / 255); // Teal-400
  const textWhite = rgb(1, 1, 1);
  const textSlate300 = rgb(203 / 255, 213 / 255, 225 / 255);
  const textSlate400 = rgb(148 / 255, 163 / 255, 184 / 255);
  const cardBg = rgb(30 / 255, 41 / 255, 59 / 255); // Slate-800
  const borderCol = rgb(51 / 255, 65 / 255, 85 / 255);

  const slides = [
    {
      type: 'title',
      title: 'CARBONROUTE',
      subtitle: 'A Reproducible Benchmark and Deadline-Risk Calibrator for Carbon-Aware Batch Scheduling under Forecast Error',
      course: 'Software Engineering - UCS503',
      supervisor: 'Submitted to: Sukhpal Singh',
      team: 'Team: Yuvika Nagpal, Kumkum Gupta, Aaneya Sabharwal',
      date: 'Date: 17 August 2026',
      badge: 'PLANNING PRESENTATION V1',
    },
    {
      type: 'content',
      category: '1. Problem Statement',
      title: 'Why CarbonRoute? Problem & Motivation',
      points: [
        'Cloud workloads such as ML training, data processing, backups, and rendering can be delayed within a deadline.',
        'Carbon-aware scheduling attempts to move these workloads toward periods or regions with lower predicted carbon intensity.',
        'However, real-world carbon forecasts are noisy and cloud capacity/spot availability changes dynamically.',
        'Blindly scheduling based on point forecasts leads to severe deadline violations when forecasts err.',
        'CarbonRoute evaluates how reliable scheduling decisions remain under forecast and capacity uncertainty.',
      ],
    },
    {
      type: 'content',
      category: '2. Research Question & Objectives',
      title: 'Core Research Question & 10 Objectives',
      subtitle: 'How reliable is carbon-aware scheduling when carbon forecasts, capacity and prices are uncertain, and can deadline-miss risk be calibrated?',
      points: [
        '1. Build a simulator representing cloud regions, workloads, carbon intensity, cost and capacity.',
        '2. Implement baseline scheduling policies (Immediate, EDF, Cost-Aware, Deterministic Carbon, Baseline).',
        '3. Model forecast uncertainty and error distributions across multiple look-ahead horizons.',
        '4. Develop uncertainty-aware scheduling optimizing P(deadline violation | decision) <= tau.',
        '5. Evaluate risk calibration using Brier score and Reliability Diagrams.',
        '6. Perform systematic stress testing under extreme grid volatility and capacity contention.',
        '7. Build a reproducible evaluation benchmark with versioned trace datasets.',
        '8. Expose scheduling algorithms via FastAPI REST endpoints and an interactive dashboard.',
        '9. Connect a containerized workload connector (Kubernetes Jobs) for real execution.',
        '10. Deliver a production-ready, open-source research artifact across the 17-week semester.',
      ],
    },
    {
      type: 'scope',
      category: '3. Project Scope',
      title: 'Software Engineering Project Scope',
      included: [
        'Cloud & Region Simulator (discrete-event)',
        'Versioned Traces & Workload Generator',
        '6+ Scheduling Policy Implementations',
        'Forecast Uncertainty & Error Modeller',
        'Deadline-Risk Calibrator (Brier / ECE)',
        'Parametric Stress Testing Engine',
        'FastAPI REST Backend + React Dashboard',
        'Reproducible Benchmark Framework',
        'One Containerized Workload Connector',
      ],
      notIncluded: [
        'Physical data-center hardware management',
        'Real-time hypervisor level VM live-migration',
        'Full proprietary AWS/GCP cloud replacement',
        'Opaque LLM-based black-box scheduling',
        'Direct power-grid substation control',
      ],
    },
    {
      type: 'content',
      category: '4. System Architecture',
      title: 'End-to-End Modular Architecture',
      points: [
        '[Workload Generator] -> Defines synthetic & trace-based container batch jobs with arrival & deadline.',
        '[Cloud Region Simulator] -> Models multi-region electricity carbon intensity (gCO2eq/kWh) and capacity.',
        '[Trace Builder] -> Standardizes historical forecasts, realized ground-truth, and regional spot tariffs.',
        '[Scheduling Engine] -> Compares Immediate, EDF, Cost-Aware, Carbon-Aware, and Uncertainty-Aware policies.',
        '[Risk & Uncertainty Model] -> Computes P(deadline miss) using calibrated probability distributions.',
        '[Experiment & Stress-Test Engine] -> Evaluates sensitivity across forecast error variances and load spikes.',
        '[API & Dashboard] -> FastAPI backend + Modern React frontend providing visual insights and dispatch triggers.',
      ],
    },
    {
      type: 'policies',
      category: '5. Scheduling Policies',
      title: 'Comparative Scheduling Policies Matrix',
      policies: [
        { name: 'Immediate', desc: 'Executes jobs immediately upon arrival with zero intentional delay.' },
        { name: 'Earliest Deadline First (EDF)', desc: 'Prioritizes jobs with the closest deadline to minimize overdue probability.' },
        { name: 'Cost-Aware', desc: 'Schedules jobs during lowest cloud electricity/spot price intervals.' },
        { name: 'Deterministic Carbon-Aware', desc: 'Schedules at the lowest predicted carbon point without error variance.' },
        { name: 'Carbon-Aware Baseline', desc: 'Standard heuristic baseline balancing average carbon and basic deadlines.' },
        { name: 'Uncertainty-Aware (CarbonRoute)', desc: 'Optimizes carbon while strictly bounding calibrated deadline violation risk.' },
        { name: 'Oracle Reference Solver', desc: 'Theoretical benchmark using realized future info (not a production scheduler).' },
      ],
    },
    {
      type: 'uncertainty',
      category: '6. Uncertainty & Risk Calibration',
      title: 'Uncertainty-Aware Decision Formulation',
      text: 'CarbonRoute does not simply choose the lowest predicted carbon value. It considers uncertainty and deadline risk when comparing feasible schedules.',
      scenarioA: {
        title: 'Scenario A: High Confidence Forecast',
        details: 'Low error variance -> Wait for predicted renewable valley -> Lower carbon achieved -> Low deadline risk.',
      },
      scenarioB: {
        title: 'Scenario B: Low Confidence Forecast',
        details: 'High error variance -> Consider earlier execution -> Slightly higher carbon acceptable -> Protects deadline.',
      },
    },
    {
      type: 'roadmap',
      category: '7. 17-Week Roadmap',
      title: '17-Week Software Engineering Roadmap (UCS503)',
      phases: [
        { weeks: 'WEEKS 1-2', text: 'Requirements, research, initial simulator prototype, platform setup' },
        { weeks: 'WEEKS 3-4', text: 'Simulator models and workload generation (discrete-event trace engine)' },
        { weeks: 'WEEKS 5-6', text: 'Baseline scheduling policies (Immediate, EDF, Cost-Aware, Oracle)' },
        { weeks: 'WEEKS 7-8', text: 'Deterministic Carbon-Aware scheduler and trace integration' },
        { weeks: 'WEEKS 9-10', text: 'Forecast uncertainty and multi-horizon error modeling' },
        { weeks: 'WEEKS 11-12', text: 'Uncertainty-aware scheduler and deadline-risk calibration' },
        { weeks: 'WEEK 13', text: 'Stress testing and edge-case validation under volatility' },
        { weeks: 'WEEK 14', text: 'API and interactive dashboard integration' },
        { weeks: 'WEEK 15', text: 'Large-scale repeated experiments and reproducible benchmark' },
        { weeks: 'WEEK 16', text: 'Containerized workload connector (Kubernetes Jobs), testing & deployment' },
        { weeks: 'WEEK 17', text: 'Final integration, evaluation, documentation, and university presentation' },
      ],
    },
    {
      type: 'content',
      category: '8. Evaluation Strategy',
      title: 'Rigorous Evaluation Metrics (Planned)',
      subtitle: 'All metrics will be empirically evaluated during benchmarking phases (Zero fake results)',
      points: [
        '1. Carbon Emissions: Cumulative gCO2eq consumed per batch execution cycle.',
        '2. Cloud Cost: Infrastructure and electricity cost incurred across regions.',
        '3. Job Delay / Makespan: Average and 95th-percentile execution wait time.',
        '4. Deadline Violation Rate: Percentage of batch jobs failing to complete before deadline.',
        '5. Risk Calibration: Brier score and Expected Calibration Error (ECE) for predicted vs realized risk.',
        '6. Oracle Regret: Distance from theoretical optimal schedule computed by Oracle.',
        '7. Runtime & Resource Utilization: Algorithmic solve overhead and compute efficiency.',
      ],
    },
    {
      type: 'team',
      category: '9. Research Team & Deliverables',
      title: 'CarbonRoute Research Team & Deliverables',
      team: [
        { name: 'Yuvika Nagpal', role: 'Simulation / Data / Workload Modelling' },
        { name: 'Kumkum Gupta', role: 'Scheduling Algorithms / Uncertainty / Risk Calibration' },
        { name: 'Aaneya Sabharwal', role: 'Backend / Dashboard / Deployment / Integration' },
      ],
      note: 'Testing, documentation, evaluation, and presentation are shared team responsibilities.',
    },
  ];

  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    const page = pdfDoc.addPage([width, height]);

    // Background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: darkBg,
    });

    // Decorative subtle top border accent
    page.drawRectangle({
      x: 0,
      y: height - 4,
      width,
      height: 4,
      color: emeraldAccent,
    });

    // Slide Number & Footer
    page.drawText(`CarbonRoute | UCS503 Planning Presentation V1 | Slide ${i + 1} of ${slides.length}`, {
      x: 40,
      y: 25,
      size: 10,
      font: fontMono,
      color: textSlate400,
    });

    page.drawText(`17 August 2026`, {
      x: width - 140,
      y: 25,
      size: 10,
      font: fontMono,
      color: textSlate400,
    });

    if (s.type === 'title') {
      // Title Slide
      page.drawRectangle({
        x: 40,
        y: height - 90,
        width: 220,
        height: 24,
        color: cardBg,
        borderColor: emeraldAccent,
        borderWidth: 1,
      });

      page.drawText(s.badge, {
        x: 52,
        y: height - 74,
        size: 10,
        font: fontMono,
        color: emeraldAccent,
      });

      page.drawText(s.title, {
        x: 40,
        y: height - 160,
        size: 44,
        font: fontBold,
        color: textWhite,
      });

      const subLines = [
        'A Reproducible Benchmark and Deadline-Risk Calibrator for',
        'Carbon-Aware Batch Scheduling under Forecast Error',
      ];
      page.drawText(subLines[0], {
        x: 40,
        y: height - 200,
        size: 18,
        font: fontRegular,
        color: emeraldAccent,
      });
      page.drawText(subLines[1], {
        x: 40,
        y: height - 225,
        size: 18,
        font: fontRegular,
        color: emeraldAccent,
      });

      // Details card
      page.drawRectangle({
        x: 40,
        y: 65,
        width: width - 80,
        height: 180,
        color: cardBg,
        borderColor: borderCol,
        borderWidth: 1,
      });

      page.drawText(s.course, {
        x: 65,
        y: 210,
        size: 14,
        font: fontBold,
        color: textWhite,
      });

      page.drawText(s.supervisor, {
        x: 65,
        y: 180,
        size: 13,
        font: fontRegular,
        color: textSlate300,
      });

      page.drawText(s.team, {
        x: 65,
        y: 145,
        size: 13,
        font: fontBold,
        color: tealAccent,
      });

      page.drawText(s.date, {
        x: 65,
        y: 110,
        size: 12,
        font: fontMono,
        color: textSlate400,
      });

      page.drawText('Department of Computer Science & Engineering', {
        x: 65,
        y: 85,
        size: 11,
        font: fontRegular,
        color: textSlate400,
      });
    } else if (s.type === 'content') {
      page.drawText(s.category, {
        x: 40,
        y: height - 60,
        size: 11,
        font: fontMono,
        color: emeraldAccent,
      });

      page.drawText(s.title, {
        x: 40,
        y: height - 90,
        size: 22,
        font: fontBold,
        color: textWhite,
      });

      let startY = height - 120;
      if (s.subtitle) {
        page.drawText(s.subtitle, {
          x: 40,
          y: startY,
          size: 12,
          font: fontRegular,
          color: tealAccent,
        });
        startY -= 30;
      }

      page.drawRectangle({
        x: 40,
        y: 60,
        width: width - 80,
        height: startY - 50,
        color: cardBg,
        borderColor: borderCol,
        borderWidth: 1,
      });

      let lineY = startY - 35;
      for (const pt of s.points) {
        page.drawText('>', {
          x: 65,
          y: lineY,
          size: 13,
          font: fontBold,
          color: emeraldAccent,
        });
        page.drawText(pt, {
          x: 85,
          y: lineY,
          size: 11.5,
          font: fontRegular,
          color: textSlate300,
        });
        lineY -= 26;
      }
    } else if (s.type === 'scope') {
      page.drawText(s.category, {
        x: 40,
        y: height - 60,
        size: 11,
        font: fontMono,
        color: emeraldAccent,
      });

      page.drawText(s.title, {
        x: 40,
        y: height - 90,
        size: 22,
        font: fontBold,
        color: textWhite,
      });

      const colWidth = (width - 100) / 2;

      // Included Column
      page.drawRectangle({
        x: 40,
        y: 60,
        width: colWidth,
        height: height - 170,
        color: cardBg,
        borderColor: emeraldAccent,
        borderWidth: 1,
      });

      page.drawText('INCLUDED IN PROJECT', {
        x: 60,
        y: height - 145,
        size: 13,
        font: fontBold,
        color: emeraldAccent,
      });

      let incY = height - 175;
      for (const item of s.included) {
        page.drawText('[+] ' + item, {
          x: 60,
          y: incY,
          size: 11,
          font: fontRegular,
          color: textSlate300,
        });
        incY -= 24;
      }

      // Not Included Column
      page.drawRectangle({
        x: 40 + colWidth + 20,
        y: 60,
        width: colWidth,
        height: height - 170,
        color: cardBg,
        borderColor: borderCol,
        borderWidth: 1,
      });

      page.drawText('NOT INCLUDED INITIALLY', {
        x: 60 + colWidth + 20,
        y: height - 145,
        size: 13,
        font: fontBold,
        color: rgb(244 / 255, 63 / 255, 94 / 255),
      });

      let notY = height - 175;
      for (const item of s.notIncluded) {
        page.drawText('[-] ' + item, {
          x: 60 + colWidth + 20,
          y: notY,
          size: 11,
          font: fontRegular,
          color: textSlate400,
        });
        notY -= 24;
      }
    } else if (s.type === 'policies') {
      page.drawText(s.category, {
        x: 40,
        y: height - 60,
        size: 11,
        font: fontMono,
        color: emeraldAccent,
      });

      page.drawText(s.title, {
        x: 40,
        y: height - 90,
        size: 22,
        font: fontBold,
        color: textWhite,
      });

      let polY = height - 130;
      for (const pol of s.policies) {
        const isProposed = pol.name.includes('CarbonRoute');
        const isOracle = pol.name.includes('Oracle');

        page.drawRectangle({
          x: 40,
          y: polY - 10,
          width: width - 80,
          height: 38,
          color: cardBg,
          borderColor: isProposed ? emeraldAccent : isOracle ? tealAccent : borderCol,
          borderWidth: 1,
        });

        page.drawText(pol.name, {
          x: 55,
          y: polY + 12,
          size: 11.5,
          font: fontBold,
          color: isProposed ? emeraldAccent : isOracle ? tealAccent : textWhite,
        });

        page.drawText(pol.desc, {
          x: 320,
          y: polY + 12,
          size: 10.5,
          font: fontRegular,
          color: textSlate300,
        });

        polY -= 46;
      }
    } else if (s.type === 'uncertainty') {
      page.drawText(s.category, {
        x: 40,
        y: height - 60,
        size: 11,
        font: fontMono,
        color: emeraldAccent,
      });

      page.drawText(s.title, {
        x: 40,
        y: height - 90,
        size: 22,
        font: fontBold,
        color: textWhite,
      });

      page.drawText(s.text, {
        x: 40,
        y: height - 120,
        size: 12,
        font: fontRegular,
        color: tealAccent,
      });

      const cardW = (width - 100) / 2;

      // Scenario A
      page.drawRectangle({
        x: 40,
        y: 80,
        width: cardW,
        height: 280,
        color: cardBg,
        borderColor: emeraldAccent,
        borderWidth: 1,
      });

      page.drawText(s.scenarioA.title, {
        x: 60,
        y: 320,
        size: 14,
        font: fontBold,
        color: emeraldAccent,
      });

      page.drawText('> Forecast Confidence: High (Low Variance)', { x: 60, y: 280, size: 11, font: fontRegular, color: textWhite });
      page.drawText('> Action: Wait for deep carbon valley', { x: 60, y: 250, size: 11, font: fontRegular, color: textSlate300 });
      page.drawText('> Carbon Benefit: Significant reduction', { x: 60, y: 220, size: 11, font: fontRegular, color: textSlate300 });
      page.drawText('> Deadline Violation Risk: Calibrated <= 5%', { x: 60, y: 190, size: 11, font: fontBold, color: emeraldAccent });
      page.drawText('> Recommendation: Approve delayed dispatch', { x: 60, y: 160, size: 11, font: fontRegular, color: tealAccent });

      // Scenario B
      page.drawRectangle({
        x: 40 + cardW + 20,
        y: 80,
        width: cardW,
        height: 280,
        color: cardBg,
        borderColor: rgb(245 / 255, 158 / 255, 11 / 255),
        borderWidth: 1,
      });

      page.drawText(s.scenarioB.title, {
        x: 60 + cardW + 20,
        y: 320,
        size: 14,
        font: fontBold,
        color: rgb(245 / 255, 158 / 255, 11 / 255),
      });

      page.drawText('> Forecast Confidence: Low (High Uncertainty)', { x: 60 + cardW + 20, y: 280, size: 11, font: fontRegular, color: textWhite });
      page.drawText('> Action: Shift back to safer earlier window', { x: 60 + cardW + 20, y: 250, size: 11, font: fontRegular, color: textSlate300 });
      page.drawText('> Carbon Tradeoff: Higher carbon acceptable', { x: 60 + cardW + 20, y: 220, size: 11, font: fontRegular, color: textSlate300 });
      page.drawText('> Deadline Violation Risk: Protected < 10%', { x: 60 + cardW + 20, y: 190, size: 11, font: fontBold, color: rgb(245 / 255, 158 / 255, 11 / 255) });
      page.drawText('> Recommendation: Prevent risky delay', { x: 60 + cardW + 20, y: 160, size: 11, font: fontRegular, color: textSlate300 });
    } else if (s.type === 'roadmap') {
      page.drawText(s.category, {
        x: 40,
        y: height - 60,
        size: 11,
        font: fontMono,
        color: emeraldAccent,
      });

      page.drawText(s.title, {
        x: 40,
        y: height - 90,
        size: 22,
        font: fontBold,
        color: textWhite,
      });

      let rY = height - 125;
      for (const p of s.phases) {
        page.drawRectangle({
          x: 40,
          y: rY - 4,
          width: 95,
          height: 22,
          color: p.weeks === 'WEEKS 1-2' ? emeraldAccent : cardBg,
          borderColor: borderCol,
          borderWidth: 1,
        });

        page.drawText(p.weeks, {
          x: 46,
          y: rY + 2,
          size: 10,
          font: fontMono,
          color: p.weeks === 'WEEKS 1-2' ? darkBg : textWhite,
        });

        page.drawText(p.text, {
          x: 148,
          y: rY + 2,
          size: 10.5,
          font: fontRegular,
          color: textSlate300,
        });

        rY -= 30;
      }
    } else if (s.type === 'team') {
      page.drawText(s.category, {
        x: 40,
        y: height - 60,
        size: 11,
        font: fontMono,
        color: emeraldAccent,
      });

      page.drawText(s.title, {
        x: 40,
        y: height - 90,
        size: 22,
        font: fontBold,
        color: textWhite,
      });

      const memberW = (width - 120) / 3;
      let mX = 40;

      for (const m of s.team) {
        page.drawRectangle({
          x: mX,
          y: 160,
          width: memberW,
          height: 240,
          color: cardBg,
          borderColor: borderCol,
          borderWidth: 1,
        });

        page.drawText(m.name, {
          x: mX + 20,
          y: 350,
          size: 16,
          font: fontBold,
          color: textWhite,
        });

        page.drawText('Core Responsibilities:', {
          x: mX + 20,
          y: 310,
          size: 11,
          font: fontMono,
          color: emeraldAccent,
        });

        const roleLines = m.role.split(' / ');
        let rY = 280;
        for (const rl of roleLines) {
          page.drawText('> ' + rl, {
            x: mX + 20,
            y: rY,
            size: 11,
            font: fontRegular,
            color: textSlate300,
          });
          rY -= 25;
        }

        mX += memberW + 20;
      }

      page.drawRectangle({
        x: 40,
        y: 60,
        width: width - 80,
        height: 60,
        color: cardBg,
        borderColor: emeraldAccent,
        borderWidth: 1,
      });

      page.drawText('Shared Responsibilities: ' + s.note, {
        x: 60,
        y: 88,
        size: 12,
        font: fontRegular,
        color: emeraldAccent,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();

  // Save to target locations
  const outDir = path.resolve(__dirname, '../backend/uploads/presentations');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'CarbonRoute_Planning_Presentation_V1.pdf');
  fs.writeFileSync(outPath, pdfBytes);
  console.log(`Successfully generated authentic PDF presentation at: ${outPath} (${pdfBytes.length} bytes)`);

  // Also copy to frontend public directory for direct client-side asset access
  const frontendPublicDir = path.resolve(__dirname, '../frontend/public');
  fs.mkdirSync(frontendPublicDir, { recursive: true });
  fs.writeFileSync(path.join(frontendPublicDir, 'CarbonRoute_Planning_Presentation_V1.pdf'), pdfBytes);
}

createPlanningPresentationPdf().catch(console.error);
