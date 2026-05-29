# Configuration Examples

## Example 1: Flask Project with requirements.txt

```text
# requirements.txt
Flask==2.3.2
Flask-CORS==4.0.0
python-dotenv==1.0.0
requests==2.31.0
gunicorn==21.2.0
```

```python
# app.py
from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return {
        'status': 'success',
        'message': 'API is running',
        'version': '1.0.0'
    }

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

**Detection:** ✅ `requirements.txt` found
**Build Command:** `pip install -r requirements.txt`
**Start Command:** `python app.py`

---

## Example 2: Node.js/React Project

```json
{
  "name": "my-react-app",
  "version": "1.0.0",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

**Detection:** ✅ `package.json` found
**Build Command:** `npm install`
**Start Command:** `npm start`

---

## Example 3: Django Project

```text
# requirements.txt
Django==4.2.0
djangorestframework==3.14.0
python-dotenv==1.0.0
gunicorn==21.2.0
```

```python
# manage.py is present
# settings.py configured
```

**Detection:** ✅ `manage.py` found
**Build Command:** `pip install -r requirements.txt`
**Start Command:** `python manage.py runserver`

---

## Example 4: Static HTML Website

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>My Website</title>
  </head>
  <body>
    <h1>Welcome!</h1>
  </body>
</html>
```

**Detection:** ✅ `.html` file found
**Build Command:** `echo "No build needed"`
**Start Command:** `python -m http.server 8000`

---

## Environment Variables (.env file example)

```env
# .env (for production use)
FLASK_ENV=production
FLASK_DEBUG=false
SECRET_KEY=your-secret-key-here-change-this
MAX_FILE_SIZE=52428800
GITHUB_API_BASE=https://api.github.com
RENDER_API_BASE=https://api.render.com
LOG_LEVEL=INFO
```

---

## GitHub Action Workflow Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Render

on:
  push:
    branches: [ main, master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          curl -X POST "https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID }}/deploys" \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}"
```

---

## Docker Support (Optional)

```dockerfile
# Dockerfile (if you want to containerize)
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./uploads:/app/uploads
```

---

## Nginx Configuration (For Production)

```nginx
upstream flask_app {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://flask_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static {
        alias /app/static;
    }
}
```

---

## Systemd Service File (Linux)

```ini
# /etc/systemd/system/ai-devops.service
[Unit]
Description=AI DevOps Application
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/ai-devops-app
ExecStart=/var/www/ai-devops-app/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable with: `sudo systemctl enable ai-devops`
Start with: `sudo systemctl start ai-devops`

---

## Render Configuration (render.yaml)

```yaml
services:
  - type: web
    name: ai-devops
    env: python
    plan: free
    pythonVersion: 3.9
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app
    routes:
      - path: /
        matchType: prefix
    envVars:
      - key: FLASK_ENV
        value: production
```

---

## Development Settings (.env.development)

```env
# For local development
FLASK_ENV=development
FLASK_DEBUG=true
FLASK_APP=app.py
UPLOAD_FOLDER=./uploads
MAX_FILE_SIZE=104857600  # 100MB for testing
```

---

## Production Settings (.env.production)

```env
# For production
FLASK_ENV=production
FLASK_DEBUG=false
SECRET_KEY=your-very-secure-secret-key-min-32-chars
MAX_FILE_SIZE=52428800  # 50MB limit
LOG_LEVEL=WARNING
SESSION_TIMEOUT=3600
RATE_LIMIT=100  # requests per hour
```

---

## GitHub Actions for CI/CD

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run tests
      run: python -m pytest
    
    - name: Deploy
      if: github.ref == 'refs/heads/main'
      run: |
        # Your deployment command
```

---

## Monitoring Configuration (Optional)

```python
# monitoring.py
import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    handler = RotatingFileHandler('app.log', maxBytes=10000000, backupCount=10)
    handler.setLevel(logging.INFO)
    
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    
    logger = logging.getLogger('ai_devops')
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    
    return logger
```

---

## SSL Certificate Configuration (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://flask_app;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

These examples show how to configure the AI DevOps application for different scenarios and deployment environments.
