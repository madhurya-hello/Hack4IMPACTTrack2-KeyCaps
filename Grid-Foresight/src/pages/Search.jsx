import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Power } from 'lucide-react';
import { globalRoomDevices, calculateTotalPower, gadgetTypes, COMPANIES, COMPANY_INFO } from '../deviceData';
import './Search.css';

function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  const initialCompany = searchParams.get('company') || COMPANIES[0];
  const [selectedCompany, setSelectedCompany] = useState(initialCompany);

  const validRooms = COMPANY_INFO[initialCompany].rooms;
  const urlRoom = searchParams.get('room');
  const initialRoom = validRooms.includes(urlRoom) ? urlRoom : validRooms[0];
  const [selectedRoom, setSelectedRoom] = useState(initialRoom);

  const [companyTotalPower, setCompanyTotalPower] = useState(calculateTotalPower(globalRoomDevices[initialCompany]));

  
  const initialFilters = {};
  gadgetTypes.forEach(t => { initialFilters[t.id] = true; });
  const [selectedFilters, setSelectedFilters] = useState(initialFilters);

  const toggleFilter = (id) => {
    setSelectedFilters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [devices, setDevices] = useState(globalRoomDevices[selectedCompany]?.[selectedRoom] || []);

  useEffect(() => {
    setDevices(globalRoomDevices[selectedCompany]?.[selectedRoom] || []);
  }, [selectedCompany, selectedRoom]);

  const toggleDeviceActive = (id) => {
    setDevices(prev => prev.map(dev => {
      if (dev.id === id) {
        const updatedDev = { ...dev, active: !dev.active };
        // Sync back to global object
        const globalDev = globalRoomDevices[selectedCompany]?.[selectedRoom]?.find(d => d.id === id);
        if (globalDev) {
          globalDev.active = updatedDev.active;
          setCompanyTotalPower(calculateTotalPower(globalRoomDevices[selectedCompany]));
        }
        return updatedDev;
      }
      return dev;
    }));
  };

  const filteredDevices = devices.filter(dev => selectedFilters[dev.type] !== false);

  return (
    <div className="search-page-container">
      {/* Sidebar */}
      <aside className="search-sidebar glass-panel glow-purple">
        <div className="sidebar-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
            <span>Dashboard</span>
          </button>
        </div>
        
        <div className="filter-section">
          <h3 className="filter-title">Location</h3>
          <div className="dropdown-container">
            <select 
              value={selectedRoom} 
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="room-select"
            >
              {COMPANY_INFO[selectedCompany].rooms.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
            <div className="dropdown-arrow">▼</div>
          </div>
        </div>

        <div className="filter-section filter-scroll">
          <h3 className="filter-title">Device Types</h3>
          <div className="checkbox-list">
            {gadgetTypes.map(type => (
              <label key={type.id} className={`custom-checkbox ${selectedFilters[type.id] ? 'checked' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={!!selectedFilters[type.id]} 
                  onChange={() => toggleFilter(type.id)}
                  className="hidden-auth-checkbox"
                />
                <span className="checkbox-icon">{type.icon}</span>
                <span className="checkbox-label">{type.label}</span>
                <div className="checkbox-indicator"></div>
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="search-main">
        <header className="search-header glass-panel glow-cyan">
          <h1 className="search-title">{selectedRoom} <span className="title-suffix">Devices</span><span className="blink-cursor">_</span></h1>
          <div className="search-stats">
            <span className="stat-badge">Total: {filteredDevices.length}</span>
            <span className="stat-badge active">Active: {filteredDevices.filter(d => d.active).length}</span>
          </div>
        </header>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '1rem' }}>
          <div className="dropdown-container" style={{ width: '250px' }}>
            <select 
              value={selectedCompany} 
              onChange={(e) => {
                const newComp = e.target.value;
                setSelectedCompany(newComp);
                setSelectedRoom(COMPANY_INFO[newComp].rooms[0]);
                setCompanyTotalPower(calculateTotalPower(globalRoomDevices[newComp]));
              }}
              className="room-select"
              style={{ width: '100%', border: '1px solid rgba(0, 243, 255, 0.4)', background: 'rgba(5, 15, 30, 0.7)' }}
            >
              {COMPANIES.map(comp => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
            <div className="dropdown-arrow">▼</div>
          </div>
          <div className="glass-panel" style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.3)', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#a0aec0', fontSize: '0.9rem', marginRight: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Power Consumption:</span>
            <span style={{ color: '#00f3ff', fontSize: '1.25rem', fontWeight: 'bold', textShadow: '0 0 10px rgba(0,243,255,0.5)' }}>{companyTotalPower.toFixed(2)} kW</span>
          </div>
        </div>

        <div className="devices-grid glass-panel glow-blue">
          {filteredDevices.length > 0 ? (
            filteredDevices.map(device => (
              <div key={device.id} className={`device-card ${device.active ? 'is-active' : ''}`}>
                <div className="device-card-header">
                  <div className="device-card-icon">{device.iconLg || device.icon}</div>
                  <div className={`status-dot ${device.active ? 'active' : 'inactive'}`}></div>
                </div>
                <div className="device-info">
                  <h4 className="device-name">{device.label}</h4>
                  <div className="device-power">
                    <span className="power-label">Power:</span>
                    <span className="power-value">{device.power >= 1 ? `${device.power} kW` : `${Math.round(device.power * 1000)} W`}</span>
                  </div>
                </div>
                <button 
                  className={`toggle-btn ${device.active ? 'btn-on' : 'btn-off'}`}
                  onClick={() => toggleDeviceActive(device.id)}
                >
                  <Power size={14} />
                  <span>{device.active ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            ))
          ) : (
            <div className="no-devices">No devices found for the selected filters.</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Search;
