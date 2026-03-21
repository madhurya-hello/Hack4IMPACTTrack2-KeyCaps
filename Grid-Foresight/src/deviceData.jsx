import { Monitor, Plug, Printer, Scan, Wind, Laptop, Tv, Battery, Speaker, Tablet, Router, Lightbulb, Camera, Phone, Lamp } from 'lucide-react';
import React from 'react';

const GADGETS_TEMPLATE = [
    { type: "Desktop PC", icon: <Monitor size={20} />, iconLg: <Monitor size={32} />, power: 0.25 },
    { type: "Paper Shredder", icon: <Plug size={20} />, iconLg: <Plug size={32} />, power: 0.20 },
    { type: "Inkjet Printer", icon: <Printer size={20} />, iconLg: <Printer size={32} />, power: 0.15 },
    { type: "Flat Scanner", icon: <Scan size={20} />, iconLg: <Scan size={32} />, power: 0.12 },
    { type: "Ceiling Fan", icon: <Wind size={20} />, iconLg: <Wind size={32} />, power: 0.08 },
    { type: "Laptop", icon: <Laptop size={20} />, iconLg: <Laptop size={32} />, power: 0.06 },
    { type: "LED Monitor", icon: <Tv size={20} />, iconLg: <Tv size={32} />, power: 0.04 },
    { type: "Docking Station", icon: <Battery size={20} />, iconLg: <Battery size={32} />, power: 0.04 },
    { type: "PC Speakers", icon: <Speaker size={20} />, iconLg: <Speaker size={32} />, power: 0.02 },
    { type: "Tablet", icon: <Tablet size={20} />, iconLg: <Tablet size={32} />, power: 0.02 },
    { type: "WiFi Router", icon: <Router size={20} />, iconLg: <Router size={32} />, power: 0.01 },
    { type: "LED Bulb", icon: <Lightbulb size={20} />, iconLg: <Lightbulb size={32} />, power: 0.01 },
    { type: "Security Cam", icon: <Camera size={20} />, iconLg: <Camera size={32} />, power: 0.01 },
    { type: "Phone Charger", icon: <Plug size={20} />, iconLg: <Plug size={32} />, power: 0.01 },
    { type: "VOIP Phone", icon: <Phone size={20} />, iconLg: <Phone size={32} />, power: 0.01 },
    { type: "Desk Lamp", icon: <Lamp size={20} />, iconLg: <Lamp size={32} />, power: 0.01 }
];

export const COMPANIES = ["Tech Nova", "Green Grid", "Solaris Co"];

const generateCompanyRooms = (numRooms) => {
    const rooms = [];
    for (let i = 1; i <= numRooms; i++) {
        rooms.push(`Room ${String(i).padStart(3, '0')}`);
    }
    return rooms;
};

export const COMPANY_INFO = {
    "Solaris Co": {
        rooms: generateCompanyRooms(12),
        multiplier: 6 // Max power ~6.24 kW
    },
    "Tech Nova": {
        rooms: generateCompanyRooms(18),
        multiplier: 9 // Max power ~9.36 kW
    },
    "Green Grid": {
        rooms: generateCompanyRooms(36),
        multiplier: 18 // Max power ~18.72 kW
    }
};

export const generateGlobalDevices = () => {
    const data = {};

    COMPANIES.forEach(company => {
        let allDevices = [];
        const { rooms, multiplier } = COMPANY_INFO[company];

        GADGETS_TEMPLATE.forEach(g => {
            for (let i = 0; i < multiplier; i++) {
                allDevices.push({
                    ...g,
                    active: Math.random() > 0.4, // randomly ON or OFF
                    label: `${g.type} ${i + 1}`
                });
            }
        });

        // We shuffle minimally
        for (let i = allDevices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allDevices[i], allDevices[j]] = [allDevices[j], allDevices[i]];
        }

        const roomData = {};
        rooms.forEach((room, index) => {
            roomData[room] = allDevices.slice(index * 8, (index + 1) * 8).map((d, i) => ({
                ...d,
                id: `dev-${company.replace(/\s/g, '')}-${room.replace(/\s/g, '')}-${i}`
            }));
        });
        
        data[company] = roomData;
    });

    return data;
};

// Singleton instance to be used by all components initially, acting effectively as global state.
export const globalRoomDevices = generateGlobalDevices();

export const calculateTotalPower = (roomDevicesMap) => {
    let total = 0;
    Object.values(roomDevicesMap).forEach(roomDevices => {
        roomDevices.forEach(device => {
            if (device.active) {
                total += device.power;
            }
        });
    });
    return total;
};

// Also list types for Sidebar Search filtering
export const gadgetTypes = GADGETS_TEMPLATE.map(t => ({
    id: t.type,
    label: t.type,
    icon: t.icon
}));
