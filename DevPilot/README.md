# AI DevOps Launcher

A beginner-friendly full-stack Flask app that uploads a zipped project, analyzes its type, pushes it to GitHub, creates a Render web service, and shows the generated links.

## Folder Structure

```text
ai-devops-launcher/
  app.py
  requirements.txt
  README.md
  templates/
    index.html
  static/
    style.css
    app.js
  uploads/
  extracted_projects/
```

## Environment Variables

Create or edit `.env` in the project root:

```env
GITHUB_TOKEN=your_github_token
RENDER_API_KEY=your_render_api_key
RENDER_OWNER_ID=optional_render_workspace_owner_id
APP_USERNAME=admin
APP_PASSWORD=change_this_password
APP_SECRET_KEY=change_this_random_secret
```

The GitHub token needs permission to create repositories. Render requires an API key. `RENDER_OWNER_ID` can be left blank for auto-detection from your API key. If you fill it manually, use a workspace owner ID, not a service ID.

Default local login is `admin` / `admin123`. Change `APP_USERNAME`, `APP_PASSWORD`, and `APP_SECRET_KEY` in `.env` before sharing the app.

## Run

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000`.

## API Routes

- `POST /upload` accepts a `.zip`, saves it, and extracts it.
- `POST /analyze` detects `requirements.txt` as Flask/Python or `package.json` as Node/React.
- `POST /push-github` creates a GitHub repository and pushes the extracted project.
- `POST /deploy` creates a Render web service from the GitHub repo.
- `GET /status?project_id=<id>` returns progress, logs, links, and errors.
