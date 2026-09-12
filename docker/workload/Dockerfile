# CarbonRoute Benchmark Test Workload Container
FROM python:3.11-slim

WORKDIR /app

COPY workload.py .
RUN chmod +x workload.py

ENV PYTHONUNBUFFERED=1
ENV JOB_ID="job-demo"
ENV DURATION_SEC=15
ENV TASK_NAME="carbonroute-batch-task"
ENV REGION="US-CAL-CISO"

ENTRYPOINT ["python", "workload.py"]
