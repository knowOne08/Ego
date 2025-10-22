import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

// Very simple rotating cube - minimal implementation
const RotatingCube = ({ color = '#4a90e2' }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// Minimal scene with just basic lighting and geometry
const MinimalScene = ({ className = '' }) => {
  return (
    <div className={`minimal-scene ${className}`} style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [10, 10, 10], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <RotatingCube color="#e74c3c" />
      </Canvas>
    </div>
  );
};

export default MinimalScene;
