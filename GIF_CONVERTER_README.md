# 3D Model to High-Resolution GIF Converter

Convert your 3D models (GLTF/GLB) to beautiful, high-resolution animated GIFs using Blender automation.

## Features

- ✅ High-resolution output (up to 4K)
- ✅ Smooth rotation animation
- ✅ Studio lighting setup
- ✅ Transparent or colored backgrounds
- ✅ Customizable FPS and quality
- ✅ Automatic centering and scaling
- ✅ One command execution

## Requirements

### 1. Install Blender

**macOS:**
```bash
brew install --cask blender
```

**Ubuntu/Linux:**
```bash
sudo snap install blender --classic
```

**Windows:**
Download from [blender.org](https://www.blender.org/download/)

### 2. Install Python Dependencies

```bash
pip3 install pillow
```

## Usage

### Easy Mode (Shell Script)

```bash
./convert_to_gif.sh -i /path/to/model.glb -o output.gif
```

### With Custom Settings

```bash
./convert_to_gif.sh \
  -i frontend/public/models/pcb.glb \
  -o frontend/public/gifs/pcb_hd.gif \
  -w 3840 \
  -h 2160 \
  --fps 60 \
  -s 256
```

### Advanced Mode (Direct Python)

```bash
blender --background --python convert_model_to_gif.py -- \
  --input model.glb \
  --output output.gif \
  --width 1920 \
  --height 1080 \
  --frames 120 \
  --fps 30 \
  --samples 128
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-i, --input` | Input 3D model file (GLB/GLTF) | **Required** |
| `-o, --output` | Output GIF file | **Required** |
| `-w, --width` | Width in pixels | 1920 |
| `-h, --height` | Height in pixels | 1080 |
| `-f, --frames` | Number of frames | 120 |
| `--fps` | Frames per second | 30 |
| `-s, --samples` | Render quality samples | 128 |

## Examples

### Full HD (1080p) - Recommended

```bash
./convert_to_gif.sh \
  -i frontend/public/models/pcb.glb \
  -o frontend/public/gifs/pcb.gif \
  -w 1920 -h 1080 --fps 30
```

### 4K Ultra HD

```bash
./convert_to_gif.sh \
  -i frontend/public/models/pcb.glb \
  -o frontend/public/gifs/pcb_4k.gif \
  -w 3840 -h 2160 --fps 60 -s 256
```

### Quick Preview (Low Quality)

```bash
./convert_to_gif.sh \
  -i frontend/public/models/pcb.glb \
  -o preview.gif \
  -w 640 -h 480 --fps 15 -s 32
```

### Smooth 60 FPS

```bash
./convert_to_gif.sh \
  -i frontend/public/models/pcb.glb \
  -o frontend/public/gifs/pcb_smooth.gif \
  --fps 60 -f 180
```

## Output Quality Guide

### Resolution

- **640x480**: Quick preview, small file size
- **1280x720**: Web-friendly, good quality
- **1920x1080**: Full HD, recommended
- **3840x2160**: 4K, maximum quality (large file)

### FPS (Frames Per Second)

- **15 FPS**: Choppy but small file
- **30 FPS**: Standard, smooth (recommended)
- **60 FPS**: Very smooth, larger file

### Samples (Render Quality)

- **32**: Fast, noisy
- **64**: Quick preview
- **128**: Good quality (recommended)
- **256**: High quality
- **512+**: Maximum quality (very slow)

## File Size Optimization

GIFs can get large. Here are tips to reduce file size:

1. **Lower resolution**: `-w 1280 -h 720` instead of Full HD
2. **Reduce frames**: `-f 60` instead of 120
3. **Lower FPS**: `--fps 24` instead of 60
4. **Use compression tools**: 
   ```bash
   gifsicle -O3 --lossy=80 input.gif -o output.gif
   ```

## Troubleshooting

### "Blender not found"

Make sure Blender is installed and in your PATH:
```bash
which blender
```

If not found, install it:
```bash
brew install --cask blender
```

### "Pillow not installed"

Install Python imaging library:
```bash
pip3 install pillow
```

### Render is too slow

Reduce quality settings:
- Lower `--samples` to 64 or 32
- Reduce resolution with `-w 1280 -h 720`
- Use fewer frames with `-f 60`

### GIF file is too large

- Lower resolution
- Reduce FPS
- Use fewer frames
- Optimize with: `gifsicle -O3 input.gif -o output.gif`

## How It Works

1. **Import**: Loads your 3D model into Blender
2. **Setup**: Centers and scales the model automatically
3. **Lighting**: Adds studio-quality 3-point lighting
4. **Camera**: Positions camera at optimal angle
5. **Animation**: Creates smooth 360° rotation
6. **Render**: Renders each frame as PNG (high quality)
7. **Convert**: Combines PNGs into optimized GIF
8. **Cleanup**: Optionally removes temporary PNG files

## Advanced Customization

Edit `convert_model_to_gif.py` to customize:

- Camera angle and distance
- Lighting setup (color, intensity)
- Background color (transparent or solid)
- Rotation axis (X, Y, or Z)
- Animation type (rotation, bounce, etc.)

## Tips for Best Results

1. **Use clean models**: Remove unnecessary geometry
2. **Check scale**: Models should be reasonably sized
3. **Test with low quality first**: Use `-s 32` for quick previews
4. **Optimize texture resolution**: High-res textures aren't needed for GIFs
5. **Consider MP4/WebM**: For web use, video formats are often smaller than GIF

## Converting for Your Portfolio

For the PCB in your portfolio:

```bash
cd /Users/yashdarji/Workspace/Ego

# Find your model
ls frontend/public/models/

# Convert to high-res GIF
./convert_to_gif.sh \
  -i frontend/public/models/YOUR_MODEL.glb \
  -o frontend/public/gifs/pcb_highres.gif \
  -w 1920 -h 1080 --fps 30 -s 128
```

Then update `index.js` to use the new GIF:
```javascript
<PCBViewer gifPath="/gifs/pcb_highres.gif" />
```

## License

MIT License - Feel free to use and modify!

## Credits

Built with:
- [Blender](https://www.blender.org/) - 3D rendering
- [Pillow](https://python-pillow.org/) - GIF creation
