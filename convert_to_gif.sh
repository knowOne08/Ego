#!/bin/bash
# Easy wrapper script for converting 3D models to GIFs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}3D Model to GIF Converter${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if Blender is installed
if ! command -v blender &> /dev/null; then
    echo -e "${RED}ERROR: Blender is not installed!${NC}"
    echo ""
    echo "Install Blender:"
    echo "  macOS:   brew install --cask blender"
    echo "  Ubuntu:  sudo snap install blender --classic"
    echo "  Windows: Download from blender.org"
    exit 1
fi

# Check if Python script exists
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PYTHON_SCRIPT="$SCRIPT_DIR/convert_model_to_gif.py"

if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo -e "${RED}ERROR: Python script not found at $PYTHON_SCRIPT${NC}"
    exit 1
fi

# Default values
INPUT_FILE=""
OUTPUT_FILE=""
WIDTH=1920
HEIGHT=1080
FRAMES=120
FPS=30
SAMPLES=128

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--input)
            INPUT_FILE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -w|--width)
            WIDTH="$2"
            shift 2
            ;;
        --height)
            HEIGHT="$2"
            shift 2
            ;;
        -f|--frames)
            FRAMES="$2"
            shift 2
            ;;
        --fps)
            FPS="$2"
            shift 2
            ;;
        -s|--samples)
            SAMPLES="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 -i INPUT -o OUTPUT [OPTIONS]"
            echo ""
            echo "Required:"
            echo "  -i, --input FILE      Input 3D model (GLB/GLTF/STEP/STP)"
            echo "  -o, --output FILE     Output GIF file"
            echo ""
            echo "Optional:"
            echo "  -w, --width NUM       Width in pixels (default: 1920)"
            echo "  --height NUM          Height in pixels (default: 1080)"
            echo "  -f, --frames NUM      Number of frames (default: 120)"
            echo "  --fps NUM             Frames per second (default: 30)"
            echo "  -s, --samples NUM     Render samples (default: 128)"
            echo ""
            echo "Examples:"
            echo "  $0 -i model.glb -o output.gif"
            echo "  $0 -i pcb.step -o pcb_animation.gif -w 3840 --height 2160 --fps 60"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validate required arguments
if [ -z "$INPUT_FILE" ]; then
    echo -e "${RED}ERROR: Input file required (-i)${NC}"
    echo "Use --help for usage information"
    exit 1
fi

if [ -z "$OUTPUT_FILE" ]; then
    echo -e "${RED}ERROR: Output file required (-o)${NC}"
    echo "Use --help for usage information"
    exit 1
fi

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}ERROR: Input file not found: $INPUT_FILE${NC}"
    exit 1
fi

# Get absolute paths
INPUT_FILE=$(realpath "$INPUT_FILE")

# For output file, handle the path carefully (file doesn't exist yet)
if [[ "$OUTPUT_FILE" = /* ]]; then
    # Already absolute path
    OUTPUT_FILE="$OUTPUT_FILE"
else
    # Relative path - make it absolute
    OUTPUT_FILE="$(pwd)/$OUTPUT_FILE"
fi

# Display settings
echo ""
echo -e "${YELLOW}Settings:${NC}"
echo "  Input:      $INPUT_FILE"
echo "  Output:     $OUTPUT_FILE"
echo "  Resolution: ${WIDTH}x${HEIGHT}"
echo "  Frames:     $FRAMES @ ${FPS} FPS"
echo "  Samples:    $SAMPLES"
echo ""

# Check if Pillow is installed
echo -e "${YELLOW}Checking dependencies...${NC}"
python3 -c "import PIL" 2>/dev/null || {
    echo -e "${YELLOW}Installing Pillow...${NC}"
    pip3 install pillow
}

# Run Blender script
echo ""
echo -e "${GREEN}Starting conversion...${NC}"
echo ""

blender --background --python "$PYTHON_SCRIPT" -- \
    --input "$INPUT_FILE" \
    --output "$OUTPUT_FILE" \
    --width "$WIDTH" \
    --height "$HEIGHT" \
    --frames "$FRAMES" \
    --fps "$FPS" \
    --samples "$SAMPLES"

echo ""
if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}SUCCESS! 🎉${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo "  Output: $OUTPUT_FILE"
    echo "  Size:   $FILE_SIZE"
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}FAILED!${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
