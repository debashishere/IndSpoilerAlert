# Use an official, lightweight Python image
FROM python:3.11-slim

WORKDIR /app

# 1. FORCE PYTORCH CPU VERSION FIRST
# This prevents pip from downloading 2GB+ of useless NVIDIA CUDA libraries for your Mac M4
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 2. Copy and install the rest of your requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copy the rest of your application code
COPY . .

# Expose the port
EXPOSE 8000

# Run your FastAPI app (adjust main.py if your file is named differently)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]