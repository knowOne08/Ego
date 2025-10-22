import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Environment, Stars } from '@react-three/drei';

// Simple Rocket component - procedurally generated
const SimpleRocket = ({ 
  position = [0, 0, 0], 
  scale = 1, 
  primaryColor = "#e0e0e0",
  secondaryColor = "#ff4444"
}) => {
  const rocketRef = useRef();

  useFrame((state) => {
    if (rocketRef.current) {
      rocketRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      rocketRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={rocketRef} position={position} scale={scale}>
      {/* Rocket Body */}
      <mesh>
        <cylinderGeometry args={[0.15, 0.15, 2, 8]} />
        <meshStandardMaterial color={primaryColor} metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Nose Cone */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0, 0.15, 0.4, 8]} />
        <meshStandardMaterial color={secondaryColor} metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Fins */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i * Math.PI) / 2) * 0.2,
            -0.7,
            Math.sin((i * Math.PI) / 2) * 0.2
          ]}
          rotation={[0, (i * Math.PI) / 2, 0]}
        >
          <boxGeometry args={[0.05, 0.6, 0.3]} />
          <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
};

// Simple PCB Board
const SimplePCB = ({ 
  position = [0, 0, 0], 
  scale = 1,
  primaryColor = "#006600"
}) => {
  const boardRef = useRef();

  useFrame((state) => {
    if (boardRef.current) {
      boardRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={boardRef} position={position} scale={scale}>
      <mesh>
        <boxGeometry args={[1.5, 1, 0.05]} />
        <meshStandardMaterial color={primaryColor} metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Simple components */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[(i - 2.5) * 0.2, 0, 0.04]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      ))}
    </group>
  );
};

// Main Fixed Aerospace Scene
const FixedAerospaceScene = ({ 
  projectType = 'rocket', 
  className = '', 
  project = null 
}) => {
  // Get colors from project configuration
  const getProjectColors = () => {
    if (project?.scene3D) {
      return {
        primary: project.scene3D.primaryColor || "#e0e0e0",
        secondary: project.scene3D.secondaryColor || "#ff4444"
      };
    }
    return { primary: "#e0e0e0", secondary: "#ff4444" };
  };

  const colors = getProjectColors();

  return (
    <div className={`aerospace-scene ${className}`} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [8, 4, 8], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />
          <pointLight position={[-10, -10, -5]} intensity={0.3} color="#0066ff" />
          
          {/* Environment */}
          <Stars radius={100} depth={50} count={800} factor={3} saturation={0} fade />
          <Environment preset="night" />
          
          {/* Scene Objects */}
          <Float speed={1.0} rotationIntensity={0.3} floatIntensity={0.2}>
            <SimpleRocket 
              position={[0, 0, 0]} 
              scale={1.5} 
              primaryColor={colors.primary}
              secondaryColor={colors.secondary}
            />
            <SimplePCB 
              position={[3, -1, -2]} 
              scale={0.8}
              primaryColor="#006600"
            />
          </Float>
          
          {/* Controls */}
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 4}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default FixedAerospaceScene;
