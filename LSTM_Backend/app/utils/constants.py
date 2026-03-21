# app/utils/constants.py

# 1. 2026 Indian Holidays (Updated for your 2026 project)
# Dates for fixed holidays. Note: Variable holidays like Holi/Diwali 
# should be updated based on the 2026 calendar.
HOLIDAYS_2026 = {
    '2026-01-01': 'New Year',
    '2026-01-14': 'Makar Sankranti',
    '2026-01-26': 'Republic Day',
    '2026-03-03': 'Holi',          # Predicted 2026 date
    '2026-08-15': 'Independence Day',
    '2026-10-02': 'Gandhi Jayanti',
    '2026-11-08': 'Diwali',        # Predicted 2026 date
    '2026-12-25': 'Christmas'
}

# 2. Time Category Definitions (Matches Model.py logic)
# Your model defines Peak Hours as 17:00 (5 PM) to 21:00 (9 PM)
PEAK_START = 17
PEAK_END = 21

# Morning: 06:00 to 12:00
MORNING_START = 6
MORNING_END = 12

# Evening: 18:00 to 00:00
EVENING_START = 18
EVENING_END = 24

# 3. Model Parameters
LOOKBACK_STEPS = 24  # 6 hours of 15-min intervals
BUFFER_STEPS = 48    # 12 hours to ensure 24-step lags are available