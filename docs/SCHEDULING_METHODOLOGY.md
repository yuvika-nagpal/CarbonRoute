# CarbonRoute Scheduling Methodology & Mathematical Formulation

## 1. Problem Formulation

Consider a batch workload $W$ defined by the tuple:
$$W = (t_{\text{arr}}, D, t_{\text{dead}}, \tau, R)$$

Where:
- $t_{\text{arr}}$: Workload arrival timestamp (normalized to $t=0$).
- $D$: Continuous workload execution duration in hours ($D \in \mathbb{N}^+$). Candidate windows evaluate continuous contiguous intervals of length $D$.
- $t_{\text{dead}}$: Hard deadline by which workload execution must be complete ($t_{\text{start}} + D \le t_{\text{dead}}$).
- $\tau$: Maximum allowable service-level deadline violation risk tolerance ($\tau \in [0.01, 0.50]$).
- $R$: Target electrical grid region (e.g. `US-CAL-CISO`, `US-TEX-ERCO`, `DE`, `IN-NO`).

---

## 2. Grid Carbon Forecast Formulation

Let $\hat{C}(t)$ be the point-forecast grid carbon intensity ($\text{gCO}_2\text{eq/kWh}$) at lookahead time $t \in [0, H-1]$, and let $C(t)$ be the realized ground-truth grid intensity.

1. **Forecast Ingestion:**
   Electricity Maps is the source for live operational point forecasts:
   $$\hat{C}(t) = \text{ElectricityMapsForecast}(R, t)$$
   Electricity Maps provides the point forecast. It does not provide standard deviation ($\sigma$) or distribution parameters natively.

2. **Decoupled Uncertainty Structure:**
   - **Carbon Forecast Uncertainty ($\sigma_{\text{carbon}}$):** Quantifies error between actual grid outcome and point prediction:
     $$e(t, h) = C(t) - \hat{C}(t), \quad e(t, h) \sim \mathcal{D}(\mu_h, \sigma_h^2)$$
     In live mode, historical forecast-vintage archive data is required to compute empirical $\sigma_h$; hence live forecasts report `uncertaintyStatus: 'not_calibrated'` and `stdDev: null` until the archive pipeline is connected.
   - **Workload Runtime Uncertainty ($\sigma_{\text{runtime}}$):** Represents variability in compute completion time $T_{\text{runtime}}$ due to I/O wait, memory bandwidth, or hardware throttling. This is **strictly decoupled** from carbon forecast uncertainty:
     $$T_{\text{finish}} = t_{\text{start}} + T_{\text{runtime}}$$
     Carbon forecast variance never artificially increases computational runtime.

---

## 3. Deadline Feasibility & Risk Modeling

For candidate start hour $t \ge t_{\text{arr}}$, expected completion is $t + D$. The temporal slack buffer before deadline $t_{\text{dead}}$ is:
$$S(t) = t_{\text{dead}} - (t + D)$$

- **Deterministic Feasibility (Current Prototype):**
  A candidate window is feasible if and only if $S(t) \ge 0$:
  $$P(\text{violation} \mid t) = \begin{cases} 0.0 & \text{if } S(t) \ge 0 \\ 1.0 & \text{if } S(t) < 0 \end{cases}$$

- **Calibrated Probabilistic Extension (Planned Milestone):**
  When empirical runtime standard deviation $\sigma_{\text{runtime}}$ is calibrated from workload execution traces:
  $$z = \frac{S(t)}{\sigma_{\text{runtime}}}$$
  $$P(\text{violation} \mid t) = \Phi(-z) = \frac{1}{2} \operatorname{erfc}\left(\frac{z}{\sqrt{2}}\right)$$
  Where $\operatorname{erfc}$ is computed via Chebyshev rational polynomial approximation accurate to $1.2 \times 10^{-7}$.

---

## 4. Scheduling Optimization Formulation

The scheduling engine solves a constrained discrete optimization problem across all candidate start hours:

$$\min_{t_{\text{start}} \in \mathcal{T}_{\text{cand}}} \bar{C}(t_{\text{start}}, D) = \frac{1}{D} \sum_{t=t_{\text{start}}}^{t_{\text{start}} + D - 1} \hat{C}(t)$$

**Subject to:**
1. **Causality Constraint:**
   $$t_{\text{start}} \ge t_{\text{arr}}$$
2. **Deterministic Deadline Constraint:**
   $$t_{\text{start}} + D \le t_{\text{dead}}$$
3. **Risk Tolerance Constraint:**
   $$P(\text{violation} \mid t_{\text{start}}) \le \tau$$

Where the feasible candidate set is:
$$\mathcal{T}_{\text{cand}} = \{ t \in \mathbb{N} \mid t_{\text{arr}} \le t \le t_{\text{dead}} - D \text{ and } P(\text{violation} \mid t) \le \tau \}$$

If $\mathcal{T}_{\text{cand}}$ is non-empty, the optimal start hour $t^*$ minimizes mean grid carbon intensity over the contiguous window. If tight deadlines leave no window satisfying $\tau$, the scheduler falls back to the earliest arrival $t_{\text{arr}}$ to maximize remaining slack.

---

## 5. Statistical Calibration & Reliability Validation (Next Milestone)

Future empirical validation will benchmark probabilistic forecast calibration using standard meteorological and machine learning metrics:

1. **Brier Score (Binary Event Calibration):**
   $$BS = \frac{1}{N} \sum_{i=1}^{N} (p_i - y_i)^2$$
   where $p_i = \hat{P}(\text{violation}_i)$ and $y_i \in \{0, 1\}$ is the observed binary outcome.

2. **Expected Calibration Error (ECE):**
   $$ECE = \sum_{m=1}^{M} \frac{|B_m|}{N} \left| \text{acc}(B_m) - \text{conf}(B_m) \right|$$
   Partitioning predictions into $M$ confidence bins $B_m$ to quantify probability miscalibration.

3. **Reliability Diagrams:**
   Plotting empirical observed violation frequencies against predicted violation probabilities to assess underconfidence and overconfidence across horizons.
