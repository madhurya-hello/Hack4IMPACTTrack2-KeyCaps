import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Power, Bot, Bookmark, Loader } from 'lucide-react';
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

  // New states for Timeline and Agent Mode
  const [timelineHour, setTimelineHour] = useState(12);
  const [agentMode, setAgentMode] = useState(false);
  const [headcount, setHeadcount] = useState(45);
  const [isAgentLoading, setIsAgentLoading] = useState(false);

  useEffect(() => {
    if (agentMode) {
      setIsAgentLoading(true);
      let allDevices = [];
      const rooms = COMPANY_INFO[selectedCompany]?.rooms || [];
      rooms.forEach(room => {
        const roomDevs = globalRoomDevices[selectedCompany]?.[room] || [];
        roomDevs.forEach(dev => {
          allDevices.push({
            device_id: dev.id || `dev-${Math.random().toString(36).substr(2, 9)}`,
            room_no: room,
            device_name: dev.label,
            power_usage: dev.power,
            is_important: !!dev.is_important,
            is_device_active: dev.active !== false
          });
        });
      });

      const payload = {
        company_name: selectedCompany,
        current_total_power: parseFloat(companyTotalPower.toFixed(2)),
        lat: 20.2961,
        lon: 85.8245,
        headcount: headcount,
        devices: allDevices
      };

      console.log('Power Agent Triggered API - Payload:', payload);

      fetch('http://localhost:3000/api/energy/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }).catch(() => {}); // Backend currently inactive

      setTimeout(() => {
        setIsAgentLoading(false);
      }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentMode, timelineHour]);

  
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

  const toggleDeviceImportant = (id) => {
    setDevices(prev => prev.map(dev => {
      if (dev.id === id) {
        const updatedDev = { ...dev, is_important: !dev.is_important };
        // Sync back to global object
        const globalDev = globalRoomDevices[selectedCompany]?.[selectedRoom]?.find(d => d.id === id);
        if (globalDev) {
          globalDev.is_important = updatedDev.is_important;
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
          <h3 className="filter-title">Company</h3>
          <div className="dropdown-container">
            <select 
              value={selectedCompany} 
              onChange={(e) => {
                const newComp = e.target.value;
                setSelectedCompany(newComp);
                setSelectedRoom(COMPANY_INFO[newComp].rooms[0]);
                setCompanyTotalPower(calculateTotalPower(globalRoomDevices[newComp]));
              }}
              className="room-select"
            >
              {COMPANIES.map(comp => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
            <div className="dropdown-arrow">▼</div>
          </div>
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
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="glass-panel" style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.3)', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#a0aec0', fontSize: '0.9rem', marginRight: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Headcount:</span>
              <input 
                type="number" 
                value={headcount} 
                onChange={(e) => setHeadcount(Number(e.target.value))} 
                style={{ width: '50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0, 243, 255, 0.3)', borderRadius: '4px', color: '#00f3ff', fontSize: '1.1rem', outline: 'none', fontWeight: 'bold', textAlign: 'center', padding: '0.2rem' }} 
              />
            </div>
            <div className="glass-panel" style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.3)', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#a0aec0', fontSize: '0.9rem', marginRight: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Power Consumption:</span>
              <span style={{ color: '#00f3ff', fontSize: '1.25rem', fontWeight: 'bold', textShadow: '0 0 10px rgba(0,243,255,0.5)' }}>{companyTotalPower.toFixed(2)} kW</span>
            </div>
          </div>
        </header>

        <div style={{ display: 'flex', width: '100%', marginBottom: '1rem', marginTop: '1rem', gap: '1rem' }}>
          <div style={{ width: '80%', padding: '0.75rem 1.5rem', background: 'rgba(5, 15, 30, 0.7)', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} className="glass-panel glow-blue">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#00f3ff', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              <span>00:00</span>
              <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{String(timelineHour).padStart(2, '0')}:00</span>
              <span>23:00</span>
            </div>
            <div className="timeline-container">
              <div className="timeline-markers">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="timeline-marker"></div>
                ))}
              </div>
              <input 
                type="range" 
                min="0" 
                max="23" 
                step="1"
                value={timelineHour}
                onChange={(e) => setTimelineHour(parseInt(e.target.value))}
                className="custom-range-slider"
              />
            </div>
          </div>
          <div style={{ width: '20%', padding: '0.5rem', background: 'rgba(5, 15, 30, 0.7)', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="glass-panel glow-cyan">
            <button 
              style={{ 
                width: '100%',
                height: '100%',
                padding: '0.4rem 0.8rem', 
                background: agentMode ? 'rgba(0, 243, 255, 0.2)' : 'transparent', 
                border: `1px solid ${agentMode ? '#00f3ff' : 'rgba(0, 243, 255, 0.5)'}`, 
                color: agentMode ? '#00f3ff' : '#a0aec0', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: 'all 0.3s ease',
                boxShadow: agentMode ? '0 0 15px rgba(0, 243, 255, 0.4)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }} 
              onClick={() => setAgentMode(!agentMode)}
              disabled={isAgentLoading}
            >
              {isAgentLoading ? (
                <Loader size={28} className="spin-animation" color="#fff" />
              ) : (
                <Bot size={28} color={agentMode ? '#fff' : 'currentColor'} />
              )}
              <span style={{ fontSize: '0.95rem', color: agentMode || isAgentLoading ? '#fff' : 'inherit' }}>
                {isAgentLoading ? 'Analyzing...' : 'Power Agent'}
              </span>
            </button>
          </div>
        </div>

        <div className="devices-grid glass-panel glow-blue">
          {filteredDevices.length > 0 ? (
            filteredDevices.map(device => (
              <div key={device.id} className={`device-card ${device.active ? (device.suggested_active !== false ? 'is-active' : 'is-active-suggested-off') : 'is-off'}`}>
                <div className="device-card-header">
                  <div className="device-card-icon">{device.iconLg || device.icon}</div>
                  <button 
                    className={`important-btn ${device.is_important ? 'is-important' : ''}`}
                    onClick={() => toggleDeviceImportant(device.id)}
                  >
                    <Bookmark size={14} fill={device.is_important ? '#ffd700' : 'none'} />
                    <span>Important</span>
                  </button>
                </div>
                <div className="device-info">
                  <h4 className="device-name">{device.label}</h4>
                  <div className="device-power">
                    <span className="power-label">Power:</span>
                    <span className="power-value">{device.power >= 1 ? `${device.power} kW` : `${Math.round(device.power * 1000)} W`}</span>
                  </div>
                </div>
                <button 
                  className={`toggle-btn ${device.active ? (device.suggested_active !== false ? 'btn-on' : 'btn-on-suggested-off') : 'btn-off'}`}
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
