from flask import Flask
from flask_login import LoginManager
from models import db, User
from routes import main

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'direct-farm-secret-key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///direct_farm.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize Extensions
    db.init_app(app)
    
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'main.login' # Agar login nahi hai to yahan bhejo

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register Blueprint
    app.register_blueprint(main)

    # Create DB tables if not exists
    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)