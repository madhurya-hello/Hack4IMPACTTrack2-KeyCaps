// src/hooks/useGeolocation.js
import { useState, useEffect } from "react";

export function useGeolocation() {
  const [location, setLocation] = useState({
    latitude: 20.2961, // Default fallback (from your Search.jsx)
    longitude: 85.8245, // Default fallback
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        loading: false,
        error: "Not supported",
      }));
      return;
    }

    const handleSuccess = (position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        loading: false,
        error: null,
      });
    };

    const handleError = (error) => {
      setLocation((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  }, []);

  return location;
}
