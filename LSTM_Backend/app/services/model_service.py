# app/services/model_service.py
import tensorflow as tf
import joblib
import numpy as np
import os

class ModelService:
    def __init__(self):
        # Artifact paths relative to root
        model_path = os.path.join('models', 'energy_lstm_model.h5')
        f_scaler_path = os.path.join('models', 'feature_scaler.pkl')
        t_scaler_path = os.path.join('models', 'target_scaler.pkl')
        
        print("Initializing LSTM Engine...")
        
        # FIX: Added compile=False to ignore the 'mse' metric error
        self.model = tf.keras.models.load_model(model_path, compile=False) 
        
        self.feature_scaler = joblib.load(f_scaler_path)
        self.target_scaler = joblib.load(t_scaler_path)
        print("Model and Scalers loaded successfully.")

    def predict(self, feature_matrix):
        """Standardizes input and runs prediction."""
        # Normalize features
        scaled = self.feature_scaler.transform(feature_matrix)
        # Reshape to (1, 24, 24)
        input_tensor = np.expand_dims(scaled, axis=0)
        # Inference
        pred_scaled = self.model.predict(input_tensor, verbose=0)
        # Reverse scaling to get kW
        return round(float(self.target_scaler.inverse_transform(pred_scaled)[0][0]), 3)

# We set it to None initially so it doesn't freeze during imports
model_engine = None

def get_model_engine():
    global model_engine
    if model_engine is None:
        model_engine = ModelService()
    return model_engine