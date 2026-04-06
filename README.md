# Neuro Assistant AI

An AI-powered assistant designed to reduce cognitive overload for neurodivergent users. It breaks down complex tasks, simplifies dense text, and generates structured focus sessions — all adapted to the user's support mode (ADHD, dyslexia, autism, or general).

## Features

- **Task Breakdown** — Decomposes any task into 3–7 concrete, actionable steps with an estimated effort and a clear "next step"
- **Text Simplification** — Rewrites complex or dense text into plain, easy-to-scan language
- **Focus Session Generator** — Creates a timed, single-step focus prompt to reduce overwhelm
- **Support Modes** — Responses are tailored to four modes: `general`, `adhd`, `dyslexia`, and `autism`

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | FastAPI, Python |
| AI | Azure OpenAI (GPT-4.1-mini) |
| HTTP client | Axios |

## Project Structure

```
neuro-assistant-ai/
├── backend/
│   ├── app/
│   │   ├── core/          # Config & environment variables
│   │   ├── routes/        # API route handlers (breakdown, simplify, focus)
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── services/      # AI service + prompt builder
│   │   └── main.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/           # Axios client
    │   ├── components/    # React components
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- An Azure OpenAI resource with a deployed model

### Backend setup

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_MODEL=gpt-4.1-mini
AZURE_OPENAI_API_VERSION=2025-01-01-preview
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/neuro_assistant
SECRET_KEY=generate-a-random-secret
ALLOWED_ORIGINS=http://localhost:5173
```

Start the API server:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`. Interactive docs are at `http://localhost:8000/docs`.

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Deploying To Vercel

This repo is now configured so Vercel can host the Vite frontend and the FastAPI backend in the same project:

- Static frontend assets are built from `frontend/`
- FastAPI is exposed through the Vercel Python entrypoint at `api/index.py`
- In production, the frontend automatically calls the same-origin API at `/api`

### Vercel setup

1. Import the repository into Vercel with the repository root as the project root.
2. Add these environment variables in Vercel:

```env
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_MODEL=gpt-4.1-mini
AZURE_OPENAI_API_VERSION=2025-01-01-preview
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/neuro_assistant
SECRET_KEY=generate-a-long-random-secret
ALLOWED_ORIGINS=https://your-project.vercel.app
```

3. Provision a managed PostgreSQL database. A local SQLite file is not suitable for Vercel.
4. Run the database migrations against that hosted database before the first demo:

```bash
cd backend
alembic upgrade head
```

### Deployment notes

- Preview deployments need access to the same required backend environment variables.
- If you use a custom domain or separate frontend origin, add it to `ALLOWED_ORIGINS`.
- The backend still uses Azure OpenAI at runtime, so the live demo depends on that service being reachable and funded.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/breakdown-task` | Break a task into structured steps |
| `POST` | `/api/simplify-text` | Simplify dense text |
| `POST` | `/api/generate-focus-session` | Generate a timed focus session |

### Example request — Task Breakdown

```json
POST /api/breakdown-task
{
  "text": "Write a quarterly report for the finance team",
  "support_mode": "adhd"
}
```

```json
{
  "goal": "Write the quarterly finance report",
  "steps": ["Open last quarter's report as a template", "Fill in the new revenue numbers", "Write a 2-sentence summary", "Send draft to your manager"],
  "next_step": "Open last quarter's report as a template",
  "estimated_effort": "30–60 minutes"
}
```

### Support modes

| Mode | Behaviour |
|---|---|
| `general` | Calm, clear, concise language |
| `adhd` | Very short steps, immediate next action first, minimal friction |
| `dyslexia` | Short sentences, simple words, easy to scan |
| `autism` | Literal, explicit, predictable wording; clear sequence |

