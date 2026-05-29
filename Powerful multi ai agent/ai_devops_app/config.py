"""
Configuration Management for AI DevOps Application
Loads settings from environment variables and .env file
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration"""
    
    # Flask
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Upload
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 52428800))  # 50MB
    
    # GitHub API
    GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', '')
    GITHUB_API_URL = os.getenv('GITHUB_API_URL', 'https://api.github.com')
    
    # Render API
    RENDER_API_KEY = os.getenv('RENDER_API_KEY', '')
    RENDER_API_URL = os.getenv('RENDER_API_URL', 'https://api.render.com')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')


class DevelopmentConfig(Config):
    """Development configuration"""
    FLASK_DEBUG = True
    FLASK_ENV = 'development'


class ProductionConfig(Config):
    """Production configuration"""
    FLASK_DEBUG = False
    FLASK_ENV = 'production'


class TestingConfig(Config):
    """Testing configuration"""
    FLASK_DEBUG = True
    FLASK_ENV = 'testing'
    TESTING = True


# Select config based on environment
config_name = os.getenv('FLASK_ENV', 'development')
if config_name == 'production':
    config = ProductionConfig()
elif config_name == 'testing':
    config = TestingConfig()
else:
    config = DevelopmentConfig()


def get_config():
    """Get current configuration"""
    return config


def get_github_token():
    """Get GitHub token (from env or empty)"""
    return config.GITHUB_TOKEN


def get_render_api_key():
    """Get Render API key (from env or empty)"""
    return config.RENDER_API_KEY


def get_upload_config():
    """Get upload configuration"""
    return {
        'folder': config.UPLOAD_FOLDER,
        'max_size': config.MAX_FILE_SIZE
    }
