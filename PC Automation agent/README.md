# Local AI Assistant

Personal AI assistant v1 with a React web dashboard, Python FastAPI local agent, desktop automation tools, approval gates for risky actions, and Ollama integration.

## Project Structure

```text
backend/
  app/
    agent/        Safety policy and desktop tools
    services/     Ollama planner and task execution state
    main.py       FastAPI app and public routes
  tests/          Backend tests
frontend/
  src/
    components/   Reserved for extracted UI components
    lib/          API client and shared types
    main.tsx      React dashboard
```

## Run Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Run Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Ollama

Install Ollama separately, then pull a local model:

```powershell
ollama pull llama3.1
ollama serve
```

If Ollama is offline, the backend uses a small fallback planner for basic demo commands like opening Notepad, Chrome, screenshots, and delete approval checks.

## Safety Model

Low-risk actions can run automatically. Risky actions pause and require approval in the UI.

Approval is required for deleting files, sending messages, submitting sensitive forms, purchases/payments, install/uninstall actions, shell/system commands, and system setting changes.

## Current Limitations

- Voice transcription route is a stub until a local speech provider is configured.
- Desktop automation depends on `pyautogui`, a visible desktop session, and OS permissions.
- The stop button is currently UI-only; cancellation API can be added next.
