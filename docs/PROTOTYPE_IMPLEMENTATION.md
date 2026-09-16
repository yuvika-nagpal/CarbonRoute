# CarbonRoute: Prototype Implementation Specification

**Team:** TriFlux  
**Course:** UCS503 Final-Year Project  
**System Version:** 1.0.0 (Prototype Scheduling Demonstrator)  
**Verification Date:** September 2026  

---

## Table of Contents
1. [Exact Mathematical Formulation](#1-exact-mathematical-formulation)
2. [Why Uncertainty Matters: Concrete Numerical Example](#2-why-uncertainty-matters-concrete-numerical-example)
3. [The 5 Evaluated Scheduling Policies](#3-the-5-evaluated-scheduling-policies)
4. [Carbon Forecast Ingestion: Live API vs Benchmark Traces](#4-carbon-forecast-ingestion-live-api-vs-benchmark-traces)
5. [Decoupled Uncertainty & Deadline Risk Formulation](#5-decoupled-uncertainty--deadline-risk-formulation)
6. [Declarative Kubernetes Manifest Synthesis (batch/v1 Job)](#6-declarative-kubernetes-manifest-synthesis-batchv1-job)
7. [Execution Disablement in Research Prototype](#7-execution-disablement-in-research-prototype)
8. [Local Execution Instructions](#8-local-execution-instructions)
9. [Automated Test Suite Verification](#9-automated-test-suite-verification)
10. [Academic Limitations & Roadmap to Final Submission](#10-academic-limitations--roadmap-to-final-submission)

---

## 1. Exact Mathematical Formulation

CarbonRoute solves a **constrained discrete optimization problem** for flexible batch workloads.

Given:
- A batch job arriving at arrival time $t_{\text{arr}}$ (normalized to $t=0$)
- User-declared continuous execution duration $\Delta t \in \mathbb{N}^+$ (hours)
- Maximum allowable completion deadline $D \in \mathbb{N}^+$ (hours)
- Upper-bound deadline violation risk tolerance $\tau \in (0, 1)$
- Forecasted carbon intensity profile $\hat{I}(t)$ for lookahead horizon hours $t \in [0, H-1]$ ($\text{gCO}_2\text{eq/kWh}$)

The optimization objective minimizes expected carbon intensity over the contiguous execution block subject to deadline feasibility:

$$\min_{t \in \mathcal{T}_{\text{cand}}} \bar{I}(t, \Delta t) = \frac{1}{\Delta t} \sum_{h=t}^{t+\Delta t - 1} \hat{I}(h)$$

Subject to:
1. **Completion Deadline Constraint:**
   $$t + \Delta t \le D$$
2. **Earliest Arrival Time:**
   $$t \ge t_{\text{arr}}$$
3. **Risk Tolerance Constraint:**
   $$P(\text{violation} \mid t, \Delta t, D) \le \tau$$

Where $\mathcal{T}_{\text{cand}} = \{ t \in \mathbb{N} \mid t_{\text{arr}} \le t \le D - \Delta t \text{ and } P(\text{violation} \mid t) \le \tau \}$.

---

## 2. Why Uncertainty Matters: Concrete Numerical Example

Deterministic carbon schedulers optimize solely against point forecasts $\hat{I}(t)$, ignoring variance growth over time. This leads to operational risk when scheduling near the deadline.

### Concrete Scenario:
- **Workload:** Batch data pipeline requiring $\Delta t = 2$ hours, submitted at $t=0$, with deadline $D = 12$ hours.
- **Risk Tolerance:** $\tau = 0.05$ (maximum 5% acceptable risk of deadline overrun).
- **Carbon Profile:** Solar duck curve with evening peak ($320\text{ gCO}_2/\text{kWh}$ at $t=0$) and deep midday solar trough ($160\text{ gCO}_2/\text{kWh}$ between $t=8$ and $t=10$).

### Comparison:
- **Deterministic Scheduler:** Greedily targets the lowest point forecast window without evaluating slack margin or variance. If delayed too close to the deadline, any small delay breaches the SLA.
- **CarbonRoute Scheduler:** Evaluates continuous execution windows, verifies that $t + \Delta t \le D$, and bounds risk below $\tau$, selecting the optimal window that satisfies the operational constraint.

---

## 3. The 5 Evaluated Scheduling Policies

CarbonRoute evaluates five distinct scheduling policies on every incoming workload:

| Policy ID | Policy Name | Mathematical Selection Rule | Description |
|---|---|---|---|
| `immediate` | Immediate Execution | $t = t_{\text{arr}}$ | Standard FIFO baseline. Dispatches immediately upon arrival without delay. |
| `edf` | Earliest Deadline First (EDF) | $t = t_{\text{arr}}$ | Classic real-time scheduling baseline prioritizing earliest deadline; retains maximum slack buffer. |
| `deterministic_carbon` | Deterministic Carbon-Aware | $t^* = \arg\min_{t \le D - \Delta t} \bar{I}(t, \Delta t)$ | Greedily chooses the candidate window with lowest point forecast carbon intensity within deadline horizon. |
| `carbon_aware_baseline` | CarbonAware Baseline | $t^* = \min \{ t \le D - \Delta t - \text{buffer} \mid \bar{I}(t, \Delta t) \le I_{\text{threshold}} \}$ | Heuristic threshold policy reserving a static safety buffer prior to deadline. |
| `carbonroute_uncertainty` | **CarbonRoute Optimization** | $t^* = \arg\min_{t \in \mathcal{T}_{\text{cand}}} \bar{I}(t, \Delta t)$ subject to $P(\text{violation} \mid t) \le \tau$ | Finds the lowest carbon window that provably respects the user's deadline constraint. |

---

## 4. Carbon Forecast Ingestion: Live API vs Benchmark Traces

CarbonRoute provides a clean provider interface (`ICarbonDataProvider` in `carbonService.ts`):

```typescript
export interface ICarbonDataProvider {
  readonly name: string;
  readonly dataMode: 'live' | 'demo';
  getForecast(region: string, horizonHours: number): Promise<CarbonForecastData>;
}
```

### Modes of Operation:
1. **Live Mode (`dataMode: 'live'`):**
   - Active when `ELECTRICITY_MAPS_API_KEY` is present.
   - Queries official Electricity Maps REST API (`https://api.electricitymap.org/v3/carbon-intensity/forecast`).
   - Uses actual point forecasts directly. Live mode sets `uncertaintyAvailable: false`, `uncertaintyStatus: 'not_calibrated'`, and `stdDev: null` (no fabricated standard deviation).
2. **Demo Mode (`dataMode: 'demo'`):**
   - Serves calibrated 24-hour benchmark profiles grounded in historical regional grid characteristics (CAISO solar duck curve, ERCOT wind surges, DE mixed renewables).
   - Labeled explicitly as `uncertaintyStatus: 'benchmark_demo'` for algorithm validation.

---

## 5. Decoupled Uncertainty & Deadline Risk Formulation

Uncertainty is architecturally decoupled into two distinct domains:

1. **Carbon Forecast Uncertainty ($\sigma_{\text{carbon}}$):**
   Error between actual grid carbon intensity and predicted point forecast. Managed by `CarbonUncertaintyEstimator`. Uncalibrated in live mode until historical forecast-error archive data is integrated.
2. **Workload Runtime Uncertainty ($\sigma_{\text{runtime}}$):**
   Variability in compute completion time. Managed by `RuntimeUncertaintyEstimator`. Decoupled completely from grid carbon intensity: carbon variance does not affect CPU execution speed.

### Temporal Slack & Feasibility:
$$S(t) = D - (t + \Delta t)$$
- If $S(t) < 0 \implies P(\text{violation}) = 1.0$ (Infeasible).
- If $S(t) \ge 0 \implies P(\text{violation}) = 0.0$ (Feasible deterministically in current prototype).

---

## 6. Declarative Kubernetes Manifest Synthesis (batch/v1 Job)

`K8sConnector.generateJobManifest(job, scheduledHour)` converts workload parameters and scheduling decisions into standard Kubernetes specifications:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: carbonroute-resnet-50
  namespace: carbonroute-jobs
  labels:
    app: carbonroute-workload
    carbonroute.io/job-id: job-001
    carbonroute.io/scheduled-hour: T+10:00
    carbonroute.io/managed-by: carbonroute-scheduler
spec:
  backoffLimit: 2
  ttlSecondsAfterFinished: 3600
  template:
    metadata:
      labels:
        app: carbonroute-workload
        carbonroute.io/job-id: job-001
    spec:
      restartPolicy: Never
      containers:
        - name: workload-runner
          image: carbonroute/test-workload:latest
          resources:
            requests:
              cpu: "1"
              memory: 512Mi
            limits:
              cpu: "1"
              memory: 512Mi
          env:
            - name: CARBONROUTE_JOB_ID
              value: job-001
            - name: CARBONROUTE_SCHEDULED_HOUR
              value: "10"
            - name: CARBONROUTE_REGION
              value: US-CAL-CISO
```

---

## 7. Execution Disablement in Research Prototype

In the current research prototype:
- **Physical workload execution is disabled:** The prototype serves as a scheduling decision engine.
- **No fake timers:** Artificial 5-second or 8-second execution timers have been purged.
- **No fabricated realized carbon:** Synthetic random perturbations and artificial `realizedCarbon` numbers are not generated.
- **Manifest Preview:** The prototype displays syntax-highlighted declarative Kubernetes YAML, ready for deployment via standard cluster workflows (`kubectl apply -f manifest.yaml`).

---

## 8. Local Execution Instructions

### Run Backend Tests
```bash
node tests/electricity_maps_provider_test.cjs
node tests/prototype_vertical_slice_test.cjs
```

### Run Frontend Build
```bash
cd frontend
npm run build
```

---

## 9. Automated Test Suite Verification

- `tests/electricity_maps_provider_test.cjs`: 8 tests verifying default live provider, API key validation, dynamic region parameterization, parsing without baseCurve fallback, uncalibrated live uncertainty status, and error handling.
- `tests/prototype_vertical_slice_test.cjs`: 11 tests verifying end-to-end scheduling flow, continuous duration window evaluations, deadline sensitivity, candidate window enumeration, and execution disablement.

---

## 10. Academic Limitations & Roadmap to Final Submission

1. **Empirical Carbon Uncertainty:** Connect historical forecast-vintage archive to derive empirical error distributions.
2. **Workload Runtime Model:** Calibrate empirical runtime variance from execution telemetry.
3. **Probabilistic Calibration:** Evaluate Brier score and Expected Calibration Error (ECE).
4. **Physical Cluster Execution:** Dispatch jobs to live Kubernetes clusters and record physical hardware power metrics.
