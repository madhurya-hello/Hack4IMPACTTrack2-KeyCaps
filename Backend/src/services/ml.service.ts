// src/services/ml.service.ts
import axios from "axios";

class MLService {
  private readonly mlApiUrl =
    process.env.ML_MODEL_URL || "http://localhost:5000/predict";

  async getPeakPrediction(features: any): Promise<number> {
    try {
      // 1. Call the Flask /predict endpoint
      const response = await axios.post(this.mlApiUrl, features);
      const result = response.data;

      // 2. Handle the "Success" case
      if (result.status === "success") {
        return result.prediction; // Value in kW
      }

      // 3. Handle the "Pending" case (History building)
      // Return a fallback during the first 24 steps (e.g., current power + 5%)
      console.log(`ML History Building: ${result.message}`);
      return features.power_consumption * 1.05;
    } catch (error: any) {
      console.error("ML Backend Connection Error:", error.message);
      // Fallback if Flask server is down
      return features.power_consumption * 1.1;
    }
  }
}

export default new MLService();
