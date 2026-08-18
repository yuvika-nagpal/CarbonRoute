# CarbonRoute System Architecture Specification

## 1. Executive Summary
**CarbonRoute** is a software-based, uncertainty-aware carbon-aware scheduler for batch computing workloads. Unlike naive carbon-aware systems that treat forecast point predictions as ground truth, CarbonRoute models forecast error variance and evaluates the calibrated probability of deadline violation before scheduling batch execution.

---

## 2. Multi-Layer System Architecture

```
+-------------------------------------------------------------------------+
|                              DATA LAYER                                 |
|  - Carbon Data Provider (Electricity Maps / National Grid API)          |
|  - Forecast Carbon Time-Series (gCO2eq/kWh)                             |
|  - Historical Realised Ground Truth & Missing-Data Filters              |
|  - Synthetic Batch Workload Traces (Arrival, Duration, Deadline, SLRs)  |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                      MODELLING & CALIBRATION LAYER                      |
|  - Forecast Error Variance Model: e(t, h) ~ N(mu_h, sigma_h^2)          |
|  - Deadline Risk Estimator: P(deadline violation | decision d)          |
|  - Reliability Calibration Engine (Isotonic Regression / Platt Scaling) |
|  - Verification Scoring: Brier Score & Expected Calibration Error (ECE) |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                     SCHEDULING & OPTIMIZATION LAYER                     |
|  - Hard Constraint Enforcer: t_start >= t_arr, t_start + D <= t_dead   |
|  - Risk Constraint: P(violation | decision) <= tau                     |
|  - Soft Objective: min sum_{t} C_pred(t) * Power + lambda * WaitDelay   |
|  - Baseline Solvers: Immediate, EDF, Cost-Aware, Standard-Carbon, Oracle|
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        API & INTEGRATION LAYER                          |
|  - RESTful Scheduling API (`POST /api/v1/schedule`)                     |
|  - Structured Decision Explanation Service (JSON + Human Rationale)     |
|  - Health, Telemetry, and JWT Access Control                            |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                       WORKLOAD EXECUTION LAYER                          |
|  - Workload Connector Driver                                            |
|  - Kubernetes Batch Manifest Controller (`batch/v1 Job`)                |
|  - Modular Extensibility: Argo Workflows / GitHub Actions Runners       |
|  - Container Lifecycle & Emissions Audit Tracker                        |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                     EVALUATION & DASHBOARD LAYER                        |
|  - Discrete-Time Experiment Simulator                                   |
|  - Multi-Seed Statistical Benchmark Suite (95% Confidence Intervals)    |
|  - Interactive Web Analytics & Reliability Diagrams                     |
+-------------------------------------------------------------------------+
```

---

## 3. Decoupling & Execution Boundary Principles

1. **Role of Kubernetes**:
   - Kubernetes is exclusively the **workload execution and resource management engine** (`batch/v1 Job`).
   - Kubernetes does *not* provide carbon intensity data.
   - Kubernetes does *not* solve the carbon-risk scheduling problem.

2. **Role of CarbonRoute Solver**:
   - Operates as an independent microservice.
   - Ingests regional grid signals and workload requirements.
   - Outputs a verified optimal dispatch timestamp $t_{\text{start}}$ alongside mathematical justification.

3. **Storage & Immutability**:
   - Uploaded presentation files and research deliverables are stored in an S3-compatible object storage layer with SHA-256 integrity checksums.
   - Every uploaded version is immutable and remains permanently accessible.
