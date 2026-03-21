// src/interfaces/energy.interface.ts

export interface DeviceData {
  device_id: string;
  device_name: string;
  power_usage: number;
  is_important: boolean;
  is_device_active: boolean;
}

export interface EnergyPayload {
  company_name: string;
  current_total_power: number;
  // headcount removed
  devices: DeviceData[];
  lat: number;
  lon: number;
  timestamp?: number;
}

export interface PowerContext {
  hour: number;
  day_of_week: number;
  is_weekend: boolean;
  is_holiday: boolean;
  holiday_name?: string;
}
