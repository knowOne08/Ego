import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import './pcbViewerGif.css';

// Component that loads and animates the 3D model
function RotatingModel({ modelPath }) {
  const groupRef = useRef();
  const [centered, setCentered] = useState(false);
  const [loadError, setLoadError] = useState(false);
  
  // Detect theme mode
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Load the GLTF model - hooks must be called unconditionally
  const gltf = useLoader(GLTFLoader, modelPath);
  
  // Center the model on mount and adjust materials for theme
  useEffect(() => {
    if (gltf && gltf.scene && groupRef.current && !centered && !loadError) {
      try {
        const model = gltf.scene;
        
        // Compute bounding box to find the geometric center
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Move the GROUP to compensate for the model's off-center origin
        groupRef.current.position.copy(center.negate());
        
        // Adjust materials based on theme
        model.traverse((child) => {
          if (child.isMesh && child.material) {
            // Clone material to avoid affecting other instances
            child.material = child.material.clone();
            
            if (!isDarkMode) {
              // Light mode adjustments - make model much darker and sharper
              if (child.material.color) {
                child.material.color.multiplyScalar(0.15); // Much darker - 85% reduction
              }
              if (child.material.emissive) {
                child.material.emissive.multiplyScalar(0.1);
              }
              
              // Increase metalness and roughness for better contrast
              if (child.material.metalness !== undefined) {
                child.material.metalness = Math.min(child.material.metalness + 0.4, 1.0);
              }
              if (child.material.roughness !== undefined) {
                child.material.roughness = Math.max(child.material.roughness - 0.3, 0.1);
              }
              
              // Add edge enhancement
              child.material.transparent = true;
              child.material.opacity = 0.95;
              
              // Force flat shading for sharper edges
              child.material.flatShading = true;
              
            } else {
              // Dark mode adjustments - enhance glow and brightness
              if (child.material.color) {
                child.material.color.multiplyScalar(1.4); // Brighter
              }
              if (child.material.emissive) {
                child.material.emissive.multiplyScalar(1.2);
              }
              
              // Enhance metallic look in dark mode
              if (child.material.metalness !== undefined) {
                child.material.metalness = Math.min(child.material.metalness + 0.2, 1.0);
              }
            }
            child.material.needsUpdate = true;
          }
        });
        
        setCentered(true);
        
        console.log('Model loaded and themed:', { 
          modelPath,
          isDarkMode,
          center: center.negate(), 
          size, 
          groupPosition: groupRef.current.position 
        });
      } catch (error) {
        console.error('Error centering model:', error);
        setLoadError(true);
      }
    }
  }, [gltf, centered, modelPath, loadError, isDarkMode]);
  
  // Animate rotation on X, Y, and Z axes
  useFrame((state, delta) => {
    if (groupRef.current && !loadError && gltf && gltf.scene) {
      groupRef.current.rotation.x += delta * 0.3; // Rotate on X
      groupRef.current.rotation.y += delta * 0.2; // Rotate on Y
      groupRef.current.rotation.z += delta * 0.4; // Rotate on Z
    }
  });
  
  // Return null if there's an error or no model loaded
  if (loadError || !gltf || !gltf.scene) {
    return null;
  }
  
  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} />
    </group>
  );
}

// Error-safe wrapper for the rotating model
function SafeRotatingModel({ modelPath }) {
  try {
    return <RotatingModel modelPath={modelPath} />;
  } catch (error) {
    console.error('Error in RotatingModel:', error);
    return null;
  }
}

// Error Boundary Component for 3D Model Loading
function ModelErrorBoundary({ children, onError }) {
  return (
    <React.Suspense fallback={
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: 'white',
        background: 'rgba(0,0,0,0.3)'
      }}>
        Loading 3D model...
      </div>
    }>
      {children}
    </React.Suspense>
  );
}

// Main PCB Viewer component
export default function PCBViewer({ modelPath, gifPath }) {
  const [modelError, setModelError] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  // Listen for theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);
  
  // If gifPath is provided, show GIF instead
  if (gifPath) {
    return (
      <div className="pcb-gif-container">
        <img 
          src={gifPath} 
          alt="PCB Animation" 
          className="pcb-gif-background"
        />
      </div>
    );
  }
  
  // If no modelPath or modelError, show fallback
  if (!modelPath || modelError) {
    return (
      <div className="pcb-viewer-container">
        {/* Plain background - no text */}
      </div>
    );
  }
  
  // Theme-aware lighting settings
  const lightingConfig = isDarkMode ? {
    ambientIntensity: 0.4,
    directional1Intensity: 1.0,
    directional2Intensity: 0.6,
    directional1Position: [5, 5, 5],
    directional2Position: [-5, -5, -5]
  } : {
    ambientIntensity: 0.1,  // Very low ambient for sharp contrast
    directional1Intensity: 2.5,  // Much stronger key light
    directional2Intensity: 1.5,  // Strong fill light
    directional1Position: [15, 15, 10],  // High angle key light
    directional2Position: [-10, -10, -8]  // Opposing fill light
  };
  
  // Show 3D viewer
  return (
    <div className="pcb-viewer-container">
      <ModelErrorBoundary onError={() => setModelError(true)}>
        <Canvas
          camera={{ position: [0, 0, 155], fov: 50 }}
          style={{ background: 'transparent' }}
          onError={() => setModelError(true)}
        >
          {/* Theme-aware lighting */}
          <ambientLight intensity={lightingConfig.ambientIntensity} />
          
          {/* Stronger directional lights for light mode */}
          <directionalLight 
            position={lightingConfig.directional1Position} 
            intensity={lightingConfig.directional1Intensity}
            castShadow={!isDarkMode}
          />
          <directionalLight 
            position={lightingConfig.directional2Position} 
            intensity={lightingConfig.directional2Intensity}
          />
          
          {/* Additional contrast lights for light mode */}
          {!isDarkMode && (
            <>
              <directionalLight 
                position={[0, -15, 8]} 
                intensity={1.2}
                color="#222222"
              />
              <directionalLight 
                position={[20, 0, 0]} 
                intensity={0.8}
                color="#333333"
              />
              <spotLight
                position={[0, 20, 10]}
                angle={0.3}
                penumbra={0.1}
                intensity={1.5}
                color="#444444"
                castShadow
              />
            </>
          )}
          
          {/* The rotating model */}
          <SafeRotatingModel modelPath={modelPath} />
        </Canvas>
      </ModelErrorBoundary>
    </div>
  );
}
