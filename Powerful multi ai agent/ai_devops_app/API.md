# API Documentation - AI DevOps

Complete API reference for the AI DevOps application.

## Base URL

```
http://localhost:5000
```

## Authentication

Currently, no authentication required. In production, implement:
- JWT tokens
- API keys
- OAuth2

## Response Format

All responses are JSON with the following structure:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "error": "Error message describing what went wrong",
  "status": 400
}
```

---

## Endpoints

### 1. Upload Project

Upload a ZIP file containing your project.

**Endpoint:** `POST /api/upload`

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (multipart):**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | ✅ Yes | ZIP file to upload (max 50MB) |

**Request Example (cURL):**
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@my-project.zip"
```

**Request Example (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:5000/api/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Success Response (200):**
```json
{
  "success": true,
  "deployment_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "File uploaded successfully"
}
```

**Error Responses:**

| Status | Error | Reason |
|--------|-------|--------|
| 400 | `"No file provided"` | Missing file parameter |
| 400 | `"No file selected"` | Empty file |
| 400 | `"Only .zip files are allowed"` | Wrong file type |
| 400 | `"File too large (max 50MB)"` | File exceeds size limit |
| 500 | `"Upload failed: ..."` | Server error |

**Notes:**
- ZIP file must be valid
- Max size: 50MB
- Only .zip extension allowed
- Deployment ID required for subsequent calls

---

### 2. Analyze Project

Detect project type and get build/start commands.

**Endpoint:** `POST /api/analyze`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "deployment_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Request Example:**
```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"deployment_id": "550e8400-e29b-41d4-a716-446655440000"}'
```

**Success Response (200):**
```json
{
  "success": true,
  "project_info": {
    "type": "Flask/Python",
    "run_command": "python app.py",
    "build_command": "pip install -r requirements.txt",
    "description": "Python Flask Application"
  }
}
```

**Project Types:**

| Type | Files | Build Command | Start Command |
|------|-------|----------------|----------------|
| Flask/Python | `requirements.txt` | `pip install -r requirements.txt` | `python app.py` |
| Node.js/React | `package.json` | `npm install` | `npm start` |
| Django | `manage.py` | `pip install -r requirements.txt` | `python manage.py runserver` |
| Static HTML | `.html` files | `echo "No build needed"` | `python -m http.server 8000` |
| Unknown | None | `npm install` | `npm start` |

**Error Responses:**

| Status | Error | Reason |
|--------|-------|--------|
| 400 | `"Invalid deployment ID"` | ID not found |
| 500 | `"Analysis failed: ..."` | Server error |

---

### 3. Push to GitHub

Create GitHub repository and push code.

**Endpoint:** `POST /api/push-github`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "deployment_id": "550e8400-e29b-41d4-a716-446655440000",
  "github_token": "ghp_xxxxxxxxxxxxxxxx",
  "repo_name": "my-awesome-project"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deployment_id` | string | ✅ Yes | From upload response |
| `github_token` | string | ✅ Yes | GitHub personal access token |
| `repo_name` | string | ❌ No | Repository name (auto-generated if omitted) |

**Request Example:**
```bash
curl -X POST http://localhost:5000/api/push-github \
  -H "Content-Type: application/json" \
  -d '{
    "deployment_id": "550e8400-e29b-41d4-a716-446655440000",
    "github_token": "ghp_xxxxxxxxxxxx",
    "repo_name": "my-project"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "github_url": "https://github.com/username/my-project",
  "message": "Project pushed to GitHub successfully"
}
```

**Error Responses:**

| Status | Error | Reason |
|--------|-------|--------|
| 400 | `"GitHub token required"` | Missing token |
| 400 | `"Invalid deployment ID"` | ID not found |
| 500 | `"GitHub error: ..."` | API error |
| 500 | `"Failed to create GitHub repo: ..."` | Repo creation failed |
| 500 | `"Failed to push to GitHub: ..."` | Git push failed |

**GitHub Token Requirements:**
- Minimum scopes: `repo`, `admin:repo_hook`
- Token must not be expired
- Account must have access to create repos

**Repository Naming:**
- Uses provided name if given
- Falls back to auto-generated: `ai-devops-{id[:8]}`
- Special characters converted to hyphens
- Converted to lowercase

---

### 4. Deploy to Render

Deploy project to Render hosting service.

**Endpoint:** `POST /api/deploy`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "deployment_id": "550e8400-e29b-41d4-a716-446655440000",
  "render_api_key": "rnd_xxxxxxxxxxxxxxxx"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deployment_id` | string | ✅ Yes | From upload response |
| `render_api_key` | string | ❌ No | Render API key (demo if omitted) |

**Request Example:**
```bash
curl -X POST http://localhost:5000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "deployment_id": "550e8400-e29b-41d4-a716-446655440000",
    "render_api_key": "rnd_xxxxxxxxxxxx"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "deploy_url": "https://ai-devops-abc12345.onrender.com",
  "message": "Deployment service created (Note: Use Render dashboard for final setup)"
}
```

**Error Responses:**

| Status | Error | Reason |
|--------|-------|--------|
| 400 | `"Invalid deployment ID"` | ID not found |
| 500 | `"Render deployment error: ..."` | API error |
| 500 | `"Deployment failed: ..."` | Setup failed |

**Notes:**
- Works in demo mode without API key
- URL generated automatically
- Final setup requires Render dashboard
- Build commands set per project type

---

### 5. Get Deployment Status

Get real-time status of a deployment.

**Endpoint:** `GET /api/status/<deployment_id>`

**Parameters:**

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `deployment_id` | string | URL Path | UUID from upload |

**Request Example:**
```bash
curl http://localhost:5000/api/status/550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200):**
```json
{
  "status": "completed",
  "progress": 100,
  "message": "Deployment completed!",
  "timestamp": "2024-05-04T10:30:00.000000",
  "upload_path": "/app/uploads/550e8400.../project",
  "deployment_id": "550e8400-e29b-41d4-a716-446655440000",
  "project_info": {
    "type": "Flask/Python",
    "run_command": "python app.py",
    "build_command": "pip install -r requirements.txt",
    "description": "Python Flask Application"
  },
  "github_url": "https://github.com/username/my-project",
  "deploy_url": "https://ai-devops-abc12345.onrender.com"
}
```

**Status Values:**
- `uploading` - File being uploaded
- `analyzing` - Project type detection
- `pushing_github` - Pushing to GitHub
- `deploying` - Setting up Render
- `completed` - All steps done
- `deploy_error` - Deployment failed

**Error Responses:**

| Status | Error | Reason |
|--------|-------|--------|
| 404 | `"Deployment not found"` | Invalid ID |

**Polling Interval:**
- Recommended: 2-5 seconds
- Don't poll faster than 1 second

---

### 6. Get All Deployments

Get list of all deployments.

**Endpoint:** `GET /api/all-deployments`

**Request Example:**
```bash
curl http://localhost:5000/api/all-deployments
```

**Success Response (200):**
```json
{
  "deployments": {
    "550e8400-e29b-41d4-a716-446655440000": {
      "status": "completed",
      "progress": 100,
      "message": "Deployment completed!",
      "timestamp": "2024-05-04T10:30:00.000000",
      "github_url": "https://github.com/username/project1",
      "deploy_url": "https://ai-devops-abc12345.onrender.com"
    },
    "660e8400-e29b-41d4-a716-446655440001": {
      "status": "uploading",
      "progress": 30,
      "message": "Extracting files...",
      "timestamp": "2024-05-04T11:45:00.000000"
    }
  },
  "count": 2
}
```

**Response Format:**
- Dictionary of deployments (key = deployment_id)
- Each has status, progress, message, etc.
- Count = total deployments

---

## Error Handling

### Global Error Responses

**404 Not Found:**
```json
{
  "error": "Not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting (Future)

When implemented, use these headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1620000000
```

## CORS Headers

Current configuration allows all origins:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

For production, restrict to specific origins:

```python
CORS(app, origins=["https://yourdomain.com"])
```

## Webhooks (Future Enhancement)

POST callbacks for deployment status:

```json
{
  "event": "deployment.completed",
  "deployment_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "timestamp": "2024-05-04T10:30:00.000000"
}
```

## Batch Operations (Future)

Deploy multiple projects:

```bash
POST /api/batch-deploy
Body: {
  "deployments": [
    { "file": file1, "token": "...", "name": "project1" },
    { "file": file2, "token": "...", "name": "project2" }
  ]
}
```

## Code Examples

### Python Requests

```python
import requests
import json

BASE_URL = "http://localhost:5000"

# Upload
files = {'file': open('project.zip', 'rb')}
response = requests.post(f"{BASE_URL}/api/upload", files=files)
deployment_id = response.json()['deployment_id']

# Analyze
response = requests.post(
    f"{BASE_URL}/api/analyze",
    json={"deployment_id": deployment_id}
)
project_info = response.json()['project_info']

# Push to GitHub
response = requests.post(
    f"{BASE_URL}/api/push-github",
    json={
        "deployment_id": deployment_id,
        "github_token": "ghp_xxxx",
        "repo_name": "my-project"
    }
)
github_url = response.json()['github_url']

# Deploy
response = requests.post(
    f"{BASE_URL}/api/deploy",
    json={
        "deployment_id": deployment_id,
        "render_api_key": "rnd_xxxx"
    }
)
deploy_url = response.json()['deploy_url']
```

### JavaScript

```javascript
const BASE_URL = "http://localhost:5000";

async function deployProject(file, token) {
  // Upload
  const uploadForm = new FormData();
  uploadForm.append('file', file);
  const upload = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: uploadForm
  });
  const { deployment_id } = await upload.json();

  // Analyze
  const analyze = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deployment_id })
  });
  const { project_info } = await analyze.json();

  // Push to GitHub
  const github = await fetch(`${BASE_URL}/api/push-github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deployment_id,
      github_token: token,
      repo_name: 'my-project'
    })
  });
  const { github_url } = await github.json();

  // Deploy
  const deploy = await fetch(`${BASE_URL}/api/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deployment_id })
  });
  const { deploy_url } = await deploy.json();

  return { github_url, deploy_url, project_info };
}
```

---

## Changelog

### v1.0.0 (Initial Release)
- ✅ File upload with validation
- ✅ Project type detection
- ✅ GitHub integration
- ✅ Render deployment
- ✅ Status tracking

### v1.1.0 (Planned)
- 🔄 User authentication
- 🔄 Webhook support
- 🔄 Batch deployments
- 🔄 Database persistence
- 🔄 Rate limiting

---

**Last Updated:** May 4, 2026
