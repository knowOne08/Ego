import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Simple Rocket component without external dependencies
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

// Floating animation group (custom implementation)
const FloatingGroup = ({ children, speed = 1, intensity = 0.2 }) => {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * speed) * intensity;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.1;
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

// Simple camera rotation (avoiding drei dependency)
const CameraControls = () => {
  const ref = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      // Simple auto-rotation around the scene
      state.camera.position.x = Math.cos(state.clock.elapsedTime * 0.1) * 6;
      state.camera.position.z = Math.sin(state.clock.elapsedTime * 0.1) * 6;
      state.camera.lookAt(0, 0, 0);
    }
  });
  
  return <group ref={ref} />;
};

// Main StableAerospace Scene
const StableAerospaceScene = ({ 
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
        camera={{ position: [12, 8, 12], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Camera controls */}
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={8}
            maxDistance={30}
          />
          
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />
          <pointLight position={[-10, -10, -5]} intensity={0.3} color="#0066ff" />
        
        {/* Scene Objects with floating animation */}
        <FloatingGroup speed={1.0} intensity={0.2}>
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
        </FloatingGroup>
        
          {/* Camera controls */}
          <CameraControls />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default StableAerospaceScene;
