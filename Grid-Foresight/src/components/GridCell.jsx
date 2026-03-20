import React from 'react';



const GridCell = ({ gadget, onUpdate }) => {
  const { name, total_units, active_units, power, is_important } = gadget;

  // Dots logic based on total_units and active_units
  const dots = Array.from({ length: 100 }, (_, i) => {
    let color;
    if (i < active_units) {
      color = '#10b981'; // green
    } else if (i < total_units) {
      color = '#3b82f6'; // blue
    } else {
      color = '#ffffff'; // white
    }
    
    return (
      <div 
        key={i} 
        className="dot" 
        style={{ 
          backgroundColor: color
        }} 
      />
    );
  });

  return (
    <div className="grid-cell glass">
      <div className="cell-header">
        <h4>{name}</h4>
        <button 
          className={`important-btn ${is_important ? 'active' : ''}`}
          onClick={() => onUpdate({ is_important: !is_important })}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={is_important ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
          Important
        </button>
      </div>
      <div className="screen">
        {dots}
      </div>
      <div className="input-section">
        <label>
          <span>Total Units</span>
          <input 
            type="number" 
            value={total_units} 
            onChange={(e) => onUpdate({ total_units: parseInt(e.target.value) || 0 })} 
          />
        </label>
        <label>
          <span>Active Units</span>
          <input 
            type="number" 
            value={active_units} 
            onChange={(e) => onUpdate({ active_units: parseInt(e.target.value) || 0 })} 
          />
        </label>
        <label>
          <span>Power (kWh)</span>
          <input 
            type="number" 
            value={power} 
            onChange={(e) => onUpdate({ power: parseInt(e.target.value) || 0 })} 
          />
        </label>
      </div>
    </div>
  );
};

export default GridCell;
