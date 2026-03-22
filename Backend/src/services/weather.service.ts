// src/services/weather.service.ts

import axios from "axios";

export interface WeatherData {
  temperature: number;
  humidity: number;
}

class WeatherService {
  private readonly apiKey = process.env.OPENWEATHER_API_KEY;

  // Use the 2.5 API version which is included in the basic free plan
  private readonly baseUrl = "https://api.openweathermap.org/data/2.5/weather";

  async getFutureWeather(
    lat: number,
    lon: number,
    _timestamp?: number, // Underscore indicates unused for now in 2.5
  ): Promise<WeatherData> {
    try {
      console.log(`DEBUG: Fetching 2.5 Weather for Lat:${lat} Lon:${lon}`);

      const response = await axios.get(this.baseUrl, {
        params: {
          lat: lat,
          lon: lon,
          appid: this.apiKey,
          units: "metric",
        },
      });

      // The 2.5 response structure is different from 3.0
      const { temp, humidity } = response.data.main;
      console.log("DEBUG: Weather API 2.5 Data Received:", { temp, humidity });

      return {
        temperature: temp,
        humidity: humidity,
      };
    } catch (error: any) {
      console.warn("DEBUG: Weather API Error, using fallback (25C/50%)");
      console.error(
        `Failed to fetch weather:`,
        error.response?.data || error.message,
      );

      return { temperature: 25, humidity: 50 };
    }
  }
}

export default new WeatherService();
