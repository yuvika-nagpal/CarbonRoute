# 🎓 CarbonRoute Prototype Milestone: Viva & Demonstration Walkthrough

This document outlines the official presentation script for demonstrating the **CarbonRoute Scheduling Decision Prototype** to your course supervisor and evaluation committee.

---

## 🎯 Key Academic Requirements Met

1. **Working Decision Prototype:** Complete end-to-end integration:
   `Workload Submission -> Live Electricity Maps Forecast -> Candidate Window Enumeration -> 5 Schedulers Evaluation -> CarbonRoute Recommendation -> Declarative Kubernetes Manifest Preview`.
2. **Academic & Tone Integrity:**
   - No fake claims, simulated 5s/8s execution timers, or fabricated realized carbon numbers.
   - Accurate framing: *"Electricity Maps provides the point carbon-intensity forecast. Forecast uncertainty is a separate quantity that must be estimated empirically from historical forecast errors."*
   - Transparent Research Status Card displaying current capabilities ($\checkmark$) vs next research milestone ($\bigcirc$).
3. **Declarative Kubernetes Integration:**
   - Synthesizes production-ready `batch/v1` Job specifications with scheduling annotations.
   - Cleanly marked as execution-disabled for the scheduling decision prototype.
4. **Full Architectural & UML Alignment:**
   - 4 Use Case Diagrams (UC-01 to UC-04).
   - 5 Sequence Diagrams (SQ-01 to SQ-05).
   - 1 Detailed UML Class Diagram.

---

## 🧭 Live Demo Script (Step-by-Step)

### Phase 1: The Research Problem & Brand Elevation (Home Page)
1. Navigate to the website homepage (`/`).
2. Show the **"PROTOTYPE MILESTONE ACTIVE"** badge.
3. Highlight the primary navigation actions:
   - **Launch Prototype** (Primary green CTA)
   - **Explore Project**
   - **Planning V1** (Preserved historical presentation archive)
4. Scroll through the **Interactive Pipeline Visualizer**:
   - Explain how flexible batch workloads can be intentionally delayed to align with green energy windows without violating operational deadlines.
5. Point out the **Current Prototype Capabilities vs Next Milestone** breakdown.

---

### Phase 2: Complete Interactive Scheduling Demonstrator (`/prototype`)
1. Click **Prototype** in the navbar.
2. **Current Research Status Card:**
   - Point out the top status card comparing verified current prototype capabilities with planned future research milestones.
3. **Workload Presets & Parameters:**
   - Click one of the preloaded presets (e.g. **"ResNet-50 Batch Training"** or **"Nightly Backup"**).
   - Note the user-declared duration (e.g. 2h) and completion deadline (T+12h).
   - Explain the note under Risk Tolerance: *"Deterministic feasibility enforced in current prototype; empirical runtime risk calibration planned for next research milestone."*
4. **Carbon Intensity Forecast Section:**
   - Show the banner: **"Carbon forecast source: Electricity Maps"**.
   - Note: *"Electricity Maps provides the point carbon-intensity forecast. Forecast uncertainty is a separate quantity that must be estimated empirically from historical forecast errors."*
   - Show the 24-hour forecast chart displaying hourly intensity in $\text{gCO}_2\text{eq/kWh}$.
5. **Evaluate 5 Schedulers:**
   - Click **"Evaluate 5 Schedulers"**.
   - Review the candidate windows table:
     - Shows each continuous 2-hour window ($T+0 \to T+2$, $T+1 \to T+3$, etc.).
     - Shows average predicted intensity, slack margin, feasibility status, and decision rationale.
   - Review the 5-policy comparison matrix:
     1. **Immediate Execution:** Dispatches at $t=0$ ($0\text{h}$ delay, pays maximum carbon penalty).
     2. **Earliest Deadline First (EDF):** Dispatches immediately to retain maximum buffer.
     3. **Deterministic Carbon-Aware:** Greedily picks lowest point forecast window within deadline horizon.
     4. **CarbonAware Baseline:** Heuristic threshold shifting.
     5. **CarbonRoute Optimization:** Minimizes predicted carbon intensity subject to deadline constraints.
   - Show the CarbonRoute recommendation card highlighting expected grid intensity and savings % vs immediate.
6. **Same Forecast, Different Uncertainty Demonstration:**
   - Scroll down to the controlled research benchmark visualizer.
   - Explain how under identical point forecasts, differences in uncertainty profiles adaptively shift recommended dispatch windows to preserve safety margins.

---

### Phase 3: Declarative Kubernetes Manifest Preview
1. Inspect the **Declarative Kubernetes Job Manifest Preview** section.
2. Note the badge: `"Execution: Disabled in Prototype"`.
3. Read the notice: *"CarbonRoute operates as a scheduling decision engine. The prototype outputs declarative Kubernetes manifests configured with optimal execution window annotations, ready for deployment via standard cluster GitOps workflows (kubectl apply -f manifest.yaml). Direct in-prototype workload dispatch and physical hardware power telemetry will be integrated in the next milestone."*
4. Click **"Copy Manifest YAML"** or **"Inspect K8s Manifest"** to inspect the clean `batch/v1` Job specification.

---

### Phase 4: Software Engineering & System Design (`/system-design`)
1. Click **System Design** in the top navbar.
2. **Use Case Models:** Walk through UC-01 to UC-04.
3. **Sequence Models:** Walk through SQ-01 to SQ-05.
4. **Class Diagram:** Highlight the decoupled `CarbonService`, `UncertaintyService`, and `SchedulerService` architecture.

---

### Phase 5: Automated Verification Test Suites
Run both automated verification test suites live in the terminal:

```bash
# 1. Electricity Maps Provider & Error Handling Suite
node tests/electricity_maps_provider_test.cjs

# 2. Complete Prototype Vertical Slice Suite
node tests/prototype_vertical_slice_test.cjs
```

Show the committee the **8/8 PASSED** and **11/11 PASSED** test results proving 100% specification compliance.
