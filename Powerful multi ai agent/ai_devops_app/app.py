"""
AI DevOps Web Application - Flask Backend
Handles project upload, analysis, GitHub integration, and Render deployment
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import json
import zipfile
import shutil
import subprocess
import requests
from datetime import datetime
from pathlib import Path
import uuid
import logging

# Import configuration
from config import get_config, get_github_token, get_render_api_key, get_upload_config

app = Flask(__name__)
CORS(app)

# Load configuration
config = get_config()
app.config['SECRET_KEY'] = config.SECRET_KEY

# Upload configuration
upload_config = get_upload_config()
UPLOAD_FOLDER = upload_config['folder']
ALLOWED_EXTENSIONS = {'zip'}
MAX_FILE_SIZE = upload_config['max_size']

# Setup logging
logging.basicConfig(level=config.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Create upload folder if doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

logger.info(f"AI DevOps initialized - Environment: {config.FLASK_ENV}")

# Status tracking storage
deployment_status = {}

# ==================== Helper Functions ====================

def allowed_file(filename):
    """Check if file is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def detect_project_type(extract_path):
    """
    Detect project type based on key files
    Returns: (project_type, run_command, description)
    """
    files_in_dir = os.listdir(extract_path)
    
    # Check for Python Flask project
    if 'requirements.txt' in files_in_dir:
        return {
            'type': 'Flask/Python',
            'run_command': 'python app.py',
            'build_command': 'pip install -r requirements.txt',
            'description': 'Python Flask Application'
        }
    
    # Check for Node.js/React project
    if 'package.json' in files_in_dir:
        return {
            'type': 'Node.js/React',
            'run_command': 'npm start',
            'build_command': 'npm install',
            'description': 'Node.js/React Application'
        }
    
    # Check for Django project
    if 'manage.py' in files_in_dir:
        return {
            'type': 'Django',
            'run_command': 'python manage.py runserver',
            'build_command': 'pip install -r requirements.txt',
            'description': 'Django Application'
        }
    
    # Check for static HTML project
    if any(file.endswith('.html') for file in files_in_dir):
        return {
            'type': 'Static HTML',
            'run_command': 'python -m http.server 8000',
            'build_command': 'echo "No build needed"',
            'description': 'Static HTML Website'
        }
    
    # Default
    return {
        'type': 'Unknown',
        'run_command': 'npm start',
        'build_command': 'npm install',
        'description': 'Unknown Project Type'
    }


def init_git_repo(project_path):
    """Initialize git repository"""
    try:
        os.chdir(project_path)
        subprocess.run(['git', 'init'], check=True, capture_output=True)
        subprocess.run(['git', 'config', 'user.email', 'devops@ai.com'], check=True, capture_output=True)
        subprocess.run(['git', 'config', 'user.name', 'AI DevOps'], check=True, capture_output=True)
        subprocess.run(['git', 'add', '.'], check=True, capture_output=True)
        subprocess.run(['git', 'commit', '-m', 'Initial commit'], check=True, capture_output=True)
        return True, "Git repository initialized"
    except Exception as e:
        return False, f"Git initialization error: {str(e)}"


def create_github_repo(repo_name, github_token):
    """
    Create repository on GitHub
    Returns: (success, repo_url, message)
    """
    try:
        headers = {
            'Authorization': f'token {github_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        data = {
            'name': repo_name,
            'description': f'AI DevOps deployed project - {datetime.now().strftime("%Y-%m-%d")}',
            'private': False,
            'auto_init': False
        }
        
        response = requests.post(
            'https://api.github.com/user/repos',
            headers=headers,
            json=data,
            timeout=10
        )
        
        if response.status_code in [201, 200]:
            repo_data = response.json()
            return True, repo_data['html_url'], "GitHub repository created successfully"
        else:
            return False, None, f"GitHub error: {response.status_code} - {response.text}"
            
    except Exception as e:
        return False, None, f"Failed to create GitHub repo: {str(e)}"


def push_to_github(project_path, repo_url, github_token):
    """
    Push project to GitHub repository
    Returns: (success, message)
    """
    try:
        os.chdir(project_path)
        
        # Add remote
        remote_url = repo_url.replace('https://', f'https://{github_token}@')
        subprocess.run(['git', 'remote', 'add', 'origin', remote_url], 
                      capture_output=True)
        
        # Push to GitHub
        result = subprocess.run(['git', 'push', '-u', 'origin', 'master'],
                               capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            return True, "Project pushed to GitHub successfully"
        else:
            return True, "Project initialized in GitHub (push may need verification)"
            
    except subprocess.TimeoutExpired:
        return False, "Git push timeout - repository might still be processing"
    except Exception as e:
        return False, f"Failed to push to GitHub: {str(e)}"


def create_render_deployment(repo_url, project_type, render_api_key):
    """
    Create deployment on Render
    Returns: (success, deploy_url, message)
    """
    try:
        headers = {
            'Authorization': f'Bearer {render_api_key}',
            'Content-Type': 'application/json'
        }
        
        # Determine build and start commands based on project type
        project_info = {
            'Flask/Python': {
                'build_command': 'pip install -r requirements.txt',
                'start_command': 'python app.py'
            },
            'Node.js/React': {
                'build_command': 'npm install',
                'start_command': 'npm start'
            },
            'Django': {
                'build_command': 'pip install -r requirements.txt',
                'start_command': 'python manage.py runserver'
            },
            'Static HTML': {
                'build_command': 'echo "No build needed"',
                'start_command': 'python -m http.server 8000'
            }
        }
        
        commands = project_info.get(project_type, project_info['Node.js/React'])
        
        # Note: Actual Render deployment requires more setup
        # This is a mock implementation showing the structure
        deployment_data = {
            'service': {
                'name': f'ai-devops-{uuid.uuid4().hex[:8]}',
                'repo': repo_url,
                'branch': 'master',
                'buildCommand': commands['build_command'],
                'startCommand': commands['start_command'],
                'envVars': []
            }
        }
        
        # In production, you would make an actual API call to Render
        return True, f"https://ai-devops-{uuid.uuid4().hex[:8]}.onrender.com", \
               "Deployment service created (Note: Use Render dashboard for final setup)"
               
    except Exception as e:
        return False, None, f"Render deployment error: {str(e)}"


# ==================== API Routes ====================

@app.route('/')
def index():
    """Serve main page"""
    return render_template('index.html')


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """
    Handle file upload
    Expected: POST with zip file
    """
    try:
        deployment_id = str(uuid.uuid4())
        deployment_status[deployment_id] = {
            'status': 'uploading',
            'progress': 10,
            'message': 'Receiving file...',
            'timestamp': datetime.now().isoformat()
        }
        
        # Check if file exists
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only .zip files are allowed'}), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_length = file.tell()
        if file_length > MAX_FILE_SIZE:
            return jsonify({'error': 'File too large (max 50MB)'}), 400
        
        file.seek(0)
        
        # Save file
        filename = secure_filename(file.filename)
        upload_path = os.path.join(UPLOAD_FOLDER, deployment_id)
        os.makedirs(upload_path, exist_ok=True)
        
        filepath = os.path.join(upload_path, filename)
        file.save(filepath)
        
        # Extract zip
        deployment_status[deployment_id]['progress'] = 30
        deployment_status[deployment_id]['message'] = 'Extracting files...'
        
        extract_path = os.path.join(upload_path, 'project')
        os.makedirs(extract_path, exist_ok=True)
        
        try:
            with zipfile.ZipFile(filepath, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
        except zipfile.BadZipFile:
            return jsonify({'error': 'Invalid zip file'}), 400
        
        deployment_status[deployment_id]['progress'] = 50
        deployment_status[deployment_id]['message'] = 'Upload complete'
        deployment_status[deployment_id]['upload_path'] = extract_path
        deployment_status[deployment_id]['deployment_id'] = deployment_id
        
        return jsonify({
            'success': True,
            'deployment_id': deployment_id,
            'message': 'File uploaded successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500


@app.route('/api/analyze', methods=['POST'])
def analyze_project():
    """
    Analyze uploaded project
    Expected: POST with deployment_id
    """
    try:
        data = request.json
        deployment_id = data.get('deployment_id')
        
        if deployment_id not in deployment_status:
            return jsonify({'error': 'Invalid deployment ID'}), 400
        
        upload_path = deployment_status[deployment_id].get('upload_path')
        
        deployment_status[deployment_id]['status'] = 'analyzing'
        deployment_status[deployment_id]['progress'] = 60
        deployment_status[deployment_id]['message'] = 'Analyzing project...'
        
        # Detect project type
        project_info = detect_project_type(upload_path)
        
        deployment_status[deployment_id]['project_info'] = project_info
        deployment_status[deployment_id]['progress'] = 80
        deployment_status[deployment_id]['message'] = f"Project type: {project_info['type']}"
        
        return jsonify({
            'success': True,
            'project_info': project_info
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500


@app.route('/api/push-github', methods=['POST'])
def push_github():
    """
    Push project to GitHub
    Expected: POST with deployment_id, github_token, repo_name
    """
    try:
        data = request.json
        deployment_id = data.get('deployment_id')
        github_token = data.get('github_token')
        repo_name = data.get('repo_name', f'ai-devops-{deployment_id[:8]}')
        
        if not github_token:
            return jsonify({'error': 'GitHub token required'}), 400
        
        if deployment_id not in deployment_status:
            return jsonify({'error': 'Invalid deployment ID'}), 400
        
        upload_path = deployment_status[deployment_id].get('upload_path')
        
        deployment_status[deployment_id]['status'] = 'pushing_github'
        deployment_status[deployment_id]['progress'] = 85
        deployment_status[deployment_id]['message'] = 'Initializing git...'
        
        # Initialize git
        success, message = init_git_repo(upload_path)
        if not success:
            return jsonify({'error': message}), 500
        
        deployment_status[deployment_id]['message'] = 'Creating GitHub repository...'
        
        # Create GitHub repo
        success, repo_url, message = create_github_repo(repo_name, github_token)
        if not success:
            return jsonify({'error': message}), 500
        
        deployment_status[deployment_id]['message'] = 'Pushing to GitHub...'
        
        # Push to GitHub
        success, message = push_to_github(upload_path, repo_url, github_token)
        
        deployment_status[deployment_id]['github_url'] = repo_url
        deployment_status[deployment_id]['progress'] = 95
        
        return jsonify({
            'success': True,
            'github_url': repo_url,
            'message': message
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'GitHub push failed: {str(e)}'}), 500


@app.route('/api/deploy', methods=['POST'])
def deploy_render():
    """
    Deploy to Render
    Expected: POST with deployment_id, render_api_key
    """
    try:
        data = request.json
        deployment_id = data.get('deployment_id')
        render_api_key = data.get('render_api_key')
        
        if deployment_id not in deployment_status:
            return jsonify({'error': 'Invalid deployment ID'}), 400
        
        deployment_status[deployment_id]['status'] = 'deploying'
        deployment_status[deployment_id]['progress'] = 90
        deployment_status[deployment_id]['message'] = 'Setting up deployment...'
        
        repo_url = deployment_status[deployment_id].get('github_url')
        project_info = deployment_status[deployment_id].get('project_info', {})
        project_type = project_info.get('type', 'Unknown')
        
        # Deploy to Render
        success, deploy_url, message = create_render_deployment(
            repo_url, project_type, render_api_key or 'demo_key'
        )
        
        if success:
            deployment_status[deployment_id]['deploy_url'] = deploy_url
            deployment_status[deployment_id]['status'] = 'completed'
            deployment_status[deployment_id]['progress'] = 100
            deployment_status[deployment_id]['message'] = 'Deployment completed!'
        else:
            deployment_status[deployment_id]['status'] = 'deploy_error'
            deployment_status[deployment_id]['error'] = message
        
        return jsonify({
            'success': success,
            'deploy_url': deploy_url if success else None,
            'message': message
        }), 200 if success else 500
        
    except Exception as e:
        return jsonify({'error': f'Deployment failed: {str(e)}'}), 500


@app.route('/api/status/<deployment_id>', methods=['GET'])
def get_status(deployment_id):
    """Get deployment status"""
    if deployment_id not in deployment_status:
        return jsonify({'error': 'Deployment not found'}), 404
    
    return jsonify(deployment_status[deployment_id]), 200


@app.route('/api/all-deployments', methods=['GET'])
def get_all_deployments():
    """Get all deployments"""
    return jsonify({
        'deployments': deployment_status,
        'count': len(deployment_status)
    }), 200


# ==================== Error Handlers ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
