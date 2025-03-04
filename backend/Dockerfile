
# Use an official Python runtime as a parent image
FROM python:3.7-slim
WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000


ENV NAME World


CMD ["python", "mlb_stats.py"]


