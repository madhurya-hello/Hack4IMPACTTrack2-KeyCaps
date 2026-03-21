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

    if (!company) throw new Error(`Company '${company_name}' not found.`);

    const weather = await weatherService.getFutureWeather(lat, lon, timestamp);
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
    const limitExceeded = predictedPeak > company.maxPowerLimit;

    const updatedDevices: DeviceData[] = devices.map((device) => {
      if (limitExceeded && !device.is_important && device.is_device_active) {
        return { ...device, is_device_active: false };
      }
      return device;
    });

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

    return {
      limitExceeded,
      predictedPeak,
      updatedDevices,
      features,
    };
  }
}

export default new EnergyService();
