import React, { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

// 🎬 CAMERA INTRO
const CameraIntro = ({ trigger }) => {
  const { camera } = useThree();
  const t = useRef(0);

  useEffect(() => {
    t.current = 0;
  }, [trigger]);

  useFrame((_, delta) => {
    if (t.current < 2) {
      t.current += delta;
      const p = Math.min(t.current / 2, 1);

      camera.position.lerpVectors(
        new THREE.Vector3(0, 12, 14),
        new THREE.Vector3(5, 6, 7),
        p
      );

      camera.lookAt(0, 1, 0);
    }
  });

  return null;
};

// 📊 AXES
const Axes = () => {
  const { camera } = useThree();
  const refs = [useRef(), useRef()]; // 🔥 only 2 refs now

  useFrame(() => {
    refs.forEach(r => r.current?.lookAt(camera.position));
  });

  return (
    <group>
      <Text ref={refs[0]} position={[4,0.5,3]} fontSize={0.3} color="#00ffff">
        TIME
      </Text>

      <Text ref={refs[1]} position={[-4,0.5,-2]} fontSize={0.3} color="#00ffff">
        MONTH
      </Text>
    </group>
  );
};

// 🌊 TERRAIN (FIXED + FLOATING)
const PowerTerrain = ({ dataMatrix, maxPower }) => {
  const meshRef = useRef();
  const baseHeights = useRef([]);

  const geometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(8, 4, 59, 29);
    const pos = geom.attributes.position;
    baseHeights.current = [];

    for (let j = 0; j < 30; j++) {
      for (let i = 0; i < 60; i++) {

        const m = Math.floor((j/29)*11);
        const h = Math.floor((i/59)*23);
        const val = dataMatrix[m]?.[h] || 0;

        const norm = maxPower ? val/maxPower : 0;
        const height = Math.pow(norm,0.6)*6;

        pos.setZ(j*60+i, height);
        baseHeights.current.push(height);
      }
    }

    geom.computeVertexNormals();
    return geom;
  }, [dataMatrix, maxPower]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pos = meshRef.current.geometry.attributes.position;

    // 🌊 smooth wave
    for (let i = 0; i < pos.count; i++) {
      const base = baseHeights.current[i];
      const x = pos.getX(i);
      const y = pos.getY(i);

      const wave =
        Math.sin(x * 0.8 + t * 1.5) * 0.15 +
        Math.cos(y * 0.8 + t * 1.2) * 0.1;

      pos.setZ(i, base + wave);
    }

    pos.needsUpdate = true;

    // 🔥 FLOATING EFFECT (NEW)
    meshRef.current.position.y = 0.06 + Math.sin(t * 1.2) * 0.01;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI/2,0,0]}
      position={[0,0.06,0]} // 🔥 raised
    >
      <meshStandardMaterial
        color="#00ffff"
        emissive="#00ffff"
        emissiveIntensity={0.45}
      />
    </mesh>
  );
};

// 🔥 MAIN
export default function CompanyPowerGraph({ company }) {
  const [data,setData]=useState([]);

  useEffect(()=>{
    Papa.parse('/power_data.csv',{
      download:true,
      header:true,
      dynamicTyping:true,
      complete:(res)=>setData(res.data)
    });
  },[]);

  const {matrix,maxPower}=useMemo(()=>{
    const filtered=data.filter(d=>d.company_name===company);
    const lookup={}; let max=0;

    filtered.forEach(d=>{
      const m=new Date(d.date).getMonth();
      const h=parseInt(d.timestamp?.split(':')[0]||0);

      lookup[m]??={};
      lookup[m][h]=(lookup[m][h]||0)+(d.power_consumption||0);

      if(lookup[m][h]>max) max=lookup[m][h];
    });

    return {
      matrix:Array.from({length:12},(_,m)=>
        Array.from({length:24},(_,h)=>lookup[m]?.[h]||0)
      ),
      maxPower:max
    };
  },[data,company]);

  return (
    <div style={{width:'100%', height:'100%', minHeight:'300px'}}>
      <Canvas camera={{ position:[0,12,14], fov:50 }}>
        
        <CameraIntro trigger={company} />

        <ambientLight intensity={0.7}/>
        <pointLight position={[5,10,5]} intensity={2} color="#00ffff"/>

        <EffectComposer>
          <Bloom intensity={1.3} luminanceThreshold={0.2}/>
        </EffectComposer>

        {matrix.length>0 && (
          <>
            <PowerTerrain dataMatrix={matrix} maxPower={maxPower}/>
            <Axes/>
          </>
        )}

        {/* 🔥 improved grid */}
        <gridHelper args={[12,12,'#00ffff','#001a1a']} />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          target={[0,1,0]}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
    </div>
  );
}