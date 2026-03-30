import os
import sys
from dotenv import load_dotenv

load_dotenv()

AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "")
AZURE_OPENAI_DEPLOYMENT_MODEL = os.getenv("AZURE_OPENAI_DEPLOYMENT_MODEL", "gpt-4.1-mini")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2025-01-01-preview")
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")]

_missing = [name for name, val in [
    ("AZURE_OPENAI_API_KEY", AZURE_OPENAI_API_KEY),
    ("AZURE_OPENAI_ENDPOINT", AZURE_OPENAI_ENDPOINT),
] if not val]

if _missing:
    sys.exit(f"[config] Missing required environment variables: {', '.join(_missing)}")