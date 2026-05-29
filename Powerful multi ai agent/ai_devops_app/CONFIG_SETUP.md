# ⚙️ Easy Configuration Guide

## How to Configure GitHub Token & API Keys

### Option 1: Create .env File (Recommended - Easiest)

This is the **easiest way** to set your tokens!

#### Step 1: Copy the Example File

```bash
# Windows (PowerShell)
Copy-Item .env.example -Destination .env

# macOS/Linux
cp .env.example .env
```

#### Step 2: Edit the .env File

Open `.env` in your text editor and fill in your values:

```env
# GitHub Configuration
GITHUB_TOKEN=ghp_your_github_token_here
GITHUB_API_URL=https://api.github.com

# Render Configuration (optional)
RENDER_API_KEY=rnd_your_render_api_key_here
RENDER_API_URL=https://api.render.com

# Other settings
FLASK_ENV=development
MAX_FILE_SIZE=52428800
```

#### Step 3: Get Your GitHub Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token"
3. Name it: "AI DevOps"
4. Select scopes:
   - ✅ `repo` (Full control of repositories)
   - ✅ `admin:repo_hook` (Hooks access)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. Paste into `.env` file as `GITHUB_TOKEN`

#### Step 4: Save and Restart

- Save the `.env` file
- Restart the Flask app
- Done! ✅

---

### Option 2: Use Environment Variables

Set variables directly in your system (without .env file):

#### Windows (PowerShell)

```powershell
$env:GITHUB_TOKEN = "ghp_your_token_here"
$env:RENDER_API_KEY = "rnd_your_key_here"
$env:FLASK_ENV = "development"

python app.py
```

#### macOS/Linux (Bash)

```bash
export GITHUB_TOKEN="ghp_your_token_here"
export RENDER_API_KEY="rnd_your_key_here"
export FLASK_ENV="development"

python app.py
```

---

### Option 3: Programmatically (For Scripts)

In your Python code:

```python
import os
from config import get_config

# These will be loaded from .env or environment
config = get_config()

print(f"GitHub Token: {config.GITHUB_TOKEN}")
print(f"Render API Key: {config.RENDER_API_KEY}")
print(f"Environment: {config.FLASK_ENV}")
```

---

## Configuration File (.env)

### What Each Variable Does

```env
# Flask Settings
FLASK_ENV=development          # Set to 'production' for live
FLASK_DEBUG=false              # Set to 'true' for debugging

# GitHub - REQUIRED for deployment
GITHUB_TOKEN=ghp_xxxx          # Your GitHub personal access token
GITHUB_API_URL=https://...     # GitHub API endpoint (usually don't change)

# Render - OPTIONAL
RENDER_API_KEY=rnd_xxxx        # Render API key (optional, demo mode works)
RENDER_API_URL=https://...     # Render API endpoint (usually don't change)

# Upload Settings
UPLOAD_FOLDER=uploads          # Where to store uploaded files
MAX_FILE_SIZE=52428800         # Max upload size in bytes (50MB)

# Security
SECRET_KEY=your-secret-key     # For production, change this!

# Logging
LOG_LEVEL=INFO                 # DEBUG, INFO, WARNING, ERROR
```

---

## ✅ Step-by-Step Setup (Quick)

### 1. Copy Configuration Template
```bash
cp .env.example .env
```

### 2. Get GitHub Token
- https://github.com/settings/tokens → Generate new token
- Copy the token

### 3. Edit .env File
```env
GITHUB_TOKEN=ghp_paste_your_token_here
FLASK_ENV=development
```

### 4. Save & Restart
```bash
python app.py
```

### 5. Done! 🎉
- Your tokens are now configured
- App automatically loads them

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep `.env` file **private** (it's in .gitignore)
- Use strong, unique tokens
- Regenerate tokens if compromised
- Use different tokens for dev and production
- Store in `.env`, never commit to Git

### ❌ DON'T:
- Commit `.env` to Git
- Share your `.env` file
- Put tokens in code
- Use same token everywhere
- Leave sensitive files unprotected

---

## Troubleshooting

### "Token not found"
**Solution:**
1. Check if `.env` file exists in project root
2. Check if `GITHUB_TOKEN` is in `.env`
3. Verify token format (should start with `ghp_`)
4. Restart Flask app after editing `.env`

### "Invalid token"
**Solution:**
1. Regenerate token from https://github.com/settings/tokens
2. Check token hasn't expired
3. Verify token has correct scopes
4. Copy entire token (no spaces)

### "Module 'dotenv' not found"
**Solution:**
```bash
pip install python-dotenv
# or
pip install -r requirements.txt
```

### "Environment variable not loading"
**Solution:**
1. Check `.env` file is in project root folder
2. Restart Flask app (must restart after editing .env)
3. Check for typos in variable names
4. Ensure no spaces around `=` sign

---

## Access Your Configuration in Code

### In Flask Routes

```python
from config import get_github_token, get_render_api_key

@app.route('/api/test-config')
def test_config():
    github_token = get_github_token()
    render_key = get_render_api_key()
    
    return jsonify({
        'github_token_set': bool(github_token),
        'render_key_set': bool(render_key)
    })
```

### In Frontend

Tokens are **not** sent to frontend. Frontend stores them in localStorage:

```javascript
// Save token in settings
localStorage.setItem('github_token', userEnteredToken);

// Use in deployment
const token = localStorage.getItem('github_token');
```

---

## Production Deployment

### For Render, AWS, or Cloud:

1. **Set environment variables** in deployment settings:
   ```
   GITHUB_TOKEN: your_github_token
   RENDER_API_KEY: your_render_key
   FLASK_ENV: production
   ```

2. **Don't commit `.env` file**
   - Already in `.gitignore` ✅

3. **Use secrets management**
   - Render Secrets
   - AWS Secrets Manager
   - Environment variables

4. **Don't hardcode tokens**
   - Always use environment variables

---

## Configuration Hierarchy

The app loads configuration in this order (first found wins):

1. **Environment variables** (highest priority)
   ```bash
   export GITHUB_TOKEN=xxx
   ```

2. **`.env` file**
   ```env
   GITHUB_TOKEN=xxx
   ```

3. **Default values** (lowest priority)
   - Empty strings for tokens
   - Default folders and sizes

---

## Quick Reference

| Need | How To | Where |
|------|-------|-------|
| Set GitHub token | Create `.env` file | Project root |
| Get token | https://github.com/settings/tokens | GitHub |
| Change upload limit | Edit `MAX_FILE_SIZE` in `.env` | `.env` file |
| Change log level | Set `LOG_LEVEL` in `.env` | `.env` file |
| View config | Use `get_config()` function | Python code |
| Production setup | Set env vars in cloud platform | Cloud dashboard |

---

## Example .env Files

### Development Setup
```env
FLASK_ENV=development
FLASK_DEBUG=true
GITHUB_TOKEN=ghp_your_test_token
RENDER_API_KEY=
LOG_LEVEL=DEBUG
```

### Production Setup
```env
FLASK_ENV=production
FLASK_DEBUG=false
GITHUB_TOKEN=ghp_your_production_token
RENDER_API_KEY=rnd_your_production_key
SECRET_KEY=your-very-secure-random-key
LOG_LEVEL=WARNING
```

---

## One-Command Setup (Automated)

Create a setup script:

### Windows (setup-config.bat)
```batch
@echo off
echo Copying configuration template...
copy .env.example .env
echo Done! Edit .env file and add your tokens
pause
```

### macOS/Linux (setup-config.sh)
```bash
#!/bin/bash
cp .env.example .env
echo "Configuration file created!"
echo "Edit .env and add your tokens"
```

---

## ✨ That's It!

You now have **3 easy ways** to configure your tokens:

1. **`.env` file** (Easiest - Recommended) 📄
2. **Environment variables** (For scripts/CI/CD) 🔧
3. **Programmatically** (For advanced users) 💻

Pick the method that works best for you!

---

**Next:** 
- Copy `.env.example` to `.env`
- Add your GitHub token
- Run the app!

**All tokens are automatic - no code changes needed!** ✅
