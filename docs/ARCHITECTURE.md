# CarbonRoute System Architecture Specification

## 1. Executive Summary
**CarbonRoute** is a software-based carbon-aware scheduler for batch computing workloads. Rather than treating forecast point predictions as infallible ground truth, CarbonRoute models scheduling decisions under uncertainty, ensuring deterministic deadline feasibility while minimizing predicted grid carbon intensity.

---

## 2. Multi-Layer System Architecture

```
+-------------------------------------------------------------------------+
|                              DATA LAYER                                 |
|  - Carbon Data Provider (Electricity Maps API v3 / Benchmark Traces)    |
|  - Forecast Carbon Time-Series (gCO2eq/kWh)                             |
|  - Explicit Calibration State (Live: not_calibrated / Demo: benchmark)  |
|  - Synthetic Batch Workload Specifications (Duration, Deadline, Tau)    |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                      MODELLING & CALIBRATION LAYER                      |
|  - Carbon Forecast Uncertainty Estimator (Decoupled grid error model)   |
|  - Workload Runtime Uncertainty Estimator (Decoupled compute duration)  |
|  - Deadline Slack & Feasibility Evaluator (t_start + duration <= ddl)   |
|  - Reliability Calibration Roadmap: Brier Score & ECE Scoring           |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                     SCHEDULING & OPTIMIZATION LAYER                     |
|  - Hard Constraints: t_start >= t_arr, t_start + duration <= t_dead     |
|  - Risk Constraint: P(violation | decision) <= tau                     |
|  - Objective: min mean_intensity(t_start, duration) in gCO2eq/kWh       |
|  - 5 Evaluated Policies: Immediate, EDF, Deterministic, Baseline, CR    |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        API & INTEGRATION LAYER                          |
|  - RESTful Scheduling API (`POST /api/prototype/schedule`)              |
|  - Declarative Kubernetes Manifest Synthesizer (`batch/v1 Job`)         |
|  - Research Status & Capability Metadata Reporter                       |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                       WORKLOAD EXECUTION LAYER                          |
|  - Prototype Status: Execution Disabled (Declarative Preview Only)      |
|  - Output: Declarative Kubernetes Job Manifests with Carbon Annotations |
|  - Planned Milestone: Live Cluster Dispatch & Physical Energy Telemetry |
+-------------------------------------------------------------------------+
```

---

## 3. Decoupling & Execution Boundary Principles

1. **Role of Electricity Maps**:
   - Electricity Maps is the sole provider of live point carbon intensity forecasts ($\text{gCO}_2\text{eq/kWh}$).
   - Electricity Maps does not supply variance or standard deviation directly. Uncertainty is estimated empirically from historical forecast-vs-realized errors.

2. **Decoupled Uncertainty Domains**:
   - **Carbon Forecast Uncertainty ($\sigma_{\text{carbon}}$):** Affects the grid carbon intensity objective.
   - **Workload Runtime Uncertainty ($\sigma_{\text{runtime}}$):** Affects completion deadline compliance.
   - Carbon forecast uncertainty is strictly decoupled from compute runtime: carbon variance does not affect code execution speed.

3. **Role of Kubernetes**:
   - Kubernetes is the downstream **workload execution and resource management engine** (`batch/v1 Job`).
   - In the current prototype, direct execution is disabled. CarbonRoute synthesizes declarative manifests ready for GitOps cluster deployment (`kubectl apply -f manifest.yaml`).
   - Kubernetes does *not* provide carbon intensity data.
   - Kubernetes does *not* solve the carbon-risk scheduling problem.

4. **Role of CarbonRoute Solver**:
   - Operates as an independent microservice.
   - Ingests regional grid signals and workload requirements.
   - Evaluates continuous execution windows using the user's declared duration.
   - Outputs a verified optimal dispatch timestamp $t_{\text{start}}$ alongside mathematical justification and declarative manifests.
