// Utility functions for GLB model management

// Convert project title to ID (filename friendly)
export const getProjectId = (title) => {
  return title.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Check if a GLB file exists for a project
export const checkGLBExists = async (projectTitle) => {
  try {
    const projectId = getProjectId(projectTitle);
    const response = await fetch(`/models/${projectId}.glb`, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Get GLB file path for a project
export const getGLBPath = (projectTitle) => {
  const projectId = getProjectId(projectTitle);
  return `/models/${projectId}.glb`;
};

// Project-specific GLB configurations based on your actual projects
export const projectGLBConfigs = {
  // SNSv1 - First rocket flight computer
  'snsv1': {
    models: [
      {
        path: '/models/snsv1.glb',
        position: [0, 0, 0],
        scale: 1,
        animationType: 'float',
        animationSpeed: 1.2
      }
    ],
    backgroundColor: '#0f0f1e',
    ambientIntensity: 0.5,
    lightIntensity: 0.9
  },
  
  // SNSv3 - Upgraded version
  'snsv3': {
    models: [
      {
        path: '/models/snsv3.glb',
        position: [0, 0, 0],
        scale: 1,
        animationType: 'float',
        animationSpeed: 1
      }
    ],
    backgroundColor: '#1a0f0f',
    ambientIntensity: 0.5,
    lightIntensity: 0.9
  },
  
  // Atom - General purpose flight computer
  'atom': {
    models: [
      {
        path: '/models/atom.glb',
        position: [0, 0, 0],
        scale: 1.2,
        animationType: 'orbit',
        animationSpeed: 0.8
      }
    ],
    backgroundColor: '#001a2e',
    ambientIntensity: 0.4,
    lightIntensity: 0.8
  },
  
  // C6 - Advanced flight computer with redundancy
  'c6': {
    models: [
      {
        path: '/models/c6.glb',
        position: [0, 0, 0],
        scale: 1.1,
        animationType: 'pulse',
        animationSpeed: 1.2
      }
    ],
    backgroundColor: '#0f1a0f',
    ambientIntensity: 0.3,
    lightIntensity: 1.0
  },
  
  // zer0 - Smallest flight computer
  'zer0': {
    models: [
      {
        path: '/models/zer0.glb',
        position: [0, 0, 0],
        scale: 2,
        animationType: 'rotate',
        animationSpeed: 1.8
      }
    ],
    backgroundColor: '#16213e',
    ambientIntensity: 0.4,
    lightIntensity: 1.2
  },
  
  // Technofest Series - Multiple components
  'technofest-series': {
    models: [
      {
        path: '/models/technofest-series.glb',
        position: [0, 0, 0],
        scale: 0.9,
        animationType: 'orbit',
        animationSpeed: 0.7
      }
    ],
    backgroundColor: '#2c1a3e',
    ambientIntensity: 0.5,
    lightIntensity: 0.8
  },
  
  // Pavisys - Parachute testing system
  'pavisys': {
    models: [
      {
        path: '/models/pavisys.glb',
        position: [0, 0, 0],
        scale: 1.3,
        animationType: 'float',
        animationSpeed: 1.1
      }
    ],
    backgroundColor: '#2e1a0f',
    ambientIntensity: 0.4,
    lightIntensity: 0.9
  }
};

// Get configuration for a project
export const getProjectGLBConfig = (projectTitle) => {
  const projectId = getProjectId(projectTitle);
  return projectGLBConfigs[projectId] || {
    models: [{
      path: `/models/${projectId}.glb`,
      position: [0, 0, 0],
      scale: 1,
      animationType: 'float',
      animationSpeed: 1
    }],
    backgroundColor: '#1a1a2e',
    ambientIntensity: 0.4,
    lightIntensity: 0.8
  };
};

// Animation types available
export const animationTypes = {
  rotate: 'Continuous rotation on multiple axes',
  float: 'Floating up and down with gentle rotation',
  orbit: 'Orbiting around the center point',
  pulse: 'Pulsing scale effect with rotation',
  static: 'No animation, static display'
};

// Color schemes for different project categories
export const categoryColorSchemes = {
  aerospace: ['#e74c3c', '#3498db', '#f39c12'],
  electronics: ['#27ae60', '#2ecc71', '#16a085'],
  mechanical: ['#95a5a6', '#7f8c8d', '#bdc3c7'],
  software: ['#9b59b6', '#8e44ad', '#e67e22'],
  research: ['#34495e', '#2c3e50', '#ecf0f1']
};
