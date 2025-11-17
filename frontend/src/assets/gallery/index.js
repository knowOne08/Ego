// Central image registry for the art gallery
// This approach allows for better performance, bundling, and caching

// Import all images
import AmericanGothic from './AmericanGothic.jpg';
import SchoolOfAthens from './TheSchoolOfAthens.jpg';
import Nighthawks from './Nighthawks.jpg';
import DeathOfSocrates from './TheDeathOfSocrates.jpg';
import GirlWithPearlEarring from './GirlWithAPearlEarring.jpg';
import StarryNight from './StarryNight.jpg';
import WandererAboveSeaFog from './WandererAboveSeaFog.jpg';
import PersistenceOfMemory from './ThePersistenceOfMemory.jpg';
import MonaLisa from './MonaLisa.jpg';
import SelfPortraitBandagedEar from './TheVanGogh.jpg';
import CreationOfAdam from './CreationOfAdam.jpg';
import EchoAndNarcissus from './EchoAndNarcissus.jpg';

// Image mapping object
export const galleryImages = {
  1: AmericanGothic,
  2: SchoolOfAthens,
  3: Nighthawks,
  4: DeathOfSocrates,
  5: GirlWithPearlEarring,
  6: StarryNight,
  7: WandererAboveSeaFog,
  8: PersistenceOfMemory,
  9: MonaLisa,
  10: SelfPortraitBandagedEar,
  11: CreationOfAdam,
  12: EchoAndNarcissus
};

// Alternative function to get image by ID
export const getImageById = (id) => {
  return galleryImages[id] || null;
};

// Function to get all images
export const getAllImages = () => {
  return galleryImages;
};
