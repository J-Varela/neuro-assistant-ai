FROM python:3.12-slim

WORKDIR /app

# Install uv for fast dependency installation
RUN pip install uv --quiet

COPY requirements.txt .
RUN uv pip install --system -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
