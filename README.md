# ⚡ SmartGrid 2026: AI-Powered Energy Orchestrator

> An intelligent energy management system utilizing LSTM neural networks and real-time environmental telemetry to automate grid load-balancing.

**🔗 [Live Demo Link](https://grid-foresight.vercel.app/)**

## 🚀 Short Intro
**SmartGrid 2026** is a full-stack IoT and Machine Learning solution designed to prevent urban grid overloads. By combining historical consumption patterns with real-time occupancy and future weather forecasts, the system predicts power surges before they happen. When a breach is imminent, the orchestrator automatically "shifts" the load by deactivating non-essential devices (HVAC in empty rooms, decorative lighting, etc.) across the registered infrastructure, ensuring critical systems remain online while staying within safety limits.

## 🛠️ Technologies

**Frontend (Monitoring & Control):**
* **React 19 & Vite:** Providing a high-performance, reactive UI for real-time telemetry.
* **Recharts:** Visualizing complex energy draw vs. predicted peak trends.
* **Tailwind CSS:** For a modern, responsive administrative dashboard.
* **Socket.io-client:** For live updates of device states and grid health.

**Orchestrator Backend (Node.js):**
* **Express & TypeScript:** A type-safe server architecture managing business logic and device state-machines.
* **Prisma ORM & PostgreSQL:** Handling persistent storage for company metadata and high-frequency energy logs.
* **OpenWeather API:** Integrating 30-minute future weather offsets to anticipate thermal-load spikes.
* **Axios:** Managing inter-service communication with the ML Inference Engine.

**ML Inference Engine (Python):**
* **Flask:** Serving a specialized REST API for LSTM model consumption.
* **TensorFlow/Keras:** Powering the core LSTM (Long Short-Term Memory) neural network for time-series forecasting.
* **Pandas & NumPy:** Processing sliding-window feature matrices (24-step lookbacks).
* **SQLAlchemy:** Interfacing with the shared PostgreSQL database for historical data retrieval.

## ✨ Features
* **Predictive Peak Forecasting:** Uses an LSTM model to analyze the last 6 hours of 15-minute intervals to predict the next peak draw.
* **Automated Load Shifting:** Logic-driven deactivation of "non-important" devices when predicted peaks exceed the company's power limit.
* **Environment-Aware Intelligence:** Incorporates humidity and temperature metrics into the ML model to account for HVAC behavioral changes.
* **Holiday & Weekend Context:** A temporal utility identifies Indian Gazetted holidays to adjust for industrial vs. residential load patterns.
* **Sliding Window History:** A robust data pipeline that builds 24-step sequences for every registered company to maintain high-accuracy inference.

## 🧠 The Process: How I Built It
Developing SmartGrid required a distributed architecture that separated data collection from heavy mathematical computation.

I started by building the **Node.js Orchestrator**. This acts as the "brain," receiving telemetry from IoT sensors. It fetches the future weather via OpenWeather and bundles it with current occupancy. The challenge was ensuring the **ML Inference Engine** (Python) had enough context. I designed a sliding-window mechanism in PostgreSQL where the Python service fetches the last 48 intervals (12 hours) to build a 24-feature matrix for the LSTM.

The **LSTM Model** was trained on synthetic 2026 energy patterns. I utilized Joblib for feature scaling and Keras for the model H5 files. On the frontend, I used React to create a real-time "Decision View" that shows exactly *why* the system chose to shut down a specific device, providing transparency to the facility managers.

## 💡 What I Learned
* **Distributed ML Architecture:** How to effectively bridge a TypeScript business-logic layer with a Python data-science layer via REST.
* **Time-Series Feature Engineering:** Gained experience in cyclical encoding (sine/cosine transforms) for hours and days to help the LSTM understand temporal loops.
* **Database Optimization:** Managing high-write energy logs in PostgreSQL while maintaining fast read-performance for historical inference lookups.

## 💻 Running the Project

### Prerequisites
* Node.js (v18+) & Python (3.10+)
* PostgreSQL running locally or via Docker
* OpenWeather API Key

### Setup Instructions

```bash
# 1. Clone the repository
git clone [https://github.com/YOUR_USERNAME/smartgrid-2026.git](https://github.com/YOUR_USERNAME/smartgrid-2026.git)
cd smartgrid-2026

# ----------------------------------------------------
# 2. ML Backend (Python) Setup
# ----------------------------------------------------
cd ml-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Add DATABASE_URL to your .env
python run.py  # Starts on http://localhost:5001

# ----------------------------------------------------
# 3. Main Backend (Node.js) Setup
# ----------------------------------------------------
cd ../main-backend
npm install

# Run Prisma migrations
npx prisma generate
npx prisma db push

npm run dev  # Starts on http://localhost:5000

# ----------------------------------------------------
# 4. Frontend (React) Setup
# ----------------------------------------------------
cd ../frontend
npm install
npm run dev  # Starts on http://localhost:3000
