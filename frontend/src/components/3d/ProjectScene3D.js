import React, { Suspense, useState, useEffect } from 'react';
import StableAerospaceScene from './StableAerospaceScene';
import MinimalScene from './MinimalScene';
import GLBModelScene from './GLBModelScene';
import { checkGLBExists, getProjectGLBConfig } from '../../utils/glbUtils';
import './ProjectScene3D.css';

// Loading component for 3D scenes
const SceneLoader = () => (
  <div className="scene-loader">
    <div className="loader-container">
      <div className="loader-orbit">
        <div className="loader-planet"></div>
      </div>
      <div className="loader-text">Initializing 3D Scene...</div>
    </div>
  </div>
);

// Error boundary for 3D scenes
class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('3D Scene Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="scene-error">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <div className="error-text">3D Scene unavailable</div>
            <div className="error-subtext">Fallback to 2D visualization</div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ProjectScene3D = ({ 
  project, 
  className = '', 
  intensity = 0.7,
  autoRotate = true 
}) => {
  const [hasGLB, setHasGLB] = useState(false);
  const [glbConfig, setGlbConfig] = useState(null);
  const [isCheckingGLB, setIsCheckingGLB] = useState(true);

  // Check for GLB file when component mounts
  useEffect(() => {
    const checkForGLBFile = async () => {
      if (!project || !project.title) {
        setIsCheckingGLB(false);
        return;
      }

      try {
        const glbExists = await checkGLBExists(project.title);
        setHasGLB(glbExists);
        
        if (glbExists) {
          const config = getProjectGLBConfig(project.title);
          setGlbConfig(config);
        }
      } catch (error) {
        console.log('GLB check failed:', error);
        setHasGLB(false);
      } finally {
        setIsCheckingGLB(false);
      }
    };

    checkForGLBFile();
  }, [project]);

  // Determine scene type based on project category and title
  const getSceneType = () => {
    if (!project) return 'generic';
    
    const category = project.category?.toLowerCase() || '';
    const title = project.title?.toLowerCase() || '';
    
    // Aerospace projects
    if (category === 'aerospace' || 
        title.includes('rocket') || 
        title.includes('flight') ||
        title.includes('sns') ||
        title.includes('atom') ||
        title.includes('c6') ||
        title.includes('zer0')) {
      
      // Determine specific aerospace type
      if (title.includes('sns') || title.includes('flight') || title.includes('rocket')) {
        return { type: 'aerospace', subtype: 'rocket' };
      } else if (title.includes('atom') || title.includes('c6')) {
        return { type: 'aerospace', subtype: 'satellite' };
      } else if (title.includes('zer0') || title.includes('pcb')) {
        return { type: 'aerospace', subtype: 'pcb' };
      }
      return { type: 'aerospace', subtype: 'rocket' };
    }
    
    // Other project types
    return { type: 'generic', subtype: category };
  };

  const sceneConfig = getSceneType();
  
  // Don't render 3D scene on mobile to save performance
  const isMobile = typeof window !=='undefined' && window.innerWidth < 768;
  
  if (isMobile) {
    return (
      <div className={`project-scene-fallback ${className}`}>
        <div className="fallback-pattern"></div>
        <div className="fallback-glow"></div>
      </div>
    );
  }

  // Show loading state while checking for GLB
  if (isCheckingGLB) {
    return (
      <div className={`project-scene-3d ${className}`} style={{ '--intensity': intensity }}>
        <SceneLoader />
      </div>
    );
  }

  return (
    <div className={`project-scene-3d ${className}`} style={{ '--intensity': intensity }}>
      <SceneErrorBoundary>
        <Suspense fallback={<SceneLoader />}>
          {hasGLB && glbConfig ? (
            <GLBModelScene
              projectId={project?.title}
              className="glb-scene-container"
              models={glbConfig.models}
              backgroundColor={glbConfig.backgroundColor}
              ambientIntensity={glbConfig.ambientIntensity}
              lightIntensity={glbConfig.lightIntensity}
            />
          ) : sceneConfig.type === 'aerospace' ? (
            <StableAerospaceScene 
              projectType={sceneConfig.subtype} 
              className="aerospace-scene-container"
              project={project}
            />
          ) : (
            <MinimalScene 
              className="generic-scene-container"
            />
          )}
        </Suspense>
      </SceneErrorBoundary>
      
      {/* Overlay gradients for better text readability */}
      <div className="scene-overlay-gradient scene-overlay-left"></div>
      <div className="scene-overlay-gradient scene-overlay-right"></div>
      <div className="scene-overlay-gradient scene-overlay-bottom"></div>
    </div>
  );
};

export default ProjectScene3D;
