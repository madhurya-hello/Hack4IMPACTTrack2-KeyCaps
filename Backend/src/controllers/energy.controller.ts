// src/controllers/energy.controller.ts

import type { Request, Response } from "express";
import energyService from "../services/energy.service.js";
import type { EnergyPayload } from "../interfaces/energy.interface.js";

class EnergyController {
  public receiveEnergyData = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const payload = req.body as EnergyPayload;

      // Validate company_name instead of company_id
      if (
        !payload.company_name ||
        !payload.devices ||
        payload.devices.length === 0
      ) {
        res.status(400).json({
          success: false,
          error:
            "Invalid payload: 'company_name' and a non-empty 'devices' list are required.",
        });
        return;
      }

      const result = await energyService.processEnergyUpdate(payload);

      res.status(200).json({
        success: true,
        message: result.limitExceeded
          ? "Predicted peak exceeds limit. Auto-shifting performed."
          : "Consumption within safe predicted limits.",
        data: result,
      });
    } catch (error) {
      console.error("Error in receiveEnergyData:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  };
}

export default new EnergyController();
