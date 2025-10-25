#!/bin/bash

# GLTF to GLB Converter Script
# Usage: ./convert-model.sh input.gltf

if [ -z "$1" ]; then
    echo "Usage: ./convert-model.sh input.gltf"
    echo "Example: ./convert-model.sh snsv1.gltf"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="${INPUT_FILE%.gltf}.glb"

echo "Converting $INPUT_FILE to $OUTPUT_FILE..."
echo "This may take a few seconds..."

gltf-pipeline -i "$INPUT_FILE" -o "$OUTPUT_FILE" -d

if [ $? -eq 0 ]; then
    ORIGINAL_SIZE=$(du -h "$INPUT_FILE" | cut -f1)
    COMPRESSED_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    
    echo ""
    echo "✅ Conversion successful!"
    echo "📦 Original GLTF: $ORIGINAL_SIZE"
    echo "🎯 Optimized GLB: $COMPRESSED_SIZE"
    echo ""
    echo "You can now delete the GLTF file:"
    echo "rm \"$INPUT_FILE\""
else
    echo "❌ Conversion failed!"
    exit 1
fi
