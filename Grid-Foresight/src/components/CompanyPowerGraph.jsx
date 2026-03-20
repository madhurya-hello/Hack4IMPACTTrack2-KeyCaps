import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';

const neonCyan = '#00FFFF';
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// --- Clean Cyber Button (No absolute positioning) ---
const CyberButton = ({ onClick, children, style }) => (
    <button 
        onClick={onClick}
        style={{
            background: 'rgba(0, 255, 255, 0.05)',
            color: neonCyan,
            border: `1px solid ${neonCyan}`,
            padding: '10px 20px',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.3s',
            ...style
        }}
    >
        {children}
    </button>
);

const PowerTerrain = ({ dataMatrix, maxPower }) => {
    const [hovered, setHovered] = useState(null);

    const geometry = useMemo(() => {
        const detailX = 60; 
        const detailY = 30; 
        const geom = new THREE.PlaneGeometry(24, 12, detailX - 1, detailY - 1);
        const vertices = geom.attributes.position;

        for (let j = 0; j < detailY; j++) {
            const mIdx = (j / (detailY - 1)) * 11;
            const mLow = Math.floor(mIdx), mHigh = Math.ceil(mIdx), mWeight = mIdx - mLow;
            for (let i = 0; i < detailX; i++) {
                const hIdx = (i / (detailX - 1)) * 23;
                const hLow = Math.floor(hIdx), hHigh = Math.ceil(hIdx), hWeight = hIdx - hLow;

                const v00 = dataMatrix[mLow]?.[hLow] || 0;
                const v01 = dataMatrix[mLow]?.[hHigh] || 0;
                const v10 = dataMatrix[mHigh]?.[hLow] || 0;
                const v11 = dataMatrix[mHigh]?.[hHigh] || 0;

                const interpVal = (v00 * (1 - hWeight) * (1 - mWeight)) +
                                 (v01 * hWeight * (1 - mWeight)) +
                                 (v10 * (1 - hWeight) * mWeight) +
                                 (v11 * hWeight * mWeight);

                const height = maxPower > 0 ? (interpVal / maxPower) * 5 : 0;
                vertices.setZ(j * detailX + i, height);
            }
        }
        geom.computeVertexNormals();
        return geom;
    }, [dataMatrix, maxPower]);

    return (
        <group>
            {/* 3D Axis Labels */}
            <Text position={[0, -1, 7]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.6} color={neonCyan}>TIME (00:00 - 23:00)</Text>
            <Text position={[-13.5, -1, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} fontSize={0.6} color={neonCyan}>MONTH (JAN - DEC)</Text>
            
            <mesh 
                geometry={geometry} 
                rotation={[-Math.PI / 2, 0, 0]} 
                onPointerMove={(e) => {
                    const h = Math.round(((e.point.x + 12) / 24) * 23);
                    const m = Math.round(((e.point.z + 6) / 12) * 11);
                    if(dataMatrix[m]) setHovered({ x: e.point.x, y: e.point.y, z: e.point.z, h, m, val: dataMatrix[m][h] });
                }}
                onPointerOut={() => setHovered(null)}
            >
                <meshStandardMaterial color="#050a10" emissive="#001525" roughness={0.1} metalness={0.9} />
            </mesh>
            
            <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <meshBasicMaterial color={neonCyan} wireframe transparent opacity={0.1} />
            </mesh>

            {hovered && (
                <Html position={[hovered.x, hovered.y + 0.5, hovered.z]} center style={{ pointerEvents: 'none' }}>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.9)', color: neonCyan, border: `1px solid ${neonCyan}`,
                        padding: '8px', fontFamily: 'monospace', fontSize: '12px', width: '100px', textAlign: 'center'
                    }}>
                        <strong>{monthNames[hovered.m]}</strong><br/>
                        {hovered.h}:00<br/>
                        {hovered.val?.toFixed(2)} kW
                    </div>
                </Html>
            )}
        </group>
    );
};

const CompanyPowerGraph = () => {
    const [data, setData] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [selection, setSelection] = useState(null);

    useEffect(() => {
        Papa.parse('/power_data.csv', {
            download: true, header: true, dynamicTyping: true,
            complete: (res) => {
                const unique = [...new Set(res.data.map(r => r.company_name))].filter(Boolean);
                setCompanies(unique);
                setData(res.data);
            }
        });
    }, []);

    const { matrix, maxPower } = useMemo(() => {
        if (!selection) return { matrix: [], maxPower: 0 };
        const filtered = data.filter(d => d.company_name === selection);
        let max = 0;
        const m = Array.from({ length: 12 }, (_, monthIdx) => 
            Array.from({ length: 24 }, (_, hourIdx) => {
                const entry = filtered.find(d => {
                    const date = new Date(d.date);
                    const hour = d.timestamp ? parseInt(d.timestamp.split(':')[0]) : 0;
                    return date.getMonth() === monthIdx && hour === hourIdx;
                });
                const val = entry?.power_consumption || 0;
                if (val > max) max = val;
                return val;
            })
        );
        return { matrix: m, maxPower: max };
    }, [selection, data]);

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 100px)', background: '#000', position: 'relative' }}>
            {!selection ? (
                <div style={{ padding: '20px' }}>
                    <h2 style={{ color: neonCyan, marginBottom: '20px', fontFamily: 'monospace' }}>UNIT SELECTION</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                        {companies.map(c => <CyberButton key={c} onClick={() => setSelection(c)}>{c}</CyberButton>)}
                    </div>
                </div>
            ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '15px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>{selection.toUpperCase()}</span>
                            <div style={{ color: neonCyan, fontSize: '10px' }}>POWER ANALYSIS CORE</div>
                        </div>
                        <CyberButton onClick={() => setSelection(null)}>CLOSE VIEW</CyberButton>
                    </div>

                    <div style={{ flex: 1 }}>
                        <Canvas camera={{ position: [15, 12, 15], fov: 45 }}>
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 15, 10]} intensity={2} color={neonCyan} />
                            <PowerTerrain dataMatrix={matrix} maxPower={maxPower} />
                            <gridHelper args={[30, 15, '#222', '#111']} position={[0, -0.1, 0]} />
                            <OrbitControls makeDefault />
                        </Canvas>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyPowerGraph;