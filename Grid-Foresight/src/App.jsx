import React, { useState } from 'react';
import GridCell from './components/GridCell';
import './App.css';

function App() {
  const [forecasts, setForecasts] = useState([
    { label: "Country", value: "India" },
    { label: "State", value: "Maharashtra" },
    { label: "City", value: "Mumbai" },
    { label: "Temperature", value: "32°C" },
    { label: "Humidity", value: "65%" },
    { label: "Wind", value: "15 km/h" },
  ]);

  const [gadgets, setGadgets] = useState([
    { id: 1, name: "Bulb", total_units: 80, active_units: 45, power: 100, is_important: true },
    { id: 2, name: "Motor", total_units: 60, active_units: 20, power: 1200, is_important: false },
    { id: 3, name: "Fan", total_units: 95, active_units: 85, power: 75, is_important: true },
    { id: 4, name: "Refrigerator", total_units: 30, active_units: 30, power: 400, is_important: false },
    { id: 5, name: "AC", total_units: 40, active_units: 25, power: 1500, is_important: true },
    { id: 6, name: "Heater", total_units: 15, active_units: 5, power: 2000, is_important: false },
    { id: 7, name: "Pump", total_units: 20, active_units: 12, power: 800, is_important: false },
    { id: 8, name: "Compressor", total_units: 18, active_units: 15, power: 3000, is_important: true },
    { id: 9, name: "Oven", total_units: 25, active_units: 8, power: 1500, is_important: false },
    { id: 10, name: "TV", total_units: 50, active_units: 42, power: 150, is_important: true },
  ]);

  const updateGadget = (id, updatedFields) => {
    setGadgets((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updatedFields } : g))
    );
  };

  return (
    <div className="app-container">
      <div className="top-container">
        {/* Placeholder for future 3D graph */}
      </div>
      <div className="bottom-container">
        <aside className="sidebar glass">
          <div className="sidebar-logo">Forecasts</div>
          <div className="sidebar-forecasts">
            <ul>
              {forecasts.map((f, i) => (
                <li key={i}>
                  <span>{f.label}:</span> {f.value}
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <main className="grid-container">
          {gadgets.map((gadget) => (
            <GridCell 
              key={gadget.id} 
              gadget={gadget} 
              onUpdate={(fields) => updateGadget(gadget.id, fields)} 
            />
          ))}
        </main>
      </div>
    </div>
  );
}

export default App;
