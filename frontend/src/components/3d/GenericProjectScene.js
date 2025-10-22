import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Abstract geometric shape for general projects
const AbstractGeometry = ({ position = [0, 0, 0], scale = 1, color = '#4a90e2' }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color={color} 
        metalness={0.7} 
        roughness={0.3}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

// Data visualization nodes
const DataNode = ({ position, color = '#00ff88' }) => {
  const nodeRef = useRef();

  useFrame((state) => {
    if (nodeRef.current) {
      nodeRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1);
    }
  });

  return (
    <mesh ref={nodeRef} position={position}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

// Network connections between nodes
const NetworkConnection = ({ start, end, opacity = 0.3 }) => {
  const lineRef = useRef();
  
  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);

  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.material.opacity = opacity + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#00aaff" transparent opacity={opacity} />
    </line>
  );
};

// Web development themed scene
const WebDevScene = () => {
  const nodes = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 8
      ],
      color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][i % 5]
    }));
  }, []);

  return (
    <>
      {/* Data nodes */}
      {nodes.map((node, i) => (
        <DataNode key={i} position={node.position} color={node.color} />
      ))}
      
      {/* Network connections */}
      {nodes.slice(0, 8).map((node, i) => (
        <NetworkConnection 
          key={i}
          start={node.position}
          end={nodes[(i + 1) % nodes.length].position}
          opacity={0.2}
        />
      ))}
      
      {/* Central abstract geometry */}
      <AbstractGeometry position={[0, 0, 0]} scale={1.2} color="#4a90e2" />
      <AbstractGeometry position={[3, 1, -2]} scale={0.6} color="#e74c3c" />
      <AbstractGeometry position={[-3, -1, 2]} scale={0.8} color="#2ecc71" />
    </>
  );
};

// Machine Learning themed scene
const MLScene = () => {
  const networkLayers = useMemo(() => {
    return [
      { nodes: 4, x: -3, color: '#ff6b6b' },
      { nodes: 6, x: -1, color: '#4ecdc4' },
      { nodes: 8, x: 1, color: '#45b7d1' },
      { nodes: 4, x: 3, color: '#96ceb4' }
    ];
  }, []);

  return (
    <>
      {networkLayers.map((layer, layerIndex) => (
        <group key={layerIndex}>
          {Array.from({ length: layer.nodes }, (_, nodeIndex) => {
            const y = (nodeIndex - layer.nodes / 2) * 0.8;
            return (
              <DataNode 
                key={nodeIndex}
                position={[layer.x, y, 0]} 
                color={layer.color} 
              />
            );
          })}
        </group>
      ))}
      
      {/* Neural connections */}
      {networkLayers.slice(0, -1).map((layer, layerIndex) => (
        <group key={layerIndex}>
          {Array.from({ length: layer.nodes }, (_, i) => (
            Array.from({ length: networkLayers[layerIndex + 1].nodes }, (_, j) => (
              <NetworkConnection
                key={`${i}-${j}`}
                start={[layer.x, (i - layer.nodes / 2) * 0.8, 0]}
                end={[networkLayers[layerIndex + 1].x, (j - networkLayers[layerIndex + 1].nodes / 2) * 0.8, 0]}
                opacity={0.1}
              />
            ))
          ))}
        </group>
      ))}
      
      <AbstractGeometry position={[0, 3, -2]} scale={0.8} color="#9b59b6" />
    </>
  );
};

// Generic project scene
const GenericProjectScene = ({ projectCategory = 'web', className = '' }) => {
  const getSceneContent = () => {
    switch (projectCategory.toLowerCase()) {
      case 'machine learning':
      case 'ai':
      case 'data science':
        return <MLScene />;
      case 'web':
      case 'frontend':
      case 'backend':
        return <WebDevScene />;
      default:
        return (
          <>
            <AbstractGeometry position={[0, 0, 0]} scale={1.5} color="#4a90e2" />
            <AbstractGeometry position={[3, 1, -2]} scale={0.8} color="#e74c3c" />
            <AbstractGeometry position={[-3, -1, 2]} scale={1.0} color="#2ecc71" />
            <AbstractGeometry position={[1, -2, 1]} scale={0.6} color="#f39c12" />
          </>
        );
    }
  };

  return (
    <div className={`project-scene ${className}`} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [6, 3, 6], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={0.7} />
        <pointLight position={[-10, -10, -5]} intensity={0.4} color="#0066ff" />
        <spotLight position={[0, 10, 0]} intensity={0.5} color="#ffffff" />
        
        {/* Environment */}
        <Stars radius={100} depth={50} count={800} factor={3} saturation={0} fade />
        <Environment preset="sunset" />
        
        {/* Scene Content */}
        <Float speed={1.0} rotationIntensity={0.3} floatIntensity={0.2}>
          {getSceneContent()}
        </Float>
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
};

export default GenericProjectScene;
