import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Environment, Stars } from '@react-three/drei';

// Rocket component - procedurally generated
const ProceduralRocket = ({ 
  position = [0, 0, 0], 
  scale = 1, 
  config = { primaryColor: "#e0e0e0", secondaryColor: "#ff4444", hasExhaust: true, showPCB: true } 
}) => {
  const rocketRef = useRef();
  const exhaustRef = useRef();

  useFrame((state) => {
    // Gentle floating animation
    if (rocketRef.current) {
      rocketRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      rocketRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
    
    // Exhaust animation
    if (exhaustRef.current && config.hasExhaust) {
      exhaustRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.3;
      exhaustRef.current.material.opacity = 0.7 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });

  return (
    <group ref={rocketRef} position={position} scale={scale}>
      {/* Rocket Body */}
      <mesh>
        <cylinderGeometry args={[0.15, 0.15, 2, 8]} />
        <meshStandardMaterial color={config.primaryColor} metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Nose Cone */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0, 0.15, 0.4, 8]} />
        <meshStandardMaterial color={config.secondaryColor} metalness={0.6} roughness={0.3} />
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
      
      {/* Engine Exhaust */}
      {config.hasExhaust && (
        <mesh ref={exhaustRef} position={[0, -1.3, 0]}>
          <cylinderGeometry args={[0.1, 0.05, 0.4, 8]} />
          <meshStandardMaterial 
            color="#00aaff" 
            transparent 
            opacity={0.7}
            emissive="#0066cc"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
      
      {/* PCB Board (representing flight computer) */}
      {config.showPCB && (
        <>
          <mesh position={[0, 0.3, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.25, 0.15, 0.02]} />
            <meshStandardMaterial color="#006600" metalness={0.3} roughness={0.7} />
          </mesh>
          
          {/* Components on PCB */}
          {[-0.08, 0, 0.08].map((x, i) => (
            <mesh key={i} position={[x, 0.3, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
              <boxGeometry args={[0.03, 0.03, 0.01]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
};

// Satellite/PCB component
const ProceduralSatellite = ({ 
  position = [0, 0, 0], 
  scale = 1, 
  config = { primaryColor: "#cccccc", secondaryColor: "#001a4d", hasSolarPanels: true, showAntenna: true } 
}) => {
  const satelliteRef = useRef();
  const panelsRef = useRef();

  useFrame((state) => {
    if (satelliteRef.current) {
      satelliteRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
    if (panelsRef.current) {
      panelsRef.current.children.forEach((panel, i) => {
        panel.rotation.z = Math.sin(state.clock.elapsedTime + i) * 0.1;
      });
    }
  });

  return (
    <group ref={satelliteRef} position={position} scale={scale}>
      {/* Main Body */}
      <mesh>
        <boxGeometry args={[0.8, 0.4, 0.6]} />
        <meshStandardMaterial color={config.primaryColor} metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Solar Panels */}
      {config.hasSolarPanels && (
        <group ref={panelsRef}>
          {[-1.2, 1.2].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]}>
              <boxGeometry args={[0.6, 1.2, 0.02]} />
              <meshStandardMaterial color={config.secondaryColor} metalness={0.1} roughness={0.9} />
            </mesh>
          ))}
        </group>
      )}
      
      {/* Antenna */}
      {config.showAntenna && (
        <>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.6, 8]} />
            <meshStandardMaterial color="#ff6600" metalness={0.7} roughness={0.3} />
          </mesh>
          
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color="#ff6600" metalness={0.7} roughness={0.3} />
          </mesh>
        </>
      )}
    </group>
  );
};

// Circuit Board component
const ProceduralCircuitBoard = ({ 
  position = [0, 0, 0], 
  scale = 1, 
  config = { primaryColor: "#006600", secondaryColor: "#333333", hasComponents: true, showSensors: true } 
}) => {
  const boardRef = useRef();

  useFrame((state) => {
    if (boardRef.current) {
      boardRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      boardRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <group ref={boardRef} position={position} scale={scale}>
      {/* PCB Base */}
      <mesh>
        <boxGeometry args={[2, 1.5, 0.05]} />
        <meshStandardMaterial color={config.primaryColor} metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Components */}
      {config.hasComponents && Array.from({ length: 12 }, (_, i) => {
        const x = (Math.random() - 0.5) * 1.8;
        const y = (Math.random() - 0.5) * 1.3;
        const size = Math.random() * 0.1 + 0.05;
        return (
          <mesh key={i} position={[x, y, 0.04]}>
            <boxGeometry args={[size, size, size]} />
            <meshStandardMaterial color={config.secondaryColor} />
          </mesh>
        );
      })}
      
      {/* Traces (simple lines) */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, (i - 4) * 0.15, 0.026]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[1.8, 0.01, 0.001]} />
          <meshStandardMaterial color="#ccaa00" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
};

// Floating particles for atmosphere
const FloatingParticles = ({ count = 50 }) => {
  const particlesRef = useRef();
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ],
        speed: Math.random() * 0.01 + 0.005
      });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.children.forEach((particle, i) => {
        particle.position.y += particles[i].speed;
        if (particle.position.y > 10) {
          particle.position.y = -10;
        }
      });
    }
  });

  return (
    <group ref={particlesRef}>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.3}
            emissive="#ffffff"
            emissiveIntensity={0.1}
          />
        </mesh>
      ))}
    </group>
  );
};

// Main scene component
const AerospaceScene = ({ 
  projectType = 'rocket', 
  className = '', 
  project = null 
}) => {
  // Get 3D scene configuration from project data
  const getSceneConfig = () => {
    const defaultConfig = {
      type: projectType,
      primaryColor: "#e0e0e0",
      secondaryColor: "#ff4444",
      hasExhaust: true,
      showPCB: true
    };
    
    return project?.scene3D ? { ...defaultConfig, ...project.scene3D } : defaultConfig;
  };

  const config = getSceneConfig();

  const getSceneComponents = () => {
    switch (config.type) {
      case 'satellite':
        return (
          <>
            <ProceduralSatellite position={[0, 0, 0]} scale={1.2} config={config} />
            <ProceduralCircuitBoard position={[3, -1, -2]} scale={0.8} config={config} />
          </>
        );
      case 'pcb':
        return (
          <>
            <ProceduralCircuitBoard position={[0, 0, 0]} scale={1.5} config={config} />
            <ProceduralSatellite position={[-3, 2, -2]} scale={0.6} config={config} />
          </>
        );
      default: // rocket
        return (
          <>
            <ProceduralRocket position={[0, 0, 0]} scale={1.5} config={config} />
            <ProceduralCircuitBoard position={[3, -2, -1]} scale={0.6} config={config} />
            <ProceduralSatellite position={[-3, 1, -3]} scale={0.4} config={config} />
          </>
        );
    }
  };

  return (
    <div className={`aerospace-scene ${className}`} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [5, 2, 5], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[-10, -10, -5]} intensity={0.3} color="#0066ff" />
        
        {/* Environment */}
        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade />
        <Environment preset="night" />
        
        {/* Scene Objects */}
        <Float speed={1.4} rotationIntensity={0.5} floatIntensity={0.2}>
          {getSceneComponents()}
        </Float>
        
        {/* Atmospheric particles */}
        <FloatingParticles count={30} />
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
};

export default AerospaceScene;
