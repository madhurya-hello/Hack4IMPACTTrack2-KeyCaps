import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Power, Bot, Bookmark, Loader } from "lucide-react";
import {
  globalRoomDevices,
  calculateTotalPower,
  gadgetTypes,
  COMPANIES,
  COMPANY_INFO,
} from "../deviceData";
import * as jose from "jose";
import "./Search.css";
import { useGeolocation } from "../hooks/useGeolocation";

function Search() {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(routerLocation.search);
  const location = useGeolocation();

  // 1. Get the raw company name from URL
  const rawCompany = searchParams.get("company");

  // 2. Normalize: Remove spaces to match the new space-less keys in COMPANY_INFO
  const normalizedCompany = rawCompany
    ? rawCompany.replace(/\s/g, "")
    : COMPANIES[0];

  // 3. Fallback: If the company from URL doesn't exist in our data, use the default
  const initialCompany = COMPANY_INFO[normalizedCompany]
    ? normalizedCompany
    : COMPANIES[0];

  const [selectedCompany, setSelectedCompany] = useState(initialCompany);

  // 4. Safe access to rooms
  const companyData = COMPANY_INFO[initialCompany];
  const validRooms = companyData
    ? ["All Rooms", ...companyData.rooms]
    : ["All Rooms"];
  const urlRoom = searchParams.get("room");
  const initialRoom = validRooms.includes(urlRoom) ? urlRoom : validRooms[0];
  const [selectedRoom, setSelectedRoom] = useState(initialRoom);

  const [companyTotalPower, setCompanyTotalPower] = useState(
    calculateTotalPower(globalRoomDevices[initialCompany]),
  );

  // New states for Timeline and Agent Mode
  const currentSystemHour = new Date().getHours();
  const [timelineHour, setTimelineHour] = useState(currentSystemHour);
  const isTimelineShifted = timelineHour !== currentSystemHour;
  
  const [agentMode, setAgentMode] = useState(false);
  const [headcount, setHeadcount] = useState(45);
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [secureSession, setSecureSession] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [showAgentReport, setShowAgentReport] = useState(false);
  const [agentActions, setAgentActions] = useState({
    turnedOff: [],
    predictedPeak: 0,
    excessPower: 0,
    limitExceeded: false,
    currentPower: 0,
  });

  useEffect(() => {
    async function setupSecureSession() {
      try {
        console.log("DEBUG: Starting Handshake..."); // Add this
        const { publicKey, privateKey } = await jose.generateKeyPair(
          "ECDH-ES+A256KW",
          {
            crv: "P-256",
          },
        );
        const exportedPublicKey = await jose.exportJWK(publicKey);
        const response = await fetch("http://localhost:3000/api/energy/handshake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientPublicKey: exportedPublicKey }),
        });
        const { serverPublicKey, clientId: cid } = await response.json();
        console.log("DEBUG: Handshake Successful. ClientID:", cid); // Add this
        setSecureSession({ privateKey, serverPublicKey });
        setClientId(cid);
      } catch (e) {
        console.error("DEBUG: Handshake Failed:", e); // Update this
      }
    }
    setupSecureSession();
  }, []);

  const triggerAgentAnalysis = async () => {
    setIsAgentLoading(true);
    let allDevices = [];
    const rooms = COMPANY_INFO[selectedCompany]?.rooms || [];
    rooms.forEach((room) => {
      const roomDevs = globalRoomDevices[selectedCompany]?.[room] || [];
      roomDevs.forEach((dev) => {
        allDevices.push({
          device_id: dev.id || `dev-${Math.random().toString(36).substr(2, 9)}`,
          room_no: room,
          device_name: dev.label,
          power_usage: dev.power,
          is_important: !!dev.is_important,
          is_device_active: dev.active && dev.suggested_active !== false,
        });
      });
    });

    try {
      if (!secureSession || !clientId) {
        console.error("DEBUG: Session not ready");
        setIsAgentLoading(false);
        return;
      }

      // 1. SIMULATION SYNC: Convert timelineHour to Unix Timestamp (seconds)
      const simulatedDate = new Date();
      simulatedDate.setHours(timelineHour, 0, 0, 0);
      const unixTimestamp = Math.floor(simulatedDate.getTime() / 1000);

      const payload = {
        company_name: selectedCompany,
        current_total_power: parseFloat(companyTotalPower.toFixed(2)),
        lat: location.latitude,
        lon: location.longitude,
        timestamp: unixTimestamp,
        devices: allDevices,
      };

      const serverKey = await jose.importJWK(secureSession.serverPublicKey, "ECDH-ES+A256KW");
      const jwe = await new jose.CompactEncrypt(new TextEncoder().encode(JSON.stringify(payload)))
        .setProtectedHeader({ alg: "ECDH-ES+A256KW", enc: "A256GCM" })
        .encrypt(serverKey);

      const response = await fetch("http://localhost:3000/api/energy/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-client-id": clientId },
        body: JSON.stringify({ encryptedData: jwe }),
      });

      const encryptedResult = await response.json();
      const { plaintext } = await jose.compactDecrypt(encryptedResult.encryptedData, secureSession.privateKey);
      const result = JSON.parse(new TextDecoder().decode(plaintext));

      if (result.success) {
        const { updatedDevices, predictedPeak, limitExceeded, excessPower } = result.data;
        const predictedTurnOffs = [];

        // CHANGE: We only identify what WOULD happen, we don't update localDev.suggested_active
        updatedDevices.forEach((remoteDev) => {
          const roomsList = COMPANY_INFO[selectedCompany].rooms;
          for (const r of roomsList) {
            const localDev = globalRoomDevices[selectedCompany]?.[r]?.find((d) => d.id === remoteDev.device_id);
            if (localDev) {
              // If it's active locally but the backend predicts it should be OFF
              if (localDev.active && localDev.suggested_active !== false && !remoteDev.is_device_active) {
                predictedTurnOffs.push(localDev.label);
              }
              break;
            }
          }
        });

        // Show the report with predictions
        setAgentActions({ 
          turnedOff: predictedTurnOffs, 
          predictedPeak,
          excessPower,
          limitExceeded,
          currentPower: parseFloat(companyTotalPower.toFixed(2)) 
        });
        setShowAgentReport(true);
      }
    } catch (error) {
      console.error("DEBUG: Analysis Failed:", error);
    } finally {
      setIsAgentLoading(false);
    }
  };

  const urlDevice = searchParams.get("device");
  const initialFilters = {};
  gadgetTypes.forEach((t) => {
    initialFilters[t.id] = urlDevice ? t.id === urlDevice : true;
  });
  const [selectedFilters, setSelectedFilters] = useState(initialFilters);

  const toggleFilter = (id) => {
    setSelectedFilters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getDevicesForRoom = (comp, rm) => {
    if (rm === "All Rooms") {
      let allDevs = [];
      const rooms = COMPANY_INFO[comp]?.rooms || [];
      rooms.forEach((room) => {
        allDevs = allDevs.concat(globalRoomDevices[comp]?.[room] || []);
      });
      return allDevs;
    }
    return globalRoomDevices[comp]?.[rm] || [];
  };

  const [devices, setDevices] = useState(
    getDevicesForRoom(selectedCompany, selectedRoom),
  );

  useEffect(() => {
    setDevices(getDevicesForRoom(selectedCompany, selectedRoom));
  }, [selectedCompany, selectedRoom]);

  const toggleDeviceActive = (id) => {
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.id === id) {
          const updatedDev = { ...dev };
          if (dev.active && dev.suggested_active === false) {
            updatedDev.suggested_active = true;
          } else {
            updatedDev.active = !dev.active;
          }
          // Sync back to global object
          const allRooms = COMPANY_INFO[selectedCompany].rooms;
          for (const r of allRooms) {
            const globalDev = globalRoomDevices[selectedCompany]?.[r]?.find(
              (d) => d.id === id,
            );
            if (globalDev) {
              globalDev.active = updatedDev.active;
              globalDev.suggested_active = updatedDev.suggested_active;
              setCompanyTotalPower(
                calculateTotalPower(globalRoomDevices[selectedCompany]),
              );
              break;
            }
          }
          return updatedDev;
        }
        return dev;
      }),
    );
  };

  const toggleDeviceImportant = (id) => {
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.id === id) {
          const updatedDev = { ...dev, is_important: !dev.is_important };
          // Sync back to global object
          const allRooms = COMPANY_INFO[selectedCompany].rooms;
          for (const r of allRooms) {
            const globalDev = globalRoomDevices[selectedCompany]?.[r]?.find(
              (d) => d.id === id,
            );
            if (globalDev) {
              globalDev.is_important = updatedDev.is_important;
              break;
            }
          }
          return updatedDev;
        }
        return dev;
      }),
    );
  };

  const filteredDevices = devices.filter(
    (dev) => selectedFilters[dev.type] !== false,
  );

  return (
    <div className="search-page-container">
      {/* Sidebar */}
      <aside className="search-sidebar glass-panel glow-purple">
        <div className="sidebar-header">
          <button className="back-btn" onClick={() => navigate("/")}>
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
                setSelectedRoom("All Rooms");
                setCompanyTotalPower(
                  calculateTotalPower(globalRoomDevices[newComp]),
                );
              }}
              className="room-select"
            >
              {COMPANIES.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
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
              {["All Rooms", ...COMPANY_INFO[selectedCompany].rooms].map(
                (room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ),
              )}
            </select>
            <div className="dropdown-arrow">▼</div>
          </div>
        </div>

        <div className="filter-section filter-scroll">
          <h3 className="filter-title">Device Types</h3>
          <div className="checkbox-list">
            {gadgetTypes.map((type) => (
              <label
                key={type.id}
                className={`custom-checkbox ${selectedFilters[type.id] ? "checked" : ""}`}
              >
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
          <h1 className="search-title">
            {selectedRoom} <span className="title-suffix">Devices</span>
            <span className="blink-cursor">_</span>
          </h1>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div
              className="glass-panel"
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "8px",
                border: "1px solid rgba(0, 243, 255, 0.3)",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  color: "#a0aec0",
                  fontSize: "0.9rem",
                  marginRight: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Headcount:
              </span>
              <input
                type="number"
                value={headcount}
                onChange={(e) => setHeadcount(Number(e.target.value))}
                style={{
                  width: "50px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(0, 243, 255, 0.3)",
                  borderRadius: "4px",
                  color: "#00f3ff",
                  fontSize: "1.1rem",
                  outline: "none",
                  fontWeight: "bold",
                  textAlign: "center",
                  padding: "0.2rem",
                }}
              />
            </div>
            <div
              className="glass-panel"
              style={{
                padding: "0.5rem 1.5rem",
                borderRadius: "8px",
                border: "1px solid rgba(0, 243, 255, 0.3)",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  color: "#a0aec0",
                  fontSize: "0.9rem",
                  marginRight: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Total Power Consumption:
              </span>
              <span
                style={{
                  color: "#00f3ff",
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  textShadow: "0 0 10px rgba(0,243,255,0.5)",
                }}
              >
                {companyTotalPower.toFixed(2)} kW
              </span>
            </div>
          </div>
        </header>

        <div
          style={{
            display: "flex",
            width: "100%",
            marginBottom: "1rem",
            marginTop: "1rem",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "80%",
              padding: "0.75rem 1.5rem",
              background: "rgba(5, 15, 30, 0.7)",
              borderRadius: "8px",
              border: "1px solid rgba(0, 243, 255, 0.3)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
            className="glass-panel glow-blue"
          >
            <div className="timeline-container" style={{ marginTop: "1.5rem" }}>
              <div className="timeline-markers">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: i === timelineHour ? "-30px" : "-22px",
                        fontSize: i === timelineHour ? "12px" : "9px",
                        color:
                          i === timelineHour
                            ? "#00f3ff"
                            : "rgba(255,255,255,0.4)",
                        fontWeight: i === timelineHour ? "bold" : "normal",
                        fontFamily: "monospace",
                        transform: "translateX(-50%)",
                        left: "50%",
                      }}
                    >
                      {String(i).padStart(2, "0")}:00
                    </span>
                    <div
                      className="timeline-marker"
                      style={{
                        height: i === timelineHour ? "14px" : "8px",
                        background:
                          i === timelineHour ? "rgba(0, 243, 255, 0.8)" : "",
                      }}
                    ></div>
                  </div>
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
          <div
            style={{
              width: "20%",
              padding: "0.5rem",
              background: "rgba(5, 15, 30, 0.7)",
              borderRadius: "8px",
              border: "1px solid rgba(0, 243, 255, 0.3)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            className="glass-panel glow-cyan"
          >
            <button
              className="agent-trigger-btn"
              style={{
                width: "100%",
                height: "100%",
                padding: "0.4rem 0.8rem",
                background: isTimelineShifted
                  ? "rgba(175, 56, 255, 0.1)"
                  : "rgba(0, 243, 255, 0.1)",
                border: `1px solid ${isTimelineShifted ? "#af38ff" : "#00f3ff"}`,
                color: isTimelineShifted ? "#af38ff" : "#00f3ff",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1px",
                transition: "all 0.3s ease",
                boxShadow: isTimelineShifted
                  ? "0 0 15px rgba(175, 56, 255, 0.3)"
                  : "0 0 15px rgba(0, 243, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
              onClick={triggerAgentAnalysis}
              disabled={isAgentLoading}
            >
              {isAgentLoading ? (
                <Loader size={24} className="spin-animation" color="#fff" />
              ) : (
                <Bot size={24} color={isTimelineShifted ? "#af38ff" : "#00f3ff"} />
              )}
              <span
                style={{
                  fontSize: "0.95rem",
                  color: "inherit",
                }}
              >
                {isAgentLoading ? "Analyzing..." : isTimelineShifted ? "Predict Peak" : "Power Agent"}
              </span>
            </button>
          </div>
        </div>

        <div className="devices-grid glass-panel glow-blue">
          {filteredDevices.length > 0 ? (
            filteredDevices.map((device) => (
              <div
                key={device.id}
                className={`device-card ${device.active ? (device.suggested_active !== false ? "is-active" : "is-active-suggested-off") : "is-off"}`}
              >
                <div className="device-card-header">
                  <div className="device-card-icon">
                    {device.iconLg || device.icon}
                  </div>
                  <button
                    className={`important-btn ${device.is_important ? "is-important" : ""}`}
                    onClick={() => toggleDeviceImportant(device.id)}
                  >
                    <Bookmark
                      size={14}
                      fill={device.is_important ? "#ffd700" : "none"}
                    />
                    <span>Important</span>
                  </button>
                </div>
                <div className="device-info">
                  <h4 className="device-name">{device.label}</h4>
                  <div className="device-power">
                    <span className="power-label">Power:</span>
                    <span className="power-value">
                      {device.power >= 1
                        ? `${device.power} kW`
                        : `${Math.round(device.power * 1000)} W`}
                    </span>
                  </div>
                </div>
                <button
                  className={`toggle-btn ${device.active ? (device.suggested_active !== false ? "btn-on" : "btn-on-suggested-off") : "btn-off"}`}
                  onClick={() => toggleDeviceActive(device.id)}
                >
                  <Power size={14} />
                  <span>
                    {device.active && device.suggested_active !== false
                      ? "ON"
                      : "OFF"}
                  </span>
                </button>
              </div>
            ))
          ) : (
            <div className="no-devices">
              No devices found for the selected filters.
            </div>
          )}
        </div>
        {/* Power Agent Report Popup */}
        {showAgentReport && (
          <div className="agent-report-overlay">
            <div className={`agent-report-modal glass-panel ${agentActions.limitExceeded ? "glow-magenta" : "glow-cyan"}`}>
              <div className="report-header">
                <Bot size={32} color={agentActions.limitExceeded ? "#ff0055" : "#00f3ff"} />
                <h3>
                  Power Agent <span className="report-status">Report</span>
                </h3>
              </div>

              <div className="report-content">
                <p className="report-summary">
                  {agentActions.limitExceeded ? (
                    <span style={{ color: "#ffbaba" }}>
                      Critical limit breach predicted. System is <strong>{agentActions.excessPower} kW</strong> above safe capacity. 
                      Load shifting has been applied.
                    </span>
                  ) : (
                    "System operating within safe limits. Optimization complete."
                  )}
                </p>

                {agentActions.limitExceeded ? (
                  <div className="actions-list">
                    <h4 className="actions-title">Devices Deactivated:</h4>
                    <ul>
                      {agentActions.turnedOff.map((name, i) => (
                        <li key={i} className="action-item">
                          <span className="action-bullet">●</span> {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <>
                    <div className="stats-summary-box" style={{ 
                      background: "rgba(0, 243, 255, 0.05)", 
                      padding: "1rem", 
                      borderRadius: "8px", 
                      border: "1px solid rgba(0, 243, 255, 0.2)",
                      marginTop: "1rem" 
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{ color: "#a0aec0" }}>Current Draw:</span>
                        <span style={{ color: "#fff", fontWeight: "bold" }}>{agentActions.currentPower} kW</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#a0aec0" }}>Forecasted Peak:</span>
                        <span style={{ color: "#00f3ff", fontWeight: "bold" }}>{agentActions.predictedPeak} kW</span>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "#63b3ed", marginTop: "1rem", fontStyle: "italic" }}>
                      * Optimization active. Continuing real-time monitoring.
                    </p>
                  </>
                )}
              </div>

              <button
                className="report-close-btn"
                onClick={() => setShowAgentReport(false)}
                style={{ border: agentActions.limitExceeded ? "1px solid #ff0055" : "" }}
              >
                {agentActions.limitExceeded ? "Acknowledge & Sync" : "Dismiss Report"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Search;
