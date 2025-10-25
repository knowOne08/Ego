# 🔧 Troubleshooting 3D Models

## ✅ Fixed Issues:

### Problem: Model lags/freezes the page
**Solution:** ✅ **SOLVED**
- Converted C6 from GLTF (35MB) to GLB (11MB) - **3x smaller!**
- Reduced performance overhead
- Added performance optimizations to viewer

### Problem: Model doesn't show up
**Possible causes:**
1. ❌ Using GLTF instead of GLB
2. ❌ Wrong file path in content_option.js
3. ❌ Model file not in `/public/models/` folder
4. ❌ Browser console errors

## 🚀 Quick Fixes:

### 1. Convert GLTF to GLB
```bash
cd frontend/public/models
./convert-model.sh your-model.gltf
```

### 2. Check File Path
In `content_option.js`:
```javascript
modelPath: "/models/c6.glb"  // ✅ Correct
modelPath: "models/c6.glb"   // ❌ Missing leading slash
modelPath: "/models/c6.gltf" // ❌ Should be .glb
```

### 3. Check Browser Console
Open DevTools (F12) → Console tab
Look for errors like:
- "Failed to load"
- "404 Not Found"
- "GLTF parse error"

### 4. Verify File Location
```bash
ls frontend/public/models/
# Should show: c6.glb
```

## 📊 Performance Tips:

### Recommended File Sizes:
- ✅ **Small**: < 5MB (great performance)
- ⚠️ **Medium**: 5-15MB (good, may load slower)
- ❌ **Large**: > 15MB (convert to GLB or simplify model)

### Optimize Your Model:
1. **In Blender:**
   - Decimate geometry (reduce polygon count)
   - Reduce texture sizes
   - Remove unnecessary objects

2. **Command Line:**
   ```bash
   gltf-pipeline -i input.gltf -o output.glb -d
   ```
   The `-d` flag enables Draco compression

## 🎯 Current Setup:

**C6 Project:**
- File: `/public/models/c6.glb`
- Size: 11MB (optimized from 35MB)
- Path in code: `modelPath: "/models/c6.glb"`
- Status: ✅ Ready to use

## 🔍 Debugging Checklist:

- [ ] Model is in `.glb` format (not `.gltf`)
- [ ] File is in `/frontend/public/models/`
- [ ] Path starts with `/models/` in content_option.js
- [ ] File size is reasonable (< 15MB)
- [ ] Browser console shows no errors
- [ ] Page doesn't freeze when loading

## 💡 Pro Tips:

1. **Lazy Loading:** Models are loaded only when needed
2. **Performance Mode:** Canvas uses `powerPreference: "high-performance"`
3. **Error Handling:** Check console for detailed error messages
4. **Scale Adjustment:** Change `scale={2}` in PCBViewer.js if model is too big/small
5. **Camera Position:** Adjust `position={[0, 0, 8]}` if model is not centered

## 📝 Notes:

- GLTF with embedded data = HUGE file (884k lines, 35MB)
- GLB binary format = Optimized (11MB)
- Always use GLB for web applications
- Keep textures under 2048x2048 for best performance
