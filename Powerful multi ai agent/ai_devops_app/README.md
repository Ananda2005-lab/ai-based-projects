# AI DevOps - Automated Deployment Platform

A full-stack web application that automates the process of uploading projects, pushing them to GitHub, and deploying to Render. Built with Flask (backend) and vanilla HTML/CSS/JavaScript (frontend).

## 🚀 Features

### Core Functionality
- **Project Upload**: Upload ZIP files of any project type
- **Auto-Detection**: Automatically detects project type (Flask, Node.js, Django, Static HTML)
- **GitHub Integration**: Creates repositories and pushes code to GitHub
- **Render Deployment**: Deploys projects to Render with proper build commands
- **Progress Tracking**: Real-time step-by-step deployment progress
- **Error Handling**: Comprehensive error messages and logging

### User Interface
- **Modern Dashboard**: Overview of deployments and statistics
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Multiple Themes**: 
  - 🌙 Dark (Default)
  - ☀️ Light
  - ⚡ Neon
  - 💜 Purple
  - 💬 WhatsApp
- **Real-time Logs**: View deployment logs as they happen
- **Toast Notifications**: User-friendly feedback messages
- **Deployment History**: Track all past deployments

### UX Enhancements
- Drag & drop file upload
- Loading animations
- Smooth page transitions
- Copy-to-clipboard buttons
- Keyboard shortcuts (Ctrl+U for upload, Ctrl+D for dashboard)

## 📋 Project Structure

```
ai_devops_app/
├── app.py                      # Flask backend
├── requirements.txt            # Python dependencies
├── static/
│   ├── css/
│   │   └── style.css          # All styles & themes
│   └── js/
│       └── script.js          # Frontend logic
├── templates/
│   └── index.html             # Single-page application
├── uploads/                   # Temporary upload storage
└── README.md                  # This file
```

## 🛠️ Tech Stack

### Backend
- **Framework**: Flask
- **API**: RESTful API with JSON
- **Libraries**:
  - `Flask-CORS`: Enable cross-origin requests
  - `requests`: HTTP library for GitHub/Render APIs
  - `zipfile`: Extract uploaded files
  - `subprocess`: Execute git commands
  - `uuid`: Generate unique deployment IDs

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Variables, Grid, Flexbox, Animations
- **Vanilla JavaScript**: No frameworks (lightweight)
- **Fetch API**: Communicate with backend

## 📦 Installation & Setup

### Prerequisites
- Python 3.8+
- Git (for pushing to GitHub)
- GitHub account with personal access token
- (Optional) Render account

### Step 1: Clone or Navigate to Project

```bash
cd ai_devops_app
```

### Step 2: Create Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

**macOS/Linux:**
```bash
python -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Configure Git (if not already configured)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 5: Run the Application

```bash
python app.py
```

You should see:
```
WARNING: This is a development server. Do not use it in production.
Running on http://127.0.0.1:5000
```

### Step 6: Open in Browser

Navigate to: **http://localhost:5000**

## 🔑 Getting API Keys

### GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token"
3. Select scopes: `repo` and `admin:repo_hook`
4. Copy the token
5. In the app, go to Settings and save your token (or enter on each deployment)

### Render API Key (Optional)

1. Go to https://dashboard.render.com
2. Go to Account Settings
3. Find API tokens section
4. Create new token
5. Copy and save in app settings

## 🚀 Quick Start Guide

### For First-Time Users

1. **Go to Upload Page**
   - Click "Upload" in the sidebar
   - Or press `Ctrl+U`

2. **Upload Your Project**
   - Drag and drop a ZIP file
   - Or click "Browse Files"
   - Only ZIP files, max 50MB

3. **Configure Deployment**
   - Enter repository name (auto-generated)
   - Paste your GitHub token
   - (Optional) Add Render API key

4. **Start Deployment**
   - Click "🚀 Start Deployment"
   - Watch the real-time progress
   - View logs as they update

5. **Access Your Deployed Site**
   - GitHub link appears automatically
   - Live deployment link shown
   - Use copy buttons to share links

### Example Project

To test, create a simple Flask app:

```bash
mkdir my-project
cd my-project
pip freeze > requirements.txt
echo "from flask import Flask; app = Flask(__name__); @app.route('/'); def hello(): return 'Hello World'" > app.py
cd ..
zip -r my-project.zip my-project
```

Then upload `my-project.zip` through the app.

## 🎨 Theme System

Themes are defined with CSS variables. To add a new theme:

1. Open `static/css/style.css`
2. Add a new theme block:

```css
body.theme-custom {
    --bg-primary: #your-color;
    --bg-secondary: #your-color;
    --accent: #your-color;
    /* ... other variables ... */
}
```

3. Add option to theme dropdown in `templates/index.html`
4. Theme auto-saves to localStorage

## 🔧 API Routes

### Upload Project
```
POST /api/upload
- Body: multipart form-data with 'file' (zip)
- Returns: { success, deployment_id, message }
```

### Analyze Project
```
POST /api/analyze
- Body: { deployment_id }
- Returns: { success, project_info }
```

### Push to GitHub
```
POST /api/push-github
- Body: { deployment_id, github_token, repo_name }
- Returns: { success, github_url, message }
```

### Deploy to Render
```
POST /api/deploy
- Body: { deployment_id, render_api_key }
- Returns: { success, deploy_url, message }
```

### Get Deployment Status
```
GET /api/status/<deployment_id>
- Returns: Deployment status object
```

### Get All Deployments
```
GET /api/all-deployments
- Returns: { deployments: {...}, count: number }
```

## 📊 Supported Project Types

| Type | Detection | Build Command | Start Command |
|------|-----------|---------------|----------------|
| Flask/Python | `requirements.txt` | `pip install -r requirements.txt` | `python app.py` |
| Node.js/React | `package.json` | `npm install` | `npm start` |
| Django | `manage.py` | `pip install -r requirements.txt` | `python manage.py runserver` |
| Static HTML | `.html` files | `echo "No build needed"` | `python -m http.server 8000` |

## ⚙️ Configuration

### Settings Page Features

- **API Keys**: Save GitHub and Render tokens
- **Auto-theme**: Automatically switch theme at 6 PM
- **Notifications**: Enable/disable deployment notifications
- **Clear History**: Remove all deployment records

### localStorage Usage

- `theme`: Current theme selection
- `github_token`: Saved GitHub token
- `render_key`: Saved Render API key
- `auto_theme`: Auto-theme preference
- `notifications`: Notification preference

## 🐛 Troubleshooting

### CORS Errors
- Ensure Flask-CORS is installed: `pip install Flask-CORS`
- Backend should be running on `http://localhost:5000`

### Git Command Not Found
- Install Git: https://git-scm.com/download
- Ensure it's in your PATH
- Restart terminal after installation

### GitHub Authentication Failed
- Verify token is correct
- Check token hasn't expired
- Ensure token has `repo` scope

### File Upload Fails
- Maximum file size is 50MB
- Only ZIP files allowed
- Check disk space

### Render Deployment Shows Demo Link
- This is expected in demo mode without Render API key
- In production, set up Render API integration
- Or deploy manually via Render dashboard

## 📝 Environment Variables (Optional)

For production, create `.env` file:

```
FLASK_ENV=production
FLASK_DEBUG=false
SECRET_KEY=your-secret-key
MAX_FILE_SIZE=52428800
```

## 🚀 Production Deployment

### For Render
1. Push this repo to GitHub
2. Create new service on Render
3. Connect to repository
4. Set start command: `gunicorn app:app`
5. Set environment: Python 3.9+

### For Heroku
```bash
heroku create your-app-name
git push heroku main
```

### Requirements
- Add to requirements.txt: `gunicorn`
- Create `Procfile`: `web: gunicorn app:app`

## 🔐 Security Considerations

1. **Never commit API keys** to repository
2. **Use environment variables** for sensitive data in production
3. **Validate file uploads** (done automatically)
4. **CORS is enabled** for development - restrict in production
5. **Implement rate limiting** for production
6. **Use HTTPS** in production

## 📚 File Size Limits

- Maximum upload: 50MB
- Git operations can handle large files with Git LFS
- Render has storage limits (check their docs)

## 🎯 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+U` | Go to Upload page |
| `Ctrl+D` | Go to Dashboard page |

## 🤝 Contributing

To extend this project:

1. **Add new project type detection** in `app.py` `detect_project_type()`
2. **Add new theme** in `static/css/style.css`
3. **Add new API routes** in `app.py`
4. **Improve UI components** in `templates/index.html`

## 📄 License

MIT License - feel free to use and modify

## 🙋 Support

For issues:
1. Check troubleshooting section
2. Review logs in the app
3. Check browser console (F12)
4. Verify all dependencies installed

## 🎉 Features Demo

### Upload Flow
```
Select ZIP → Configure → Upload → Analyze → GitHub → Render → View Results
```

### Real-time Feedback
- Progress bar updates as deployment progresses
- Step indicators show current stage
- Logs panel shows detailed output
- Toast notifications for key events

### Result Display
- GitHub repository link with copy button
- Live deployment URL with copy button
- Project information summary
- Timestamps of deployment

## 📱 Mobile Support

- Responsive design works on phones
- Touch-friendly buttons and inputs
- Readable on small screens
- All features available on mobile

## 🌐 Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE 11: ❌ Not supported (uses modern ES6+ features)

## ⭐ What Makes This Special

✨ **Modern & Clean**: Beautiful UI with theme system
🚀 **Fast & Efficient**: Pure vanilla JavaScript (no frameworks)
📱 **Responsive**: Works on all devices
🔐 **Secure**: Validates all inputs
📊 **Comprehensive**: Handles multiple project types
🎨 **Themeable**: 5 built-in themes + easy to customize
📈 **Scalable**: Easy to extend with new features

---

**Made with ❤️ for DevOps Enthusiasts**

Version 1.0.0 | Created May 2026
