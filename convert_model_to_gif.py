#!/usr/bin/env python3
"""
3D Model to High-Resolution GIF Converter
Converts GLTF/GLB/STEP models to animated GIFs using Blender

Requirements:
- Blender (with bpy module)
- Pillow (PIL)

Install:
pip install pillow

Usage:
blender --background --python convert_model_to_gif.py -- --input model.glb --output output.gif

Or use the shell script wrapper:
./convert_to_gif.sh -i model.step -o output.gif
"""

import sys
import os
import argparse
from pathlib import Path

# Check if running inside Blender
try:
    import bpy
    import mathutils
    import math
except ImportError:
    print("ERROR: This script must be run with Blender's Python")
    print("\nUsage:")
    print("  blender --background --python convert_model_to_gif.py -- --input model.glb --output output.gif")
    sys.exit(1)

def setup_scene():
    """Clear default scene and set up render settings"""
    # Delete default objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Delete default lights
    for obj in bpy.data.objects:
        if obj.type == 'LIGHT':
            bpy.data.objects.remove(obj, do_unlink=True)

def import_model(filepath):
    """Import 3D model (GLTF/GLB/STEP/STL/OBJ/FBX)"""
    file_ext = Path(filepath).suffix.lower()
    
    if file_ext in ['.glb', '.gltf']:
        bpy.ops.import_scene.gltf(filepath=filepath)
    elif file_ext == '.obj':
        bpy.ops.import_scene.obj(filepath=filepath)
    elif file_ext == '.fbx':
        bpy.ops.import_scene.fbx(filepath=filepath)
    elif file_ext == '.stl':
        bpy.ops.wm.stl_import(filepath=filepath)
    elif file_ext in ['.step', '.stp']:
        # STEP files require CAD import addon
        try:
            bpy.ops.import_scene.step(filepath=filepath)
        except AttributeError:
            print("STEP import not available. Trying alternative method...")
            # Alternative: use external converter or manual import
            raise ValueError(f"STEP format requires CAD import addon. Please enable it in Blender preferences or convert to GLB/GLTF first.")
    else:
        raise ValueError(f"Unsupported file format: {file_ext}")
    
    # Get the imported object(s)
    imported_objects = bpy.context.selected_objects
    if not imported_objects:
        raise ValueError("No objects were imported")
    
    return imported_objects

def center_and_scale_objects(objects):
    """Center objects at origin and scale to fit in frame"""
    if not objects:
        raise ValueError("No objects provided to center and scale")
    
    # If multiple objects, create an empty parent and parent all objects to it
    if len(objects) > 1:
        # Create empty object as parent
        bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
        parent = bpy.context.active_object
        parent.name = "Model_Parent"
        
        # Parent all objects to the empty
        for obj in objects:
            obj.parent = parent
        
        obj = parent
    else:
        obj = objects[0]
    
    # Calculate combined bounding box for all objects
    all_bbox_corners = []
    for child_obj in objects:
        bbox_corners = [child_obj.matrix_world @ mathutils.Vector(corner) for corner in child_obj.bound_box]
        all_bbox_corners.extend(bbox_corners)
    
    # Find center and size of combined bounding box
    min_x = min(corner.x for corner in all_bbox_corners)
    max_x = max(corner.x for corner in all_bbox_corners)
    min_y = min(corner.y for corner in all_bbox_corners)
    max_y = max(corner.y for corner in all_bbox_corners)
    min_z = min(corner.z for corner in all_bbox_corners)
    max_z = max(corner.z for corner in all_bbox_corners)
    
    # Calculate center offset
    center_offset = mathutils.Vector((
        (min_x + max_x) / 2,
        (min_y + max_y) / 2,
        (min_z + max_z) / 2
    ))
    
    # Move to origin
    obj.location = -center_offset
    
    # Calculate bounding box size
    bbox_size = max(max_x - min_x, max_y - min_y, max_z - min_z)
    
    # Scale to fit in a 2-unit box
    if bbox_size > 0:
        scale_factor = 2.0 / bbox_size
        obj.scale = (scale_factor, scale_factor, scale_factor)
    
    return obj

def setup_camera(distance=5.0):
    """Create and position camera"""
    bpy.ops.object.camera_add(location=(0, -distance, distance * 0.6))
    camera = bpy.context.active_object
    camera.rotation_euler = (math.radians(60), 0, 0)
    
    # Set as active camera
    bpy.context.scene.camera = camera
    
    return camera

def setup_lighting():
    """Create studio lighting setup"""
    # Key light (main light)
    bpy.ops.object.light_add(type='SUN', location=(5, -5, 8))
    key_light = bpy.context.active_object
    key_light.data.energy = 3.0
    key_light.rotation_euler = (math.radians(45), 0, math.radians(45))
    
    # Fill light (softer, opposite side)
    bpy.ops.object.light_add(type='AREA', location=(-5, -3, 5))
    fill_light = bpy.context.active_object
    fill_light.data.energy = 1.5
    fill_light.data.size = 5
    
    # Rim light (back light for depth)
    bpy.ops.object.light_add(type='AREA', location=(0, 5, 3))
    rim_light = bpy.context.active_object
    rim_light.data.energy = 2.0
    rim_light.data.size = 3

def setup_render_settings(width=1920, height=1080, samples=128):
    """Configure render settings for high quality"""
    scene = bpy.context.scene
    
    # Resolution
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    
    # Use Cycles for better quality (or EEVEE for speed)
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    
    # Transparent background
    scene.render.film_transparent = True
    
    # Output format
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

def create_rotation_animation(obj, num_frames=120):
    """Create smooth rotation animation on multiple axes"""
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = num_frames
    
    # Set keyframe at start (0 degrees on both axes)
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert(data_path="rotation_euler", frame=1)
    
    # Set keyframe at end (360 degrees on Z axis, 180 degrees on X axis)
    # This creates a nice tumbling effect
    obj.rotation_euler = (math.radians(180), 0, math.radians(360))
    obj.keyframe_insert(data_path="rotation_euler", frame=num_frames)
    
    # Make animation loop smoothly with linear interpolation
    for fcurve in obj.animation_data.action.fcurves:
        for keyframe in fcurve.keyframe_points:
            keyframe.interpolation = 'LINEAR'

def render_animation(output_dir):
    """Render animation to PNG sequence"""
    scene = bpy.context.scene
    
    # Set output path
    output_path = os.path.join(output_dir, "frame_")
    scene.render.filepath = output_path
    
    print(f"Rendering {scene.frame_end} frames...")
    
    # Render animation
    bpy.ops.render.render(animation=True)
    
    print("Rendering complete!")
    
    return output_dir

def convert_frames_to_gif(frame_dir, output_gif, fps=30, optimize=True):
    """Convert PNG frames to GIF using Pillow"""
    try:
        from PIL import Image
    except ImportError:
        print("ERROR: Pillow not installed. Install with: pip install pillow")
        return False
    
    print(f"Converting frames to GIF...")
    
    # Get all PNG files
    frame_files = sorted([f for f in os.listdir(frame_dir) if f.endswith('.png')])
    
    if not frame_files:
        print("ERROR: No PNG frames found!")
        return False
    
    # Load frames
    frames = []
    for frame_file in frame_files:
        frame_path = os.path.join(frame_dir, frame_file)
        img = Image.open(frame_path)
        frames.append(img)
    
    # Calculate duration per frame (in milliseconds)
    duration = int(1000 / fps)
    
    # Save as GIF
    frames[0].save(
        output_gif,
        save_all=True,
        append_images=frames[1:],
        duration=duration,
        loop=0,
        optimize=optimize
    )
    
    print(f"GIF saved to: {output_gif}")
    
    # Clean up PNG frames (optional)
    cleanup = input("Delete PNG frames? (y/n): ").lower()
    if cleanup == 'y':
        for frame_file in frame_files:
            os.remove(os.path.join(frame_dir, frame_file))
        print("Frames cleaned up!")
    
    return True

def main():
    """Main conversion function"""
    # Parse arguments (after '--')
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    
    parser = argparse.ArgumentParser(description="Convert 3D model to GIF")
    parser.add_argument('--input', '-i', required=True, help='Input model file (GLTF/GLB/STEP)')
    parser.add_argument('--output', '-o', required=True, help='Output GIF file')
    parser.add_argument('--width', '-w', type=int, default=1920, help='Width (default: 1920)')
    parser.add_argument('--height', type=int, default=1080, help='Height (default: 1080)')
    parser.add_argument('--frames', '-f', type=int, default=120, help='Number of frames (default: 120)')
    parser.add_argument('--fps', type=int, default=30, help='FPS (default: 30)')
    parser.add_argument('--samples', '-s', type=int, default=128, help='Render samples (default: 128)')
    
    args = parser.parse_args(argv)
    
    # Validate input file
    if not os.path.exists(args.input):
        print(f"ERROR: Input file not found: {args.input}")
        sys.exit(1)
    
    # Create temp directory for frames
    output_dir = Path(args.output).parent / "temp_frames"
    output_dir.mkdir(exist_ok=True)
    
    print("=" * 60)
    print("3D Model to GIF Converter")
    print("=" * 60)
    print(f"Input:  {args.input}")
    print(f"Output: {args.output}")
    print(f"Resolution: {args.width}x{args.height}")
    print(f"Frames: {args.frames} @ {args.fps} FPS")
    print("=" * 60)
    
    # Step 1: Setup scene
    print("\n[1/7] Setting up scene...")
    setup_scene()
    
    # Step 2: Import model
    print("[2/7] Importing model...")
    objects = import_model(args.input)
    
    # Step 3: Center and scale
    print("[3/7] Centering and scaling model...")
    obj = center_and_scale_objects(objects)
    
    # Step 4: Setup camera
    print("[4/7] Setting up camera...")
    setup_camera()
    
    # Step 5: Setup lighting
    print("[5/7] Setting up lighting...")
    setup_lighting()
    
    # Step 6: Configure render settings
    print("[6/7] Configuring render settings...")
    setup_render_settings(args.width, args.height, args.samples)
    
    # Step 7: Create animation
    print("[7/7] Creating rotation animation...")
    create_rotation_animation(obj, args.frames)
    
    # Render
    render_animation(str(output_dir))
    
    # Convert to GIF
    convert_frames_to_gif(str(output_dir), args.output, args.fps)
    
    print("\n" + "=" * 60)
    print("DONE! 🎉")
    print("=" * 60)

if __name__ == "__main__":
    main()
