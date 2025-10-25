# STEP File Conversion Guide

## Overview
STEP files (.step, .stp) are CAD format files that can be converted to GIFs using this tool. However, STEP import in Blender requires additional setup.

## Option 1: Convert STEP to GLB First (Recommended)

Since STEP support in Blender can be inconsistent, the easiest approach is to convert your STEP file to GLB/GLTF format first.

### Using Online Converters:
1. **CAD Exchanger**: https://cadexchanger.com/
2. **FreeCAD**: Free open-source option (see below)
3. **Aspose**: https://products.aspose.app/3d/conversion/step-to-glb

### Using FreeCAD (Free, Offline):

1. **Install FreeCAD**:
   ```bash
   # macOS
   brew install --cask freecad
   
   # Ubuntu
   sudo apt install freecad
   ```

2. **Convert STEP to GLB**:
   ```bash
   # Open FreeCAD and run in Python console:
   import FreeCAD
   import ImportGui
   
   # Import STEP file
   doc = FreeCAD.newDocument()
   ImportGui.insert("model.step", "MyDoc")
   
   # Export as GLB
   ImportGui.export([FreeCAD.ActiveDocument.Objects[0]], "model.glb")
   ```

3. **Then use our tool**:
   ```bash
   ./convert_to_gif.sh -i model.glb -o output.gif
   ```

## Option 2: Enable STEP Import in Blender

### For Blender 4.x:

1. **Install CAD Sketcher addon** (if available for your Blender version)
2. Or use **Import STL** addon and convert STEP to STL first

### Convert STEP to STL using FreeCAD:

```python
# In FreeCAD Python console:
import Part
shape = Part.read("model.step")
shape.exportStl("model.stl")
```

Then convert STL to GIF:
```bash
# Note: You'll need to add STL support to the Python script
./convert_to_gif.sh -i model.stl -o output.gif
```

## Option 3: Use Blender's Python API Directly

If you have STEP import working in Blender, the script should detect it automatically.

## Recommended Workflow

**For highest quality:**

1. Convert STEP → GLB using FreeCAD or online converter
2. Use our script: `./convert_to_gif.sh -i model.glb -o output.gif -w 3840 --height 2160 --fps 60`

**Quick online conversion:**

1. Upload STEP to https://cadexchanger.com/
2. Download as GLB
3. Run: `./convert_to_gif.sh -i downloaded.glb -o output.gif`

## Troubleshooting

**Error: "STEP format requires CAD import addon"**
- Convert to GLB first (see Option 1)
- Or enable CAD import in Blender preferences

**Model appears too small/large**
- The script auto-scales, but you can manually adjust the camera distance in `convert_model_to_gif.py` (line ~100)

**Animation too fast/slow**
- Adjust `--fps` parameter: Lower = slower, Higher = faster
- Adjust `--frames` parameter: More frames = longer animation

## Example Commands

```bash
# High-res PCB animation from STEP file (after converting to GLB)
./convert_to_gif.sh -i pcb.glb -o pcb.gif -w 3840 --height 2160 --fps 60 -s 256

# Quick preview (lower quality, faster)
./convert_to_gif.sh -i model.glb -o preview.gif -w 1280 --height 720 -s 64

# Standard quality
./convert_to_gif.sh -i model.glb -o output.gif
```

## Next Steps

Once you have your GLB file, the conversion to GIF is fully automated! The script will:
- ✅ Auto-center and scale your model
- ✅ Set up professional lighting
- ✅ Render smooth multi-axis rotation
- ✅ Convert to optimized GIF
