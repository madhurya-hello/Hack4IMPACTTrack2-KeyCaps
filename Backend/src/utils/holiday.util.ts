// src/utils/holiday.util.ts

import type { PowerContext } from "../interfaces/energy.interface.js";

const INDIAN_HOLIDAYS_2026: Record<string, string> = {
  // Mandatory Gazetted Holidays
  "2026-01-01": "New Year's Day",
  "2026-01-26": "Republic Day",
  "2026-03-04": "Holi",
  "2026-03-21": "Id-ul-Fitr",
  "2026-03-26": "Ram Navami",
  "2026-03-31": "Mahavir Jayanti",
  "2026-04-03": "Good Friday",
  "2026-05-01": "Buddha Purnima",
  "2026-05-27": "Id-ul-Zuha (Bakrid)",
  "2026-06-26": "Muharram",
  "2026-08-15": "Independence Day",
  "2026-08-26": "Id-e-Milad",
  "2026-09-04": "Janmashtami",
  "2026-10-02": "Mahatma Gandhi's Birthday",
  "2026-10-20": "Dussehra",
  "2026-11-08": "Diwali",
  "2026-11-24": "Guru Nanak's Birthday",
  "2026-12-25": "Christmas Day",

  // Major Restricted/Regional Holidays
  "2026-01-14": "Pongal / Makar Sankranti",
  "2026-01-23": "Vasant Panchami",
  "2026-02-15": "Maha Shivaratri",
  "2026-03-19": "Ugadi / Gudi Padwa",
  "2026-04-06": "Easter Monday",
  "2026-08-28": "Raksha Bandhan",
  "2026-09-14": "Ganesh Chaturthi",
  "2026-10-29": "Karva Chauth",
  "2026-11-09": "Govardhan Puja",
  "2026-11-15": "Chhath Puja",
};

export const getPowerContext = (date: Date = new Date()): PowerContext => {
  const dateString = date.toISOString().split("T")[0] as string;
  const dayOfWeek = date.getDay();
  const holidayName = INDIAN_HOLIDAYS_2026[dateString];

  // 1. Build the base object WITHOUT the optional property
  const context: PowerContext = {
    hour: date.getHours(),
    day_of_week: dayOfWeek,
    is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
    is_holiday: !!holidayName, // true if holidayName exists, false otherwise
  };

  // 2. Only attach the holiday_name key if it's a valid string
  if (holidayName) {
    context.holiday_name = holidayName;
  }

  return context;
};
