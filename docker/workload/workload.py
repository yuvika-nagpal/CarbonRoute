#!/usr/bin/env python3
"""
CarbonRoute Synthetic Batch Workload Runner
Simulates a containerized computing workload (e.g. data processing, ML batch inference).
"""

import os
import sys
import time
import argparse
from datetime import datetime

def main():
    parser = argparse.ArgumentParser(description="CarbonRoute Batch Workload Simulator")
    parser.add_argument("--job-id", default=os.getenv("JOB_ID", "job-sample"), help="Unique job identifier")
    parser.add_argument("--duration-sec", type=int, default=int(os.getenv("DURATION_SEC", "10")), help="Execution duration in seconds")
    parser.add_argument("--task-name", default=os.getenv("TASK_NAME", "batch-data-pipeline"), help="Workload task description")
    parser.add_argument("--region", default=os.getenv("REGION", "US-CAL-CISO"), help="Execution grid region")
    args = parser.parse_args()

    start_time = datetime.utcnow()
    print("=================================================================")
    print(f" CARBONROUTE BATCH WORKLOAD EXECUTION CONTAINER")
    print("=================================================================")
    print(f" Timestamp (UTC)  : {start_time.isoformat()}Z")
    print(f" Job Identifier   : {args.job_id}")
    print(f" Task Description : {args.task_name}")
    print(f" Designated Region: {args.region}")
    print(f" Target Duration  : {args.duration_sec} seconds")
    print(f" Host System      : {os.uname().sysname if hasattr(os, 'uname') else sys.platform}")
    print(f" Process PID      : {os.getpid()}")
    print("=================================================================")
    print("[INIT] Allocating memory buffer and preparing compute workers...")
    time.sleep(1)

    steps = 10
    step_duration = max(0.5, args.duration_sec / steps)

    for i in range(1, steps + 1):
        time.sleep(step_duration)
        progress = int((i / steps) * 25)
        bar = "=" * progress + "-" * (25 - progress)
        percent = int((i / steps) * 100)
        print(f"[{datetime.utcnow().strftime('%H:%M:%S')}] [{bar}] {percent}% complete | Processing epoch {i}/{steps}")
        sys.stdout.flush()

    end_time = datetime.utcnow()
    elapsed = (end_time - start_time).total_seconds()

    print("=================================================================")
    print(f"[COMPLETE] Workload '{args.job_id}' finished successfully.")
    print(f" Total Runtime    : {elapsed:.2f} seconds")
    print(f" Exit Code        : 0 (SUCCESS)")
    print("=================================================================")
    sys.exit(0)

if __name__ == "__main__":
    main()
