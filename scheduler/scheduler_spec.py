"""
CarbonRoute Optimization Solver Specification
Module: scheduler.core
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
import math

@dataclass
class BatchJob:
    job_id: str
    name: str
    duration_hours: float
    deadline_hours: float
    arrival_hour: float
    risk_tolerance: float  # tau in (0, 1)
    power_kw: float = 1.0

@dataclass
class ScheduleDecision:
    job_id: str
    selected_start_hour: float
    predicted_carbon: float
    estimated_violation_risk: float
    is_feasible: bool
    rationale: str

class CarbonRouteScheduler:
    def __init__(self, forecast_carbon_profile: List[float], uncertainty_std_profile: List[float]):
        self.forecast_carbon = forecast_carbon_profile
        self.uncertainty_std = uncertainty_std_profile

    def compute_schedule(self, job: BatchJob) -> ScheduleDecision:
        """
        Evaluates feasible start time slots satisfying:
        1. t_start >= job.arrival_hour
        2. t_start + job.duration_hours <= job.deadline_hours
        3. P(deadline_violation | t_start) <= job.risk_tolerance
        """
        feasible_slots = []
        horizon = len(self.forecast_carbon)

        for t in range(int(job.arrival_hour), horizon):
            if t + job.duration_hours > job.deadline_hours:
                continue

            # Calculate deadline risk from uncertainty profile
            risk = self._estimate_deadline_risk(t, job.duration_hours, job.deadline_hours)

            if risk <= job.risk_tolerance:
                carbon = self.forecast_carbon[t]
                feasible_slots.append((t, carbon, risk))

        if not feasible_slots:
            # Fallback to earliest arrival slot
            t_fall = int(job.arrival_hour)
            return ScheduleDecision(
                job_id=job.job_id,
                selected_start_hour=t_fall,
                predicted_carbon=self.forecast_carbon[t_fall],
                estimated_violation_risk=self._estimate_deadline_risk(t_fall, job.duration_hours, job.deadline_hours),
                is_feasible=False,
                rationale="No window satisfies strict risk threshold; fallback to earliest feasible arrival."
            )

        # Select minimum carbon window among risk-feasible candidates
        best_slot = min(feasible_slots, key=lambda x: x[1])
        return ScheduleDecision(
            job_id=job.job_id,
            selected_start_hour=best_slot[0],
            predicted_carbon=best_slot[1],
            estimated_violation_risk=best_slot[2],
            is_feasible=True,
            rationale=f"Optimal window found at T+{best_slot[0]} satisfying risk tolerance ({best_slot[2]:.1%} <= {job.risk_tolerance:.1%})."
        )

    def _estimate_deadline_risk(self, start_t: int, duration: float, deadline: float) -> float:
        slack = deadline - (start_t + duration)
        std_dev = self.uncertainty_std[min(start_t, len(self.uncertainty_std) - 1)]
        # Cumulative normal tail approximation
        z = slack / (std_dev + 1e-6)
        risk = 0.5 * math.erfc(z / math.sqrt(2))
        return min(1.0, max(0.0, risk))
