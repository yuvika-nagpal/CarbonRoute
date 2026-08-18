"""
CarbonRoute Discrete-Time Uncertainty Simulator
Module: simulator.engine
"""

from typing import List, Dict
import numpy as np

class CarbonRouteSimulator:
    def __init__(self, random_seed: int = 42):
        np.random.seed(random_seed)

    def generate_synthetic_workloads(self, n_jobs: int = 100) -> List[Dict]:
        """Generates synthetic batch workloads categorized by class (short, medium, long)."""
        workloads = []
        classes = [
            {'name': 'short', 'duration_range': (0.25, 0.75), 'slack_multiplier': 3.0},
            {'name': 'medium', 'duration_range': (1.0, 3.0), 'slack_multiplier': 4.0},
            {'name': 'long', 'duration_range': (4.0, 10.0), 'slack_multiplier': 2.5},
        ]

        for i in range(n_jobs):
            w_class = np.random.choice(classes)
            duration = round(np.random.uniform(*w_class['duration_range']), 2)
            arrival = round(np.random.uniform(0, 24), 2)
            deadline = arrival + round(duration * w_class['slack_multiplier'] + np.random.uniform(1, 4), 2)
            risk_tolerance = np.random.choice([0.02, 0.05, 0.10, 0.15])

            workloads.append({
                'id': f'job-{i+1:04d}',
                'class': w_class['name'],
                'arrival_time': arrival,
                'duration': duration,
                'deadline': deadline,
                'risk_tolerance': risk_tolerance,
            })

        return workloads
