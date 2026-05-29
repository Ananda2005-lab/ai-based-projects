# 🚀 Configuration Quick Reference

## Fastest Setup (30 seconds)

```bash
# 1. Run the interactive setup script
python setup-config.py

# 2. Enter your GitHub token when prompted
# 3. Done! Your .env file is created

# 4. Restart Flask
python app.py
```

---

## Manual Setup (1 minute)

```bash
# 1. Copy the example
cp .env.example .env        # macOS/Linux
copy .env.example .env      # Windows

# 2. Edit .env with your editor
# Add your GitHub token

# 3. Save and restart Flask
python app.py
```

---

## Get Your GitHub Token (2 minutes)

**URL:** https://github.com/settings/tokens

1. Click "Generate new token"
2. Name: `AI DevOps`
3. Scopes: Select `repo` and `admin:repo_hook`
4. Click "Generate token"
5. **Copy immediately** (won't show again!)
6. Paste into `.env` as `GITHUB_TOKEN=ghp_...`

---

## What Goes in .env?

**Essential:**
```env
GITHUB_TOKEN=ghp_your_token_here
```

**Optional (demo works without):**
```env
RENDER_API_KEY=rnd_your_key_here
```

**Optional (sensible defaults):**
```env
FLASK_ENV=development
LOG_LEVEL=INFO
MAX_FILE_SIZE=52428800
```

---

## Files You Need to Know About

| File | Purpose | What To Do |
|------|---------|-----------|
| `.env.example` | Template | Copy this |
| `.env` | Your config | Create from example |
| `config.py` | Python config loader | Don't edit |
| `setup-config.py` | Setup wizard | Run once |

---

## Common Issues & Fixes

### "Token not working"
✅ Solution: Regenerate token from https://github.com/settings/tokens

### ".env file not found"
✅ Solution: Copy `.env.example` to `.env`

### "Module not found"
✅ Solution: `pip install python-dotenv`

### "Token still not loading"
✅ Solution: Restart Flask app after editing `.env`

---

## Access Your Config in Code

```python
from config import get_config, get_github_token

# Get all config
config = get_config()
print(config.FLASK_ENV)

# Get specific values
token = get_github_token()
render_key = get_render_api_key()
```

---

## 🎯 Three Ways to Configure

### Way 1: .env File (Easiest) ⭐
```env
GITHUB_TOKEN=ghp_xxx
RENDER_API_KEY=rnd_xxx
```

### Way 2: System Environment Variables
```bash
export GITHUB_TOKEN=ghp_xxx
export RENDER_API_KEY=rnd_xxx
python app.py
```

### Way 3: Python Script
```python
import os
os.environ['GITHUB_TOKEN'] = 'ghp_xxx'
```

---

## Production Deployment

Set these environment variables in your hosting platform:

- **Render:** Secrets tab
- **Heroku:** Config vars
- **AWS:** Secrets Manager
- **DigitalOcean:** App settings

Never commit `.env` to Git! ✅ (Already protected)

---

## Verify Configuration

Run this to check if config loaded:

```python
from config import get_github_token, get_render_api_key

token = get_github_token()
key = get_render_api_key()

print(f"GitHub: {'✅ Set' if token else '❌ Not set'}")
print(f"Render: {'✅ Set' if key else '❌ Not set'}")
```

---

## Security Reminders

✅ **DO:**
- Keep `.env` private (in .gitignore)
- Use strong tokens
- Change in production
- Regenerate if exposed

❌ **DON'T:**
- Commit .env to Git
- Share tokens
- Hardcode in code
- Use same token everywhere

---

## Support Files

- **CONFIG_SETUP.md** - Full configuration guide
- **.env.example** - Configuration template
- **config.py** - Configuration loader
- **setup-config.py** - Interactive setup
- **README.md** - General help

---

**Ready?** Run: `python setup-config.py` 🚀
