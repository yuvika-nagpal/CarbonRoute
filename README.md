# 🌿 CarbonRoute: Prototype Milestone

> **Uncertainty-Aware Batch Workload Scheduling Under Carbon Forecast Errors**  
> *Final-Year Capstone / Software Engineering Project (UCS503)*  
> **Course Supervisor:** Sukhpal Singh  
> **Research Team (TriFlux):** Yuvika Nagpal (1024030141), Kumkum Gupta (1024030144), Aaneya Sabharwal (1024030147)  
> **Current Milestone:** `PROTOTYPE SCHEDULING RESEARCH DEMONSTRATOR`

---

## 🔬 Scientific Honesty & Research Scope

CarbonRoute is an academic research prototype focused on **carbon-aware batch workload scheduling decision-making**. The prototype strictly distinguishes between current capabilities and planned future research milestones:

```
┌─────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────┐
│              CURRENT PROTOTYPE CAPABILITIES             │                 NEXT RESEARCH MILESTONE                 │
├─────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ ✓ Live carbon point forecasts from Electricity Maps API │ ○ Empirical carbon forecast uncertainty calibration     │
│ ✓ Candidate-window scheduling (user-declared duration)  │ ○ Workload runtime distribution modeling (history)      │
│ ✓ Deadline-aware scheduling (deterministic feasibility) │ ○ Brier score, ECE & reliability diagram calibration    │
│ ✓ CarbonRoute recommendation & 5-policy comparison      │ ○ Historical forecast-vs-realized post-hoc validation   │
│ ✓ Declarative Kubernetes batch/v1 Job manifest preview  │ ○ Real cluster workload execution & physical power meters│
└─────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────┘
```

### Core Methodological Principles:
1. **Carbon Forecast Source:** Electricity Maps is the sole source for live grid carbon intensity forecasts ($\text{gCO}_2\text{eq/kWh}$). Electricity Maps provides point forecasts; it does not natively provide standard deviation ($\sigma$).
2. **Decoupled Uncertainty:**
   - **Carbon Forecast Uncertainty:** Affects the grid carbon intensity expectation. In live mode, because historical forecast-error archives are not yet integrated, uncertainty is marked as `uncertaintyAvailable: false`, `uncertaintyStatus: 'not_calibrated'`, and `stdDev: null`. Controlled benchmark traces (`benchmark_demo`) provide reproducible evaluation curves.
   - **Workload Runtime Uncertainty:** Governs deadline compliance $P(T_{\text{finish}} > \text{Deadline})$. Runtime uncertainty is **never** derived from or added to carbon forecast uncertainty ($(\sigma_{\text{runtime}} + \sigma_{\text{carbon}})$). In the current prototype, deadline feasibility is enforced deterministically: $t_{\text{start}} + \text{duration} \le \text{deadline}$.
3. **Execution Block Evaluation:** User-declared duration ($\text{durationHours}$) is strictly preserved across all candidate window evaluations (e.g. a 3-hour workload evaluates 3-hour contiguous intervals: $T+0 \to T+3$, $T+1 \to T+4$, etc.).
4. **Execution Status:** Physical workload dispatch and energy measurement are disabled in the current prototype. The prototype synthesizes production-ready declarative Kubernetes `batch/v1` Job manifests with optimal scheduling annotations.

---

## 🚀 Working Prototype Pipeline

```
[Flexible Batch Workload Submission] (durationHours, deadlineHours, CPU/RAM, target region)
        │
        ▼
[Regional Carbon Intensity Forecast] (Live Electricity Maps API v3 or Controlled Benchmark Trace)
        │
        ▼
[Candidate Window Enumeration] (Continuous durationHours blocks fitting within deadline horizon)
        │
        ▼
[5 Schedulers Comparative Evaluation] (Immediate, EDF, Deterministic Carbon, Baseline, CarbonRoute)
        │
        ▼
[CarbonRoute Recommendation Engine] (Minimizes predicted intensity subject to deterministic deadline feasibility)
        │
        ▼
[Declarative Kubernetes Manifest Synthesis] (Synthesizes batch/v1 Job YAML with scheduling annotations)
```

---

## 🌐 Public Website & Navigation Structure (11 Pages)

1. **Home (`/`):** Primary brand portal, active milestone banner, 3 CTAs (`Launch Prototype`, `Explore Project`, `Planning V1`), interactive pipeline visualizer, and verified milestone breakdown.
2. **Project Specification (`/project`):** Scientific problem formulation, research gap, 10 formal objectives, boundaries, and mathematical formulations.
3. **How It Works (`/how-it-works`):** Interactive 10-step lifecycle deep dive with governing mathematical equations and produced output artifacts.
4. **Architecture (`/architecture`):** Architectural stack from React Web UI through Carbon Services, Decoupled Uncertainty Modeling, and Schedulers to Kubernetes manifest synthesis.
5. **Interactive Prototype (`/prototype`):** Working demonstrator featuring preset workloads, custom parameter controls, 24h carbon intensity chart with uncertainty status, candidate window explorer, 5-policy comparison matrix, CarbonRoute recommendation card, declarative Kubernetes manifest preview, and feasibility demonstrations.
6. **Experiments & Benchmarks (`/experiments`):** 5-dimensional evaluation protocol (Grid Regions, Workload Classes, Scale, Error Levels, Seeds) and academic integrity notice.
7. **System Design (`/system-design`):** Formal software engineering UML models:
   - **4 Use Cases:** Workload Registration (UC-01), Carbon Ingestion (UC-02), Multi-Policy Decision (UC-03), Kubernetes Manifest Synthesis (UC-04).
   - **5 Sequence Diagrams:** End-to-End Vertical Slice (SQ-01), Uncertainty Calibration (SQ-02), Multi-Policy Benchmarking (SQ-03), Declarative Manifest Generation (SQ-04), Decision Audit (SQ-05).
   - **Detailed Class Diagram (UML):** Complete entity hierarchy, interfaces, value objects, and service contracts.
8. **Development Roadmap (`/roadmap`):** Phased development tracking.
9. **Team TriFlux (`/team`):** Member bios, student roll numbers, and technical divisions.
10. **Resources & Deliverables (`/resources`):** Central document library for all capstone deliverables, whitepapers, presentations, and design specifications.
11. **Planning V1 Archive (`/presentations/planning/v1`):** Archived official 25-slide presentation with in-browser PDF viewer.

---

## ⚡ 5 Scheduling Policies Evaluated

| # | Policy Name | Classification | Strategy & Selection Rule | Deadline Feasibility |
|---|---|---|---|---|
| 1 | **Immediate Execution** | Naive Baseline | Dispatches immediately at arrival ($t=0$). | Always feasible ($0\text{h}$ delay). Highest carbon penalty. |
| 2 | **Earliest Deadline First (EDF)** | Classical Baseline | Prioritizes earliest deadline jobs; dispatches at $t=0$. | Always feasible. Retains maximum slack buffer. |
| 3 | **Deterministic Carbon-Aware** | Heuristic Benchmark | Greedily targets absolute lowest point forecast within deadline horizon. | Enforces $t + \text{duration} \le \text{deadline}$. Ignores uncertainty. |
| 4 | **CarbonAware Baseline** | Shifted Heuristic | Shifts to lowest carbon window within a static safety buffer. | Feasible within preserved margin. |
| 5 | **CarbonRoute Optimization** | Proposed System | Minimizes predicted carbon intensity subject to deadline constraints. | **Guaranteed Feasible**: mathematically constrained by deadline. |

---

## 🔌 Declarative Kubernetes Integration

- **Declarative Job Manifests:** Synthesizes production `batch/v1` Job YAML specifications with resource requests/limits, restart policies, and `carbonroute.io/*` scheduling audit labels.
- **GitOps Ready:** Manifests are inspectable, copyable, and ready for deployment via standard cluster tools:
  ```bash
  kubectl apply -f manifest.yaml
  ```
- **Execution Scope Notice:** Physical container execution and hardware energy measurement will be integrated after empirical uncertainty calibration is complete.

---

## 🧪 Automated Verification Test Suites

CarbonRoute includes comprehensive test suites verifying all scientific honesty and scheduling requirements:

```bash
# Test 1: Live Electricity Maps Provider & Error Handling
node tests/electricity_maps_provider_test.cjs

# Test 2: Complete Prototype Vertical Slice
node tests/prototype_vertical_slice_test.cjs
```

**Verification Results:**
```
🎯 Electricity Maps Live Provider Results: 8 PASSED, 0 FAILED
🎯 Prototype Vertical Slice Test Results: 11 PASSED, 0 FAILED
```

---

## 🛠️ Local Development & Build

### Run Frontend (React + Vite + TypeScript)
```bash
cd frontend
npm install
npm run dev      # Local dev server at http://localhost:5173
npm run build    # Production Vite build (verified 0 errors)
```

### Run Backend (Node.js + Express + TypeScript)
```bash
cd backend
npm install
npm run dev      # Local dev server at http://localhost:5000
npm run build    # Compile TypeScript (verified 0 errors)
npm start        # Production server
```

---

## 👥 Team TriFlux (UCS503)

| Member | Roll Number | Focus Area |
|---|---|---|
| **Yuvika Nagpal** | 1024030141 | Grid Carbon Intensity Ingestion & Workload Profiling |
| **Kumkum Gupta** | 1024030144 | 5-Policy Schedulers, Decoupled Uncertainty & Tail Risk |
| **Aaneya Sabharwal** | 1024030147 | Backend Controllers, Kubernetes Manifest Synthesis & Prototype UI |
