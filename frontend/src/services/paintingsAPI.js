// Paintings API Service
// This file provides functions to manage paintings data

const API_BASE_URL = '/data';

/**
 * Fetch all paintings from the JSON file
 * @returns {Promise<Array>} Array of painting objects
 */
export const fetchPaintings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/paintings.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.paintings || [];
  } catch (error) {
    console.error('Error fetching paintings:', error);
    throw error;
  }
};

/**
 * Fetch a single painting by ID
 * @param {number|string} id - The painting ID
 * @returns {Promise<Object|null>} Painting object or null if not found
 */
export const fetchPaintingById = async (id) => {
  try {
    const paintings = await fetchPaintings();
    return paintings.find(painting => painting.id === parseInt(id)) || null;
  } catch (error) {
    console.error('Error fetching painting by ID:', error);
    throw error;
  }
};

/**
 * Search paintings by query (title, artist, or description)
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching painting objects
 */
export const searchPaintings = async (query) => {
  try {
    const paintings = await fetchPaintings();
    const lowerQuery = query.toLowerCase();
    
    return paintings.filter(painting => 
      painting.description.toLowerCase().includes(lowerQuery) ||
      painting.artist.toLowerCase().includes(lowerQuery) ||
      painting.story.toLowerCase().includes(lowerQuery) ||
      painting.interpretation.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Error searching paintings:', error);
    throw error;
  }
};

/**
 * Get paintings by artist
 * @param {string} artistName - Artist name
 * @returns {Promise<Array>} Array of painting objects by the artist
 */
export const getPaintingsByArtist = async (artistName) => {
  try {
    const paintings = await fetchPaintings();
    return paintings.filter(painting => 
      painting.artist.toLowerCase().includes(artistName.toLowerCase())
    );
  } catch (error) {
    console.error('Error getting paintings by artist:', error);
    throw error;
  }
};

/**
 * Get paintings by time period
 * @param {number} startYear - Start year
 * @param {number} endYear - End year
 * @returns {Promise<Array>} Array of painting objects from the time period
 */
export const getPaintingsByPeriod = async (startYear, endYear) => {
  try {
    const paintings = await fetchPaintings();
    return paintings.filter(painting => {
      const yearMatch = painting.year.match(/(\d{4})/);
      if (yearMatch) {
        const paintingYear = parseInt(yearMatch[1]);
        return paintingYear >= startYear && paintingYear <= endYear;
      }
      return false;
    });
  } catch (error) {
    console.error('Error getting paintings by period:', error);
    throw error;
  }
};

/**
 * Validate painting object structure
 * @param {Object} painting - Painting object to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validatePainting = (painting) => {
  const requiredFields = ['id', 'img', 'description', 'artist', 'year'];
  return requiredFields.every(field => painting.hasOwnProperty(field) && painting[field]);
};

/**
 * Get random paintings
 * @param {number} count - Number of random paintings to return
 * @returns {Promise<Array>} Array of random painting objects
 */
export const getRandomPaintings = async (count = 5) => {
  try {
    const paintings = await fetchPaintings();
    const shuffled = paintings.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  } catch (error) {
    console.error('Error getting random paintings:', error);
    throw error;
  }
};

// Export default object with all functions
const paintingsAPI = {
  fetchPaintings,
  fetchPaintingById,
  searchPaintings,
  getPaintingsByArtist,
  getPaintingsByPeriod,
  validatePainting,
  getRandomPaintings
};

export default paintingsAPI;
