// src/services/weather.service.ts

import axios from "axios";

export interface WeatherData {
  temperature: number;
  humidity: number;
}

class WeatherService {
  private readonly apiKey = process.env.OPENWEATHER_API_KEY;
  // One Call 3.0 Timemachine endpoint supports specific timestamps
  private readonly baseUrl =
    "https://api.openweathermap.org/data/3.0/onecall/timemachine";

  /**
   * Fetches weather for a 30-minute future offset from a given timestamp.
   * @param lat Latitude
   * @param lon Longitude
   * @param timestamp Starting Unix timestamp (seconds)
   */
  async getFutureWeather(
    lat: number,
    lon: number,
    timestamp?: number,
  ): Promise<WeatherData> {
    try {
      // If no timestamp is provided, use the current time
      const baseTime = timestamp || Math.floor(Date.now() / 1000);

      // Calculate target time: 30 minutes (1800 seconds) in the future
      const targetTime = baseTime + 1800;

      const response = await axios.get(this.baseUrl, {
        params: {
          lat: lat,
          lon: lon,
          dt: targetTime,
          appid: this.apiKey,
          units: "metric",
        },
      });

      // One Call 3.0 returns data in a 'data' array for the requested timestamp
      const weatherPoint = response.data.data[0];

      return {
        temperature: weatherPoint.temp,
        humidity: weatherPoint.humidity,
      };
    } catch (error: any) {
      console.error(
        `Failed to fetch future weather for [${lat}, ${lon}]:`,
        error.message,
      );
      // Fallback values for hackathon stability
      return { temperature: 25, humidity: 50 };
    }
  }
}

export default new WeatherService();
