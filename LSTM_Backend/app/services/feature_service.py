# app/services/feature_service.py
import pandas as pd
import numpy as np
import json
import os

# Load the feature order once at startup to ensure 100% consistency
FEATURE_COLS_PATH = os.path.join('models', 'feature_columns.json')
with open(FEATURE_COLS_PATH, 'r') as f:
    FEATURE_ORDER = json.load(f)

def prepare_features(df_history, current_max_capacity):
    """
    Transforms history from 'prediction_records' into the LSTM input matrix.
    Uses snake_case columns as defined in your new database.py.
    """
    df = df_history.copy()
    
    # Ensure timestamp is datetime for temporal extraction
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # 1. Map static capacity from the input
    df['max_capacity'] = current_max_capacity
    
    # 2. Extract temporal features
    df['hour'] = df['timestamp'].dt.hour
    df['minute'] = df['timestamp'].dt.minute
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['month'] = df['timestamp'].dt.month
    
    # 3. Cyclical Encoding (0-24 and 0-7 loops)
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
    df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
    
    # 4. Behavioral Time Categories
    df['is_morning'] = ((df['hour'] >= 6) & (df['hour'] < 12)).astype(int)
    df['is_evening'] = ((df['hour'] >= 18) & (df['hour'] < 24)).astype(int)
    df['is_peak_hour'] = ((df['hour'] >= 17) & (df['hour'] <= 21)).astype(int)
    
    # 5. Weather Interactions
    df['heat_index'] = df['temperature'] + (df['humidity'] / 100) * 5
    df['temp_x_is_peak'] = df['temperature'] * df['is_peak_hour']
    
    # 6. Historical Lags (Shifted by 15-min intervals)
    # Using the snake_case column 'power_consumption'
    df['power_lag_1'] = df['power_consumption'].shift(1)
    df['power_lag_4'] = df['power_consumption'].shift(4)
    df['power_lag_24'] = df['power_consumption'].shift(24)
    
    # 7. Rolling Averages
    df['power_rolling_mean_4'] = df['power_consumption'].rolling(window=4).mean()
    df['power_rolling_mean_24'] = df['power_consumption'].rolling(window=24).mean()
    
    # 8. Clean up and Sequence Selection
    # Fill NaNs from shifts and take the last 24 steps for the LSTM window
    df = df.fillna(0)
    df_final = df.tail(24)
    
    # 9. Enforce strict column order from feature_columns.json
    return df_final[FEATURE_ORDER].values