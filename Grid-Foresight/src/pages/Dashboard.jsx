import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lightbulb, Snowflake, Tv, Wind, Plug, Monitor, Battery, 
  Speaker, Camera, DoorClosed, Thermometer, Router, 
  Printer, Gamepad2, Droplets, MapPin, Globe, Navigation, Activity 
} from 'lucide-react';
import '../App.css';
import { globalRoomDevices, calculateTotalPower, COMPANIES, COMPANY_INFO, gadgetTypes } from '../deviceData';
import CompanyPowerGraph from "../components/CompanyPowerGraph.jsx";
<components></components>
function Dashboard() {
  const navigate = useNavigate();

  const [forecast] = useState({
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    latitude: 19.0760,
    longitude: 72.8777,
    temperature: "32°C",
    humidity: "65%",
    wind: "15 km/h"
  });

  const [gadgets] = useState(gadgetTypes.map((g, i) => ({
    id: i + 1,
    icon: React.cloneElement(g.icon, { size: 28, strokeWidth: 1.5 }),
    label: g.label
  })));

  const [selectedCompany, setSelectedCompany] = useState(COMPANIES[0]);
  const [rooms, setRooms] = useState(COMPANY_INFO[COMPANIES[0]].rooms);
  const [totalPower, setTotalPower] = useState(calculateTotalPower(globalRoomDevices[COMPANIES[0]]));

  const handleCompanyChange = (e) => {
    const comp = e.target.value;
    setSelectedCompany(comp);
    setRooms(COMPANY_INFO[comp].rooms);
    setTotalPower(calculateTotalPower(globalRoomDevices[comp]));
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard<span className="blink-cursor">_</span></h1>
      </header>
      <div className="dashboard-content">
        <div className="top-container">
          
          {/* Top Left - Forecast Map */}
          <div className="sub-container top-left glass-panel glow-cyan">
            <h2 className="panel-title">Location Metrics</h2>
            <div className="panel-content">
              <div className="forecast-grid-2col">
                <div className="forecast-left-col">
                  <div className="stat-card stat-horizontal">
                    <span className="stat-icon"><MapPin size={18} color="#00f3ff" /></span>
                    <span className="stat-val">{forecast.city}, {forecast.state}</span>
                  </div>
                  <div className="stat-card stat-horizontal">
                    <span className="stat-icon"><Globe size={18} color="#00f3ff" /></span>
                    <span className="stat-val" style={{ textTransform: 'uppercase', letterSpacing: '0.05rem', fontSize: '0.8rem' }}>{forecast.country}</span>
                  </div>
                  <div className="stat-card stat-horizontal">
                    <span className="stat-icon"><Navigation size={18} color="#00f3ff" /></span>
                    <span className="stat-val" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>LAT: {forecast.latitude} | LON: {forecast.longitude}</span>
                  </div>
                </div>
                <div className="forecast-right-col">
                  <div className="stat-card stat-horizontal">
                    <span className="stat-icon"><Thermometer size={18} color="#00f3ff" /></span>
                    <span className="stat-val">{forecast.temperature}</span>
                  </div>
                  <div className="stat-card stat-horizontal">
                    <span className="stat-icon"><Droplets size={18} color="#00f3ff" /></span>
                    <span className="stat-val">{forecast.humidity}</span>
                  </div>
                  <div className="stat-card stat-horizontal">
                    <span className="stat-icon"><Wind size={18} color="#00f3ff" /></span>
                    <span className="stat-val">{forecast.wind}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Right - Gadgets Array */}
          <div className="sub-container top-right glass-panel glow-magenta">
            <h2 className="panel-title">Active Devices</h2>
            <div className="panel-content gadget-panel-content">
              <div className="gadget-grid">
                {gadgets.map((gadget) => (
                  <div key={gadget.id} className="gadget-card">
                    <div className="gadget-icon">{gadget.icon}</div>
                    <div className="gadget-label">{gadget.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bottom-container">
          {/* Bottom Left - Remains Telemetry placeholder */}
          <div 
            className="sub-container bottom-left glass-panel glow-blue"
              style={{ display: 'flex', flexDirection: 'column' }}
          >
            <h2 className="panel-title">Main Telemetry</h2>

              <div 
              className="panel-content" 
              style={{ flex: 1, padding: '0.5rem' }}
                >
    <div style={{ width: '100%', height: '100%', minHeight: '350px' }}>
      <CompanyPowerGraph 
        key={selectedCompany}
        company={selectedCompany} 
      />
    </div>
  </div>
</div>

          {/* Bottom Right - Rooms List (Scrollable) */}
          <div className="sub-container bottom-right glass-panel glow-purple" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 className="panel-title">Facility Rooms</h2>
            
            <div style={{ padding: '0 1rem 1rem 1rem' }}>
              <div className="dropdown-container" style={{ width: '100%', marginBottom: '10px' }}>
                <select 
                  value={selectedCompany} 
                  onChange={handleCompanyChange}
                  className="room-select"
                  style={{ width: '100%' }}
                >
                  {COMPANIES.map(comp => (
                    <option key={comp} value={comp}>{comp}</option>
                  ))}
                </select>
                <div className="dropdown-arrow">▼</div>
              </div>
            </div>

            <div className="panel-content scrollable-list-container" style={{ flex: 1, overflowY: 'auto' }}>
               <ul className="room-list scrollable-list">
                 {rooms.map((room, index) => (
                   <li 
                     key={index} 
                     className="room-item" 
                     style={{ cursor: 'pointer', transition: 'background 0.2s', ':hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }} 
                     onClick={() => navigate(`/search?room=${encodeURIComponent(room)}&company=${encodeURIComponent(selectedCompany)}`)}
                   >
                     <span className="room-icon"><DoorClosed size={18} /></span>
                     <span className="room-name">{room}</span>
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
