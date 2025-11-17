import React, { useState, useEffect } from "react";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { meta } from "../../content_option";
import { getImageById } from "../../assets/gallery";
import { fetchPaintings } from "../../services/paintingsAPI";

export const ArtCard = () => {
  const [paintingCard, setPaintingCard] = useState({});
  const [loading, setLoading] = useState(true);
  const [localImage, setLocalImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadPaintingData = async () => {
      try {
        const currentUrl = window.location.href;
        const paintings = await fetchPaintings();
        
        let foundPainting = {};
        paintings.forEach((painting) => {
          if (currentUrl.includes(painting.link)) {
            foundPainting = painting;
          }
        });
        
        if (Object.keys(foundPainting).length === 0) {
          console.warn('No painting found for current URL:', currentUrl);
        }
        
        setPaintingCard(foundPainting);
        
        // Get the local image for this painting
        if (foundPainting.id) {
          const image = getImageById(foundPainting.id);
          if (image) {
            setLocalImage(image);
          } else {
            console.warn(`No local image found for painting ID: ${foundPainting.id}`);
            setImageError(true);
          }
        }
      } catch (error) {
        console.error('Failed to load painting data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPaintingData();
  }, []);

  const handleImageError = () => {
    setImageError(true);
  };

  const renderFallbackImage = () => (
    <div className="image-fallback">
      <svg viewBox="0 0 400 300" style={{ width: '100%', maxWidth: '400px', height: 'auto' }}>
        <rect width="400" height="300" fill="#f0f0f0" stroke="#ccc" strokeWidth="2"/>
        <text x="200" y="150" textAnchor="middle" fill="#888" fontSize="16">
          Image Unavailable
        </text>
        <text x="200" y="175" textAnchor="middle" fill="#888" fontSize="14">
          {paintingCard.description}
        </text>
      </svg>
    </div>
  );

  const downloadImage = async () => {
    if (!localImage || imageError || downloading) {
      console.warn('No image available for download or download in progress');
      return;
    }

    try {
      setDownloading(true);
      
      // Generate safe filename
      const safeTitle = paintingCard.description?.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase() || 'artwork';
      const safeArtist = paintingCard.artist?.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase() || 'unknown';
      const filename = `${safeTitle}_${safeArtist}.jpg`;
      
      // Check if the browser supports the download attribute
      const link = document.createElement('a');
      const supportsDownload = 'download' in link;
      
      if (supportsDownload) {
        // Modern browsers - use fetch and blob
        try {
          const response = await fetch(localImage);
          if (!response.ok) throw new Error('Network response was not ok');
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          link.href = url;
          link.download = filename;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up object URL
          setTimeout(() => window.URL.revokeObjectURL(url), 1000);
          
        } catch (fetchError) {
          console.warn('Fetch failed, trying alternative method:', fetchError);
          // Fallback: direct link download
          link.href = localImage;
          link.download = filename;
          link.target = '_blank';
          link.click();
        }
      } else {
        // Older browsers - open in new tab
        window.open(localImage, '_blank');
      }
      
    } catch (error) {
      console.error('Error downloading image:', error);
      // Final fallback: open image in new tab
      window.open(localImage, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <HelmetProvider>
        <Container fluid className="art-detail-container">
          <Helmet>
            <meta charSet="utf-8" />
            <title>Loading... | {meta.title}</title>
          </Helmet>
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h2>Loading artwork...</h2>
          </div>
        </Container>
      </HelmetProvider>
    );
  }

  // Handle case where painting is not found
  if (!paintingCard.id) {
    return (
      <HelmetProvider>
        <Container fluid className="art-detail-container">
          <Helmet>
            <meta charSet="utf-8" />
            <title>Artwork Not Found | {meta.title}</title>
          </Helmet>
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h2>Artwork Not Found</h2>
            <p>The requested artwork could not be found.</p>
            <a href="/art_gallery" className="back-to-gallery">← Back to Gallery</a>
          </div>
        </Container>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <Container fluid className="art-detail-container">
        <Helmet>
          <meta charSet="utf-8" />
          <title>{paintingCard.description} | {meta.title}</title>
          <meta name="description" content={paintingCard.story} />
        </Helmet>
        
        <Row className="art-detail-header">
          <Col>
            <div className="gallery-navigation">
              <a href="/art_gallery" className="back-to-gallery">← Back to Gallery</a>
            </div>
          </Col>
        </Row>

        {/* Clean Art Display */}
        <Row className="art-hero">
          <Col className="art-container">
            <div className="artwork-frame">
              {localImage && !imageError ? (
                <img 
                  src={localImage} 
                  alt={paintingCard.description}
                  className="artwork-image"
                  onError={handleImageError}
                  loading="lazy"
                />
              ) : (
                renderFallbackImage()
              )}
            </div>
            <div className="artwork-info">
              <h1 className="title">{paintingCard.description}</h1>
              <p className="artist">by {paintingCard.artist}, {paintingCard.year}</p>
            </div>
          </Col>
        </Row>

        {/* Information Below */}
        <Row className="details-section">
          <Col md={4} className="technical-info">
            <div className="info-block">
              <h3>Details</h3>
              <p><strong>Medium:</strong> {paintingCard.medium}</p>
              <p><strong>Size:</strong> {paintingCard.dimensions}</p>
              <p><strong>Location:</strong> {paintingCard.location}</p>
            </div>
          </Col>
          
          <Col md={4} className="story-info">
            <div className="info-block">
              <h3>Context</h3>
              <p>{paintingCard.story}</p>
            </div>
          </Col>
          
          <Col md={4} className="interpretation-info">
            <div className="info-block">
              <h3>Interpretation</h3>
              <p>{paintingCard.interpretation}</p>
            </div>
          </Col>
        </Row>

        {/* Download Button Section */}
        {localImage && !imageError && (
          <Row className="download-section">
            <Col className="text-center">
              <button 
                className={`download-btn ${downloading ? 'downloading' : ''}`}
                onClick={downloadImage}
                disabled={downloading}
                title="Download artwork image"
              >
                {downloading ? (
                  <>
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      className="loading-spinner"
                    >
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M16 12l-4-4-4 4"/>
                      <path d="M12 16V8"/>
                    </svg>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download High-Resolution Image
                  </>
                )}
              </button>
            </Col>
          </Row>
        )}
      </Container>
    </HelmetProvider>
  );
};
