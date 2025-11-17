import React, { useState, useEffect, useRef, useMemo } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Link } from "react-router-dom";
import { meta } from "../../content_option";
import { fetchPaintings } from "../../services/paintingsAPI";
import { getImageById } from "../../assets/gallery";
import "./style.css";

export const ArtGallery = () => {
  const canvasRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [hoveredPainting, setHoveredPainting] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [paintings, setPaintings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hoverTimeoutRef = useRef(null);

  // Load paintings from external JSON file
  useEffect(() => {
    const loadPaintings = async () => {
      try {
        setLoading(true);
        const paintingsData = await fetchPaintings();
        
        // Combine paintings data with local images
        const paintingsWithImages = paintingsData.map(painting => ({
          ...painting,
          img: getImageById(painting.id)
        }));
        
        setPaintings(paintingsWithImages);
        setError(null);
      } catch (err) {
        console.error('Failed to load paintings:', err);
        setError('Failed to load gallery. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadPaintings();
  }, []);

  // Plus Studio inspired grid spans - varied sizes based on aspect ratios
  const getGridSpans = useMemo(() => {
    if (!paintings.length) return [];
    return paintings.map((painting, index) => {
      // Use aspect ratio to determine grid spans
      let rowSpan = 1;
      let colSpan = 1;
      
      if (painting.aspectRatio) {
        // Wide images (like Nighthawks, Creation of Adam) get wider spans
        if (painting.aspectRatio >= 1.8) {
          colSpan = 2;
          rowSpan = 1;
        }
        // Tall images (like Mona Lisa, portraits) - keep single row for mobile
        else if (painting.aspectRatio <= 0.7) {
          colSpan = 1;
          rowSpan = 1; // Keep consistent for mobile to prevent overlap
        }
        // Square-ish images occasionally get double spans for variety
        else if (index % 7 === 0 && painting.aspectRatio > 1.2) {
          colSpan = 2;
          rowSpan = 1;
        }
      } else {
          // Fallback pattern - remove unused variables
          // const rowSpan = index % 4 === 0 ? 2 : 1;
          // const colSpan = index % 6 === 0 ? 2 : 1;
        }
      
      return { rowSpan, colSpan };
    });
  }, [paintings]);

  // Canvas configuration for optimal viewing
  const canvasSize = 2000;
  const padding = 250;
  const availableSpace = canvasSize - (2 * padding);

  // Simplified image component for local assets
  const OptimizedImage = ({ painting, className, isMobile = false }) => {
    return (
      <img
        src={painting.img}
        alt={painting.description}
        className={className}
        loading={isMobile ? "eager" : "lazy"}
        decoding="async"
        onError={(e) => {
          // Fallback SVG placeholder for broken images
          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE2MCIgcj0iNDAiIGZpbGw9IiNkZGUiLz48cGF0aCBkPSJNMTYwIDI0MGg4MHYxNmgtODB6IiBmaWxsPSIjZGRlIi8+PHRleHQgeD0iNTAlIiB5PSI3NSUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBVbmF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
        }}
        style={isMobile ? {} : {
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
    );
  };

  // Generate painting positions with proper collision detection and correct aspect ratios
  const paintingPositions = useMemo(() => {
    if (!paintings.length) return [];
    
    const positions = [];
    const placedPaintings = [];
    const maxImageSize = 280;
    const minSpacing = 25;
    
    // Create cluster centers for dense, non-uniform distribution
    const clusterCenters = [
      { x: availableSpace * 0.25, y: availableSpace * 0.3 },
      { x: availableSpace * 0.75, y: availableSpace * 0.25 },
      { x: availableSpace * 0.3, y: availableSpace * 0.7 },
      { x: availableSpace * 0.8, y: availableSpace * 0.75 }
    ];

    // Calculate image dimensions using actual aspect ratios from JSON
    paintings.forEach((painting, index) => {
      let width = maxImageSize;
      let height = maxImageSize;
      
      // Use aspect ratio from JSON data if available
      if (painting.aspectRatio) {
        if (painting.aspectRatio > 1) {
          // Landscape orientation
          width = maxImageSize;
          height = maxImageSize / painting.aspectRatio;
        } else {
          // Portrait orientation  
          width = maxImageSize * painting.aspectRatio;
          height = maxImageSize;
        }
      } else {
        // Fallback to square if no aspect ratio provided
        width = maxImageSize * 0.9;
        height = maxImageSize * 0.9;
      }
      
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;
      
      while (!placed && attempts < maxAttempts) {
        let x, y;
        
        if (attempts < 50) {
          // Try cluster-based placement for density
          const cluster = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
          const clusterRadius = 200;
          const angle = Math.random() * 2 * Math.PI;
          const distance = Math.random() * clusterRadius;
          
          x = cluster.x + Math.cos(angle) * distance;
          y = cluster.y + Math.sin(angle) * distance;
        } else {
          // Fallback to random placement
          x = Math.random() * (availableSpace - width);
          y = Math.random() * (availableSpace - height);
        }
        
        // Ensure position is within bounds
        x = Math.max(0, Math.min(availableSpace - width, x));
        y = Math.max(0, Math.min(availableSpace - height, y));
        
        const newPainting = { x, y, width, height, index };
        
        // Check for overlaps
        const hasOverlap = placedPaintings.some(placed => {
          return !(
            newPainting.x > placed.x + placed.width + minSpacing ||
            placed.x > newPainting.x + newPainting.width + minSpacing ||
            newPainting.y > placed.y + placed.height + minSpacing ||
            placed.y > newPainting.y + newPainting.height + minSpacing
          );
        });
        
        if (!hasOverlap) {
          placedPaintings.push(newPainting);        positions[index] = {
          ...painting,
          id: painting.id || index,
          x: x + padding,
          y: y + padding,
          width,
          height
        };
          placed = true;
        }
        
        attempts++;
      }
      
      // Fallback grid placement
      if (!placed) {
        const gridCols = Math.ceil(Math.sqrt(paintings.length));
        const gridSpacing = availableSpace / gridCols;
        const row = Math.floor(index / gridCols);
        const col = index % gridCols;
        
        positions[index] = {
          ...painting,
          id: painting.id || index,
          x: padding + (col * gridSpacing) + (gridSpacing - width) / 2,
          y: padding + (row * gridSpacing) + (gridSpacing - height) / 2,
          width,
          height
        };
      }
    });
    
    return positions.filter(Boolean);
  }, [paintings, availableSpace, padding]);

  const handleTouchStart = (painting) => {
    if (isMobile) {
      setHoveredPainting(painting);
    }
  };

  const handlePaintingHover = (painting) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredPainting(painting);
  };

  const handlePaintingLeave = () => {
    // Add a small delay to prevent flickering when moving between elements
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredPainting(null);
    }, 100);
  };

  // Handle mouse movement for smooth parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isMobile) {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        setMousePosition({ x, y });
      }
    };

    const handleTouchMove = (e) => {
      if (isMobile && e.touches.length > 0) {
        const touch = e.touches[0];
        const x = (touch.clientX / window.innerWidth) * 100;
        const y = (touch.clientY / window.innerHeight) * 100;
        setMousePosition({ x, y });
      }
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      
      // Clean up hover timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [isMobile]);

  // Loading state
  if (loading) {
    return (
      <HelmetProvider>
        <Helmet>
          <meta charSet="utf-8" />
          <title>{`Art Gallery | ${meta.title}`}</title>
          <meta name="description" content={meta.description} />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </Helmet>
        
        <div className="gallery-main">
          <div className="gallery-loading">
            <div className="loading-spinner"></div>
            <p>Loading gallery...</p>
          </div>
        </div>
      </HelmetProvider>
    );
  }

  // Error state
  if (error) {
    return (
      <HelmetProvider>
        <Helmet>
          <meta charSet="utf-8" />
          <title>{`Art Gallery | ${meta.title}`}</title>
          <meta name="description" content={meta.description} />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </Helmet>
        
        <div className="gallery-main">
          <div className="gallery-error">
            <h2>Gallery Unavailable</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        </div>
      </HelmetProvider>
    );
  }

  // Main render;

  return (      <HelmetProvider>
        <Helmet>
          <meta charSet="utf-8" />
          <title>{`Art Gallery | ${meta.title}`}</title>
          <meta name="description" content={meta.description} />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </Helmet>
        
        <div 
          className="gallery-main" 
          onMouseLeave={() => {
            // Clear any timeout and immediately hide overlay when leaving gallery area
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            setHoveredPainting(null);
          }}
        >
        {isMobile ? (
          /* Mobile Grid Layout - Plus Studio inspired */
          <div className="mobile-gallery-grid">
            <div className="mobile-grid-container">
              {paintings.map((painting, index) => {
                const spans = getGridSpans[index];
                return (
                  <div
                    key={index}
                    className={`mobile-grid-item ${hoveredPainting?.id === index ? 'is-hovered' : ''}`}
                    style={{
                      gridRow: `span ${spans.rowSpan}`,
                      gridColumn: `span ${spans.colSpan}`,
                      '--item-aspect-ratio': painting.aspectRatio || 1
                    }}
                    onMouseEnter={() => handlePaintingHover({...painting, id: index})}
                    onMouseLeave={handlePaintingLeave}
                    onTouchStart={() => handleTouchStart({...painting, id: index})}
                    onTouchEnd={() => {/* Keep overlay visible for mobile */}}
                  >
                    <Link to={`/${painting.link}`} className="mobile-artwork-link">
                      <div className="mobile-artwork-container">
                        <OptimizedImage 
                          painting={painting} 
                          className="mobile-artwork-image" 
                          isMobile={true} 
                        />
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
            
            {/* Mobile navigation hint */}
            <div className="mobile-navigation-hint">
              <p>Tap any artwork for details • {paintings.length} artworks</p>
            </div>
          </div>
        ) : (
          /* Desktop Parallax Layout */
          <>
            {/* Base canvas layer (z-index: 1) */}
            <div className="infinite-canvas" ref={canvasRef}>
              <div 
                className="canvas-container"
                style={{
                  width: `${canvasSize}px`,
                  height: `${canvasSize}px`,
                  transform: `translate(${-canvasSize/2 + 50 + (mousePosition.x - 50) * -7}px, ${-canvasSize/2 + 50 + (mousePosition.y - 50) * -6}px)`,
                }}
              >
                {paintingPositions.map((painting) => (
                  <div
                    key={painting.id}
                    className={`floating-artwork ${hoveredPainting?.id === painting.id ? 'is-hovered' : ''}`}
                    style={{
                      left: `${painting.x}px`,
                      top: `${painting.y}px`,
                      width: `${painting.width}px`,
                      height: `${painting.height}px`,
                    }}
                    onMouseEnter={() => handlePaintingHover(painting)}
                    onMouseLeave={handlePaintingLeave}
                  >
                    <Link to={`/${painting.link}`} className="artwork-link">
                      <OptimizedImage 
                        painting={painting} 
                        className="artwork-image" 
                        isMobile={false} 
                      />
                    </Link>
                  </div>
                ))}
              </div>
              
              {/* Navigation hint */}
              <div className="navigation-hint">
                <p>Move your cursor to explore • {paintings.length} artworks</p>
                <small>Hover over any artwork for details</small>
              </div>
            </div>
          </>
        )}
        
        {/* Overlay layer (z-index: 100) - appears when hovering */}
        {hoveredPainting && (
          <div 
            className={`artwork-title-overlay ${hoveredPainting ? 'visible' : ''}`}
            style={{ pointerEvents: 'none' }} // Allow mouse events to pass through
          >
            <div className="artwork-title-text">
              <h1 className="artwork-name">{hoveredPainting.description}</h1>
              <p className="artwork-artist">by {hoveredPainting.artist || 'Unknown Artist'}</p>
            </div>
          </div>
        )}
      </div>
    </HelmetProvider>
  );
};