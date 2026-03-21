// src/server.ts

import "dotenv/config"; // Ensures environment variables are loaded first
import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Smart Grid Backend is running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/health`);
  console.log(
    `🔌 Energy Endpoint: POST http://localhost:${PORT}/api/energy/update`,
  );
});
