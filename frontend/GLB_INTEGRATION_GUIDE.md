# 3D GLB Model Integration Guide

## Overview
Your portfolio now supports high-definition GLB 3D models for projects! When a GLB file is available for a project, it will automatically replace the default 3D scene with your custom model.

**✅ GLB Format Only** - For best performance, quality, and compatibility, we use GLB files exclusively. GLB format supports materials, textures, animations, and provides much higher quality than STL files. Please convert any STEP/CAD/STL files to GLB format before adding them.

## How it Works
1. The system checks for GLB files when a project page loads
2. If a GLB file exists, it loads and animates your custom model with full materials and lighting
3. If no GLB file is found, it falls back to the default 3D scenes (rockets, PCBs, etc.)

## Adding GLB Files

### Step 1: Prepare Your GLB Files
Place your GLB files in the `public/models/` directory with the following naming convention:

```
public/models/
├── snsv1.glb          # For "SNSv1" project
├── atom.glb           # For "Atom" project
├── c6.glb             # For "C6" project
├── zer0.glb           # For "zer0" project
├── snsv3.glb          # For "SNSv3" project
├── technofest-series.glb  # For "Technofest Series" project
└── pavisys.glb        # For "Pavisys" project
```

### Step 2: File Naming Rules
Project titles are converted to filenames using these rules:
- Convert to lowercase
- Replace spaces and special characters with hyphens
- Remove multiple consecutive hyphens
- Remove leading/trailing hyphens

Examples:
- "SNSv1" → `snsv1.stl`
- "Technofest Series" → `technofest-series.stl`
- "C6" → `c6.stl`

### Step 3: GLB File Guidelines
- **File Size**: Keep under 10MB for web performance (GLB is compressed)
- **Quality**: GLB supports materials, textures, and lighting - much higher quality than STL
- **Complexity**: Optimize mesh for web (< 100k triangles recommended)
- **Units**: Design in real-world units (mm/cm)
- **Orientation**: Model should face forward along positive Z-axis
- **Center**: Model should be centered at origin (0,0,0)
- **Materials**: Include PBR materials for realistic rendering

## Customizing Animations

You can customize how each model animates by editing `/src/utils/glbUtils.js`:

```javascript
'your-project-name': {
  models: [
    {
      path: '/models/your-model.stl',
      position: [0, 0, 0],        // X, Y, Z position
      scale: 1.2,                 // Size multiplier
      color: '#4a90e2',           // Hex color
      animationType: 'float',     // Animation type
      animationSpeed: 1.0         // Speed multiplier
    }
  ],
  backgroundColor: '#1a1a2e',     // Scene background
  ambientIntensity: 0.4,          // Ambient lighting
  lightIntensity: 0.8            // Directional lighting
}
```

### Available Animation Types
- `'rotate'` - Continuous rotation on multiple axes
- `'float'` - Floating up and down with gentle rotation
- `'orbit'` - Orbiting around the center point
- `'pulse'` - Pulsing scale effect with rotation
- `'static'` - No animation, static display

## Multiple Models Per Project

You can have multiple STL files for one project:

```javascript
'complex-project': {
  models: [
    {
      path: '/models/main-component.stl',
      position: [0, 0, 0],
      scale: 1,
      color: '#e74c3c',
      animationType: 'rotate',
      animationSpeed: 1
    },
    {
      path: '/models/secondary.stl',
      position: [2, 1, 0],
      scale: 0.7,
      color: '#3498db',
      animationType: 'float',
      animationSpeed: 1.5
    }
  ]
}
```

## Troubleshooting

### STL Not Loading?
1. Check the file path: `/public/models/your-file.stl`
2. Verify filename matches project title conversion
3. Check browser console for loading errors
4. Ensure file size is reasonable (< 5MB)

### Performance Issues?
1. Reduce mesh complexity in your 3D software
2. Use tools like MeshLab to optimize STL files
3. Consider using multiple LOD (Level of Detail) models

### Model Not Centered?
In your 3D software:
1. Move model to world origin (0,0,0)
2. Or the loader will auto-center based on bounding box

## Example GLB Files Structure

```
/Users/yashdarji/Workspace/Ego/frontend/public/models/
├── snsv1.glb          # Your SNSv1 flight computer with materials
├── atom.glb           # Your Atom board with textures
├── c6.glb             # Your C6 flight computer with lighting
├── zer0.glb           # Your zer0 miniature board
└── technofest-series.glb  # Combined model with full materials
```

Once you add GLB files to the `public/models/` folder, they will automatically appear in your project detail pages with full materials and lighting!

## Converting to GLB Format

### From CAD/STEP Files:
1. **Blender** (Free): Import STEP → Add materials → Export as GLB
2. **Fusion 360**: Export as OBJ → Import to Blender → Export as GLB
3. **FreeCAD**: Export as OBJ → Import to Blender → Export as GLB

### From STL Files:
1. **Blender**: Import STL → Add materials and textures → Export as GLB
2. **Online converters**: Various web tools available for basic conversion

## Current Project Mappings

Based on your portfolio, here are the expected GLB filenames:

| Project Title | Expected GLB Filename | Description |
|---------------|----------------------|-------------|
| SNSv1 | `snsv1.glb` | First model rocket flight computer |
| SNSv3 | `snsv3.glb` | Upgraded version of SNSv1 |
| Technofest Series | `technofest-series.glb` | Suite of avionics |
| Atom | `atom.glb` | General-purpose flight computer |
| C6 | `c6.glb` | Advanced flight computer |
| zer0 | `zer0.glb` | Smallest FC (15x15 mm) |
| Pavisys | `pavisys.stl` | Parachute testing PCB suite |
