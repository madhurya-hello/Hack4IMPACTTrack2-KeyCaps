# app/routes.py
from flask import Blueprint, request, jsonify
from app.services.feature_service import prepare_features
from app.services.model_service import get_model_engine
from app.utils.database import get_recent_history, add_new_record
import logging

main_bp = Blueprint('main', __name__)

@main_bp.route('/predict', methods=['POST'])
def predict_energy():
    try:
        # Receive the snake_case object from the main backend
        data = request.get_json()
        
        company_name = data.get('company_name')
        if not company_name:
            return jsonify({"error": "Missing company_name"}), 400

        # 1. Fetch the previous 23 steps from your new table
        # We fetch 48 to ensure features like power_lag_24 have enough context
        history_df = get_recent_history(company_name, limit=48)

        # 2. Check if we have enough historical data (injected via Postman)
        # The LSTM needs a window of 24 steps total
        if len(history_df) < 24:
            # We still save the current point so history begins to build
            add_new_record(data)
            return jsonify({
                "status": "pending",
                "message": f"Insufficient history in new table. Found {len(history_df)}/24 steps."
            }), 200

        # 3. Transform the historical data into the 24x24 feature matrix
        # (This uses the exact logic from your Model.py)
        feature_matrix = prepare_features(history_df, data['max_capacity'])

        # 4. Generate the prediction
        engine = get_model_engine()
        prediction_kw = engine.predict(feature_matrix)

        # 5. Save this new input AND the output to your standalone table
        add_new_record(data, prediction=prediction_kw)

        return jsonify({
            "status": "success",
            "company_name": company_name,
            "prediction": prediction_kw,
            "unit": "kW"
        }), 200

    except Exception as e:
        logging.error(f"Prediction Error: {str(e)}")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@main_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "online", "table": "prediction_records"}), 200