# Theme-Adaptive 3D Model Viewer - Guide

## Overview
The PCBViewer component now automatically detects and adapts to light/dark theme changes with theme-specific lighting and optional theme-specific models.

## Features

### 1. **Automatic Theme Detection**
- Detects theme changes in real-time
- Monitors `document.documentElement` and `document.body` for:
  - `.dark-mode` class
  - `data-theme="dark"` attribute

### 2. **Theme-Adaptive Lighting**

**Dark Mode (Better visibility):**
- Ambient: 1.0
- Key light: 1.5
- Fill light: 0.8
- Point light: 1.0

**Light Mode (More contrast):**
- Ambient: 0.6
- Key light: 1.0
- Fill light: 0.5
- Point light: 0.7

### 3. **Theme-Specific Models (Optional)**
You can now provide different 3D models for light and dark modes!

## Usage

### In `content_option.js`:

```javascript
{
    title: "C6",
    description: "Your project description...",
    
    // Option 1: Single model for all themes
    modelPath: "/models/C6.glb",
    
    // Option 2: Theme-specific models (optional)
    modelPath: "/models/C6.glb",              // Fallback
    lightModeModelPath: "/models/C6-light.glb",  // Used in light mode
    darkModeModelPath: "/models/C6-dark.glb",    // Used in dark mode
    
    isMainProject: true,
    // ... rest of project data
}
```

### When to Use Theme-Specific Models:

1. **Light Mode Model** - Use when:
   - PCB looks too dark on white background
   - Want brighter/lighter colored PCB
   - Need better contrast against light backgrounds

2. **Dark Mode Model** - Use when:
   - PCB looks washed out on dark background
   - Want darker/richer colors
   - Need better contrast against dark backgrounds

3. **Fallback Model** - Always provide:
   - Used when theme-specific model not available
   - Default model that works reasonably well in both modes

## File Structure

```
frontend/public/models/
├── C6.glb              # Default/fallback model
├── C6-light.glb        # Optional: Optimized for light mode
├── C6-dark.glb         # Optional: Optimized for dark mode
├── snsv1.glb           # Other project models...
└── ...
```

## Creating Theme-Specific Models

### Option A: Export with Different Materials
1. In your 3D software (Blender, Fusion 360, etc.)
2. Create two versions with different materials:
   - **Light version**: Darker materials, higher contrast
   - **Dark version**: Brighter materials, more vibrant colors
3. Export as separate GLB files

### Option B: Use the GIF Converter Script
```bash
# Create a brighter version for light mode
./convert_to_gif.sh -i C6.glb -o C6-light.gif

# Then use Blender to adjust brightness and export as GLB
```

## Component Props

```javascript
<PCBViewer 
  modelPath="/models/default.glb"           // Required: fallback model
  lightModeModelPath="/models/light.glb"    // Optional: light mode model
  darkModeModelPath="/models/dark.glb"      // Optional: dark mode model
  gifPath="/gifs/animation.gif"             // Optional: use GIF instead
/>
```

## Priority Order

1. If `gifPath` provided → Show GIF (ignores 3D models)
2. If light mode + `lightModeModelPath` → Use light mode model
3. If dark mode + `darkModeModelPath` → Use dark mode model
4. Else → Use `modelPath` (fallback)

## Example Configuration

### Minimal (Single Model):
```javascript
{
    title: "Project",
    modelPath: "/models/project.glb",
    // Works in both themes with adaptive lighting
}
```

### Full (Theme-Specific Models):
```javascript
{
    title: "C6",
    modelPath: "/models/C6.glb",
    lightModeModelPath: "/models/C6-light.glb",
    darkModeModelPath: "/models/C6-dark.glb",
    // Perfect appearance in both themes
}
```

### GIF-Based:
```javascript
{
    title: "SNSv1",
    gifPath: "/gifs/snsv1-animation.gif",
    // No 3D rendering, just animated GIF
}
```

## Tips

1. **Test both themes** before deploying
2. **Light mode models** should be darker/more contrasted
3. **Dark mode models** can be brighter/more colorful
4. **Fallback model** should work reasonably in both
5. **File size** - Keep GLB files under 5MB for fast loading

## Troubleshooting

**Model looks bad in light mode:**
- Create a `lightModeModelPath` with darker materials
- Or reduce lighting intensity manually

**Model looks bad in dark mode:**
- Create a `darkModeModelPath` with brighter materials
- Or increase lighting intensity manually

**Theme not detecting:**
- Check if your theme toggle updates the class/attribute
- Common class names: `dark-mode`, `light-mode`
- Common attributes: `data-theme="dark"`

## Advanced: Manual Lighting Tweaks

Edit `PCBViewer.js` to adjust lighting:

```javascript
// Light mode lighting
<ambientLight intensity={0.6} />  // Increase for brighter
<directionalLight position={[5, 5, 5]} intensity={1.0} />

// Dark mode lighting
<ambientLight intensity={1.0} />  // Increase for brighter
<directionalLight position={[5, 5, 5]} intensity={1.5} />
```

---

**That's it!** Your 3D models will now automatically adapt to theme changes with perfect lighting for each mode. 🎨✨
