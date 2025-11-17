/**
 * Gallery Debug Utilities
 * Helper functions to identify and fix common issues with the art gallery
 */

import { fetchPaintings } from '../services/paintingsAPI';
import { getImageById, getAllImages } from '../assets/gallery';

/**
 * Check for mismatches between paintings data and available images
 */
export const checkGalleryIntegrity = async () => {
  try {
    const paintings = await fetchPaintings();
    const availableImages = getAllImages();
    
    console.log('🎨 Gallery Integrity Check');
    console.log('==========================');
    
    // Check for paintings without images
    const paintingsWithoutImages = paintings.filter(painting => {
      const image = getImageById(painting.id);
      return !image;
    });
    
    if (paintingsWithoutImages.length > 0) {
      console.warn('⚠️ Paintings missing images:');
      paintingsWithoutImages.forEach(painting => {
        console.warn(`  - ID ${painting.id}: ${painting.description} (${painting.artist})`);
      });
    }
    
    // Check for images without paintings
    const imageIds = Object.keys(availableImages).map(id => parseInt(id));
    const paintingIds = paintings.map(p => p.id);
    const orphanedImages = imageIds.filter(id => !paintingIds.includes(id));
    
    if (orphanedImages.length > 0) {
      console.warn('⚠️ Images without corresponding paintings:');
      orphanedImages.forEach(id => {
        console.warn(`  - Image ID ${id} has no painting data`);
      });
    }
    
    // Check for broken links
    const brokenLinks = paintings.filter(painting => {
      return !painting.link || painting.link.trim() === '';
    });
    
    if (brokenLinks.length > 0) {
      console.warn('⚠️ Paintings with missing or empty links:');
      brokenLinks.forEach(painting => {
        console.warn(`  - ID ${painting.id}: ${painting.description}`);
      });
    }
    
    // Success message
    if (paintingsWithoutImages.length === 0 && orphanedImages.length === 0 && brokenLinks.length === 0) {
      console.log('✅ All checks passed! Gallery integrity is good.');
    }
    
    console.log('\n📊 Gallery Stats:');
    console.log(`  - Total paintings: ${paintings.length}`);
    console.log(`  - Total images: ${imageIds.length}`);
    console.log(`  - Paintings with images: ${paintings.length - paintingsWithoutImages.length}`);
    
    return {
      totalPaintings: paintings.length,
      totalImages: imageIds.length,
      paintingsWithoutImages,
      orphanedImages,
      brokenLinks,
      isHealthy: paintingsWithoutImages.length === 0 && orphanedImages.length === 0 && brokenLinks.length === 0
    };
    
  } catch (error) {
    console.error('❌ Error checking gallery integrity:', error);
    return null;
  }
};

/**
 * Generate template for adding a new painting
 */
export const generatePaintingTemplate = (id) => {
  return {
    "id": id,
    "description": "Painting Title",
    "link": "art_gallery/painting_url_slug",
    "artist": "Artist Name",
    "year": "Year",
    "medium": "Medium (e.g., Oil on canvas)",
    "dimensions": "Height × Width (e.g., 100 cm × 80 cm)",
    "location": "Current Location/Museum",
    "imageWidth": 800,
    "imageHeight": 1000,
    "aspectRatio": 0.8,
    "story": "Brief story about the painting's creation, context, or history.",
    "interpretation": "Analysis of the painting's meaning, symbolism, and artistic significance.",
    "significance": "Why this painting is important in art history or cultural context."
  };
};

/**
 * Find the next available ID for a new painting
 */
export const getNextAvailableId = async () => {
  try {
    const paintings = await fetchPaintings();
    const maxId = Math.max(...paintings.map(p => p.id));
    return maxId + 1;
  } catch (error) {
    console.error('Error finding next available ID:', error);
    return null;
  }
};

/**
 * List all paintings with their image status
 */
export const listPaintingsWithImageStatus = async () => {
  try {
    const paintings = await fetchPaintings();
    
    console.log('🖼️ Gallery Inventory');
    console.log('===================');
    
    paintings.forEach(painting => {
      const hasImage = !!getImageById(painting.id);
      const status = hasImage ? '✅' : '❌';
      console.log(`${status} ID ${painting.id}: ${painting.description} (${painting.artist})`);
      if (!hasImage) {
        console.log(`    Missing image for link: /art_gallery/${painting.link.split('/').pop()}`);
      }
    });
    
    return paintings;
  } catch (error) {
    console.error('Error listing paintings:', error);
    return [];
  }
};

// Run integrity check automatically in development
if (process.env.NODE_ENV === 'development') {
  // Delay to ensure app is loaded
  setTimeout(() => {
    checkGalleryIntegrity();
  }, 2000);
}
