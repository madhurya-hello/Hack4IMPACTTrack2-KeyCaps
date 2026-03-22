// src/services/energy.service.ts

import prisma from "./prisma.service.js";
import weatherService from "./weather.service.js";
import mlService from "./ml.service.js";
import { getPowerContext } from "../utils/holiday.util.js";
import type {
  EnergyPayload,
  DeviceData,
} from "../interfaces/energy.interface.js";

class EnergyService {
  async processEnergyUpdate(payload: EnergyPayload) {
    const {
      company_name,
      current_total_power,
      devices, // headcount removed from destructuring
      lat,
      lon,
      timestamp,
    } = payload;

    const company = await prisma.company.findUnique({
      where: { name: company_name },
    });
    console.log(`DEBUG: Found company: ${company?.name}, Max Capacity: ${company?.maxCapacity}`); // Add this

    if (!company) throw new Error(`Company '${company_name}' not found.`);

    const weather = await weatherService.getFutureWeather(lat, lon, timestamp);
    console.log("DEBUG: Weather Service Response:", weather); // Add this
    const now = new Date();
    const context = getPowerContext(now);

    // This object is what is sent to the Flask Backend via ML Service
    const features = {
      company_name: company.name,
      date: now.toISOString().split("T")[0],
      timestamp: now.toTimeString().split(" ")[0], // HH:MM:SS format
      is_weekend: context.is_weekend,
      is_holiday: context.is_holiday,
      max_capacity: company.maxCapacity,
      // occupancy_count removed
      temperature: weather.temperature,
      humidity: weather.humidity,
      power_consumption: current_total_power,
    };

    const predictedPeak = await mlService.getPeakPrediction(features);
    console.log(`DEBUG: ML Prediction: ${predictedPeak}kW, Current Limit: ${company.maxPowerLimit}kW`); // Add this
    
    // 1. Calculate how much we are over the limit
    const limitExceeded = predictedPeak > company.maxPowerLimit;
    const excessPower = limitExceeded ? (predictedPeak - company.maxPowerLimit) : 0;
    
    let powerCutSoFar = 0;

    // 2. Selectively deactivate devices until the target is met
    const updatedDevices: DeviceData[] = devices.map((device) => {
      if (
        limitExceeded && 
        !device.is_important && 
        device.is_device_active && 
        powerCutSoFar < excessPower // Stop turning things off once target is met
      ) {
        powerCutSoFar += device.power_usage; // Assuming power_usage is correctly typed
        return { ...device, is_device_active: false };
      }
      return device;
    });

    // 3. Log the action in the database
    // Updated EnergyLog creation (no headcount)
    await prisma.energyLog.create({
      data: {
        companyName: company.name,
        totalPowerDraw: current_total_power,
        temperature: weather.temperature,
        humidity: weather.humidity,
        isHoliday: context.is_holiday,
        isWeekend: context.is_weekend,
        limitExceeded: limitExceeded,
        predictedPeak: predictedPeak,
      },
    });

    // Return the excess and current status to the frontend
    return {
      limitExceeded,
      predictedPeak,
      excessPower: parseFloat(excessPower.toFixed(2)),
      powerCutSoFar: parseFloat(powerCutSoFar.toFixed(2)),
      updatedDevices,
      features,
    };
  }
}

export default new EnergyService();
