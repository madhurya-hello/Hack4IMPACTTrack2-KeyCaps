// src/routes/energy.routes.ts

import { Router } from "express";
import energyController from "../controllers/energy.controller.js";
import weatherService from "../services/weather.service.js"; // Import the service directly for testing

const router = Router();

// Your existing update route
router.post("/update", energyController.receiveEnergyData);

/**
 * TEMPORARY TESTING ROUTE
 * URL: GET /api/energy/test-weather?lat={lat}&lon={lon}
 */
router.get("/test-weather", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: "Please provide 'lat' and 'lon' query parameters.",
      });
    }

    // Call the weather service with the coordinates provided in the URL
    const data = await weatherService.getFutureWeather(
      Number(lat),
      Number(lon),
    );

    res.status(200).json({
      success: true,
      timestamp: new Date().toLocaleString(),
      coordinates: { lat, lon },
      weather_data: data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
