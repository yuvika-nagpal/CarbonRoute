# CarbonRoute Scheduling Methodology & Mathematical Formulation

## 1. Problem Formulation

Consider a batch workload $W$ defined by the tuple:
$$W = (t_{\text{arr}}, D, t_{\text{dead}}, \tau, R)$$

Where:
- $t_{\text{arr}}$: Workload arrival timestamp
- $D$: Execution duration (continuous hours)
- $t_{\text{dead}}$: Hard deadline by which execution must be fully completed ($t_{\text{start}} + D \le t_{\text{dead}}$)
- $\tau$: Maximum allowable service-level deadline-violation probability (e.g. $\tau = 0.05$)
- $R$: Target grid region

---

## 2. Forecast Error & Uncertainty Model

Let $\hat{C}(t)$ be the point-forecast electricity carbon intensity ($g\text{CO}_2\text{eq}/\text{kWh}$) at future time $t$, and let $C(t)$ be the realized ground-truth intensity.

The forecast error for horizon $h = t - t_{\text{arr}}$ is modeled with variance $\sigma_h^2$:
$$e(t, h) = C(t) - \hat{C}(t), \quad e(t, h) \sim \mathcal{D}(\mu_h, \sigma_h^2)$$

Where $\sigma_h^2$ grows monotonically with the forecast horizon $h$.

---

## 3. Deadline-Risk Constraint

The probability that executing within prospective window $[t_{\text{start}}, t_{\text{start}} + D]$ causes a deadline breach due to forecast underestimation or execution delay is evaluated as:
$$P(\text{deadline violation} \mid t_{\text{start}}) \le \tau$$

---

## 4. Multi-Objective Optimization Formulation

$$\min_{t_{\text{start}}} \quad \sum_{t=t_{\text{start}}}^{t_{\text{start}} + D} \hat{C}(t) \cdot P_{\text{compute}} + \lambda_{\text{wait}} \cdot (t_{\text{start}} - t_{\text{arr}})$$

**Subject to**:
1. $t_{\text{start}} \ge t_{\text{arr}}$ (Hard constraint: causality)
2. $t_{\text{start}} + D \le t_{\text{dead}}$ (Hard constraint: deadline bound)
3. $P(\text{violation} \mid t_{\text{start}}) \le \tau$ (Risk constraint: calibrated reliability)

---

## 5. Statistical Calibration & Verification Metrics

1. **Brier Score**:
   $$BS = \frac{1}{N} \sum_{i=1}^{N} (p_i - y_i)^2$$
   where $p_i = \hat{P}(\text{violation}_i)$ and $y_i \in \{0, 1\}$ is the empirical binary outcome.

2. **Expected Calibration Error (ECE)**:
   $$ECE = \sum_{m=1}^{M} \frac{|B_m|}{N} \left| \text{acc}(B_m) - \text{conf}(B_m) \right|$$
