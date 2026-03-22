// src/controllers/energy.controller.ts
import type { Request, Response } from "express";
import energyService from "../services/energy.service.js";
import cryptoService from "../services/crypto.service.js";

class EnergyController {
  public receiveEnergyData = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { encryptedData } = req.body;
      const clientId = req.headers["x-client-id"] as string; // Read the custom header
      console.log(`DEBUG: Request received for ClientID: ${clientId}`); // Add this

      if (!encryptedData || !clientId) {
        res
          .status(400)
          .json({
            success: false,
            error: "Encrypted payload and Client ID required.",
          });
        return;
      }

      // 1. Fetch the specific key for this session from Redis
      const clientPublicKey = await cryptoService.getClientKey(clientId);

      if (!clientPublicKey) {
        console.error(`DEBUG: No public key found in Redis for ClientID: ${clientId}`); // Add this
        res
          .status(401)
          .json({ success: false, error: "Session expired or invalid." });
        return;
      }

      // 2. Decrypt using server private key
      const payload = await cryptoService.decrypt(encryptedData);
      console.log("DEBUG: Decrypted Payload:", payload); // Add this

      // 3. Process business logic
      const result = await energyService.processEnergyUpdate(payload);
      console.log("DEBUG: EnergyService result calculated"); // Add this

      // 4. Encrypt the response using the client's specific public key
      const rawResponse = { success: true, data: result };
      const encryptedResponse = await cryptoService.encrypt(
        rawResponse,
        clientPublicKey,
      );

      res.status(200).json({ encryptedData: encryptedResponse });
    } catch (error: any) {
      console.error("DEBUG: EnergyController Error:", error.message); // Update this
      res.status(500).json({ success: false, error: error.message });
    }
  };
}

export default new EnergyController();
