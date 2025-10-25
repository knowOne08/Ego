# 3D PCB Model Setup Instructions

## Setup Complete! ✅

The 3D PCB viewer has been implemented and is ready to use.

## How to Add Your 3D Models:

### 1. Convert GLTF to GLB (IMPORTANT!)

If you have a `.gltf` file, **convert it to `.glb`** for better performance:

```bash
# Install gltf-pipeline (one time only)
npm install -g gltf-pipeline

# Convert your GLTF to optimized GLB
cd frontend/public/models
gltf-pipeline -i your-model.gltf -o your-model.glb -d
```

**Why GLB?**
- 3x smaller file size (11MB vs 35MB for C6)
- Faster loading
- Better performance
- No lag or freezing

### 2. Place Your GLB File
Copy your `.gltf` or `.glb` file to:
```
frontend/public/models/
```

For example:
- `frontend/public/models/snsv1.glb`
- `frontend/public/models/snsv3.glb`
- `frontend/public/models/c6.glb`

### 2. Update Your Project Data

In `frontend/src/content_option.js`, add the `modelPath` property to your hardware projects:

```javascript
{
    title: "SNSv1",
    description: "First model rocket flight computer...",
    // ... other properties ...
    modelPath: "/models/snsv1.glb",  // ← Add this line
    category: "Aerospace",
    technologies: ["ESP8266", "BMP280", "C++", "PCB Design"],
    // ... rest of properties
}
```

### 3. Model Path Format
Use the path relative to the `public` folder:
```javascript
modelPath: "/models/your-pcb-name.glb"
```

## Features Implemented:

✅ Auto-rotating 3D model display  
✅ Interactive controls (drag to rotate, scroll to zoom)  
✅ Smooth loading with fallback placeholder  
✅ Professional lighting setup for PCBs  
✅ Responsive design  
✅ Theme-aware styling  
✅ Performance optimized with lazy loading  

## Controls:

- **Drag**: Rotate the model
- **Scroll**: Zoom in/out
- **Auto-rotate**: Enabled by default (can be toggled)

## Customization:

Edit `PCBViewer.js` to adjust:
- Rotation speed (line 11: `delta * 0.3`)
- Scale (line 17: `scale={1.5}`)
- Camera position (line 42: `position={[0, 0, 5]}`)
- Lighting colors and intensity (lines 47-50)
- Auto-rotate speed (line 60: `autoRotateSpeed={0.5}`)

## Example Projects with Models:

Add `modelPath` to these projects:
- SNSv1
- SNSv3
- Technofest Series (Serene, Prometheus, ComCop)
- Atom
- C6
- zer0
- Pavisys

Projects **without** `modelPath` will show the default abstract artwork placeholder.

## Need Help?

The component will automatically:
- Show a loading spinner while the model loads
- Fall back to placeholder if no model is specified
- Handle errors gracefully
- Optimize performance with lazy loading
