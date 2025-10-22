import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

// GLB Model Component with animations and better error handling
const GLBModel = ({ 
  modelPath, 
  position = [0, 0, 30], 
  scale = 0.5, 
  animationType = 'complexRotation',
  animationSpeed = 1
}) => {
  const meshRef = useRef();
  const [scene, setScene] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load GLB file manually with better error handling
  useEffect(() => {
    const loader = new GLTFLoader();
    
    const loadModel = async () => {
      try {
        // First check if file exists
        const response = await fetch(modelPath, { method: 'HEAD' });
        if (!response.ok) {
          setError('GLB file not found');
          setLoading(false);
          return;
        }

        // Load the GLB file
        loader.load(
          modelPath,
          (gltf) => {
            const loadedScene = gltf.scene;
            
            // Center the model
            const box = new THREE.Box3().setFromObject(loadedScene);
            const center = box.getCenter(new THREE.Vector3());
            loadedScene.position.sub(center);
            
            // Ensure materials are visible
            loadedScene.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                  child.material.needsUpdate = true;
                }
              }
            });
            
            setScene(loadedScene);
            setLoading(false);
            setError(null);
          },
          (progress) => {
            // Loading progress
            console.log('Loading GLB:', (progress.loaded / progress.total * 100) + '%');
          },
          (error) => {
            console.warn('Error loading GLB file:', modelPath, error);
            setError('Failed to load GLB file');
            setLoading(false);
          }
        );
      } catch (error) {
        console.warn('GLB file check failed:', modelPath, error);
        setError('GLB file not available');
        setLoading(false);
      }
    };

    loadModel();
  }, [modelPath]);



  // Animation frame
  useFrame((state) => {
    if (meshRef.current && !loading && !error) {
      const time = state.clock.elapsedTime * animationSpeed;
      
      switch (animationType) {
        case 'rotate':
          meshRef.current.rotation.x = time * 0.2;
          meshRef.current.rotation.y = time * 0.3;
          break;
        case 'float':
          meshRef.current.position.y = position[1] + Math.sin(time) * 0.3;
          meshRef.current.rotation.y = time * 0.1;
          break;
        case 'orbit':
          meshRef.current.position.x = position[0] + Math.cos(time * 0.5) * 2;
          meshRef.current.position.z = position[2] + Math.sin(time * 0.5) * 2;
          meshRef.current.lookAt(0, 0, 0);
          break;
        case 'pulse':
          const pulse = 1 + Math.sin(time * 2) * 0.1;
          meshRef.current.scale.setScalar(scale * pulse);
          meshRef.current.rotation.y = time * 0.2;
          break;
        case 'complexRotation':
          // Multi-axis rotation with different speeds and sine wave modulation
          meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.3 + time * 0.1;
          meshRef.current.rotation.y = time * 0.4 + Math.cos(time * 0.3) * 0.2;
          meshRef.current.rotation.z = Math.sin(time * 0.7) * 0.15;
          // Subtle floating motion
          meshRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.2;
          break;
        case 'figure8':
          // Figure-8 motion pattern
          meshRef.current.position.x = position[0] + Math.sin(time * 0.8) * 2;
          meshRef.current.position.y = position[1] + Math.sin(time * 1.6) * 1;
          meshRef.current.rotation.y = time * 0.5;
          meshRef.current.rotation.z = Math.sin(time * 0.8) * 0.1;
          break;
        case 'wobble':
          // Wobbling motion like a spinning top
          const wobbleIntensity = Math.sin(time * 0.3) * 0.2 + 0.1;
          meshRef.current.rotation.x = Math.sin(time * 2) * wobbleIntensity;
          meshRef.current.rotation.z = Math.cos(time * 2.3) * wobbleIntensity;
          meshRef.current.rotation.y = time * 0.8;
          break;
        case 'dance':
          // Rhythmic dancing motion
          meshRef.current.position.y = position[1] + Math.abs(Math.sin(time * 2)) * 0.5;
          meshRef.current.rotation.x = Math.sin(time * 3) * 0.2;
          meshRef.current.rotation.y = time * 0.6 + Math.sin(time * 4) * 0.3;
          meshRef.current.rotation.z = Math.cos(time * 2.5) * 0.1;
          const scaleVariation = 1 + Math.sin(time * 4) * 0.05;
          meshRef.current.scale.setScalar(scale * scaleVariation);
          break;
        case 'spiral':
          // Spiral upward motion
          const spiralRadius = 1.5;
          const spiralHeight = Math.sin(time * 0.5) * 2;
          meshRef.current.position.x = position[0] + Math.cos(time) * spiralRadius;
          meshRef.current.position.z = position[2] + Math.sin(time) * spiralRadius;
          meshRef.current.position.y = position[1] + spiralHeight;
          meshRef.current.rotation.y = -time;
          break;
        default:
          meshRef.current.rotation.y = time * 0.1;
      }
    }
  });

  if (loading) {
    return (
      <mesh ref={meshRef} position={position} scale={scale}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#ffd700" wireframe />
      </mesh>
    );
  }

  if (error) {
    console.warn('GLB loading failed, using fallback geometry:', error);
    return (
      <mesh ref={meshRef} position={position} scale={scale}>
        <boxGeometry args={[2, 1, 0.5]} />
        <meshStandardMaterial color="#ff6b6b" opacity={0.7} transparent />
      </mesh>
    );
  }

  if (!scene) {
    return (
      <mesh ref={meshRef} position={position} scale={scale}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#888" wireframe />
      </mesh>
    );
  }

  return (
    <primitive 
      ref={meshRef} 
      object={scene.clone()} 
      position={position} 
      scale={scale} 
    />
  );
};

// Main GLB Scene Component
const GLBModelScene = ({ 
  projectId, 
  className = '',
  models = [],
  backgroundColor = '#1a1a2e',
  ambientIntensity = 0.4,
  lightIntensity = 0.8
}) => {
  // Default models if none provided
  const defaultModels = [
    {
      path: `/models/${projectId}.glb`,
      position: [0, 0, -45],
      scale: 0.8,
      animationType: 'complexRotation',
      animationSpeed: 1
    }
  ];

  const modelsToRender = models.length > 0 ? models : defaultModels;

  return (
    <div className={`glb-model-scene ${className}`} style={{ width: '100%', height: '100%' }}>
      <Canvas 
        camera={{ position: [0, 5, 10], fov: 75 }}
        style={{ background: backgroundColor }}
        shadows
      >
        {/* Camera controls */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
          autoRotate={false}
          autoRotateSpeed={0.5}
          target={[0, 0, -50]}
        />
        
        {/* Lighting setup for better GLB visualization */}
        <ambientLight intensity={ambientIntensity} />
        <directionalLight 
          position={[15, 15, 10]} 
          intensity={lightIntensity}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-15, -15, -15]} intensity={0.3} />
        <hemisphereLight args={['#ffffff', '#60666C']} intensity={0.4} />
        
        {/* Render all models */}
        {modelsToRender.map((model, index) => (
          <GLBModel
            key={index}
            modelPath={model.path}
            position={model.position || [0, 0, -25]}
            scale={model.scale || 0.8}
            animationType={model.animationType || 'complexRotation'}
            animationSpeed={model.animationSpeed || 1}
          />
        ))}
        
        {/* No grid - as requested */}
      </Canvas>
    </div>
  );
};

export default GLBModelScene;
