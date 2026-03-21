# run.py
import os
import sys

print("[1/7] Waking up Python...")

# 1. Force TensorFlow to use CPU only
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

# 2. Prevent NumPy/OpenBLAS from deadlocking on Windows
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

print("[2/7] Importing Flask...")
from flask import Flask
from flask_cors import CORS

print("[3/7] Importing Routes (Loading TensorFlow & Pandas, this takes 10-30 seconds)...")
from app.routes import main_bp

print("[4/7] Importing Database config...")
from app.utils.database import Base, engine

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    with app.app_context():
        print("[5/7] Connecting to PostgreSQL to verify tables...")
        Base.metadata.create_all(bind=engine)
        print("[6/7] Database tables verified successfully!")
        
    app.register_blueprint(main_bp)
    return app

if __name__ == "__main__":
    print("[7/7] Starting Flask Server...")
    app = create_app()
    port = int(os.environ.get("PORT", 5001))
    print(f"--- Smart Grid ML Backend Running on http://localhost:{port} ---")
    app.run(host='0.0.0.0', port=port, debug=False)