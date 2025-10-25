import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { dataportfolio } from "../../content_option";
import PCBViewer from './PCBViewer'; // RE-ENABLED FOR TESTING
import "./style.css";

export const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem("theme") || "dark");
  const heroRef = useRef(null);

  useEffect(() => {
    const foundProject = dataportfolio.find(p => 
      p.title.toLowerCase().replace(/\s+/g, '-') === projectId
    );
    
    if (foundProject) {
      setProject(foundProject);
      setTimeout(() => setIsLoaded(true), 300);
    } else {
      navigate('/portfolio');
    }
  }, [projectId, navigate]);

  useEffect(() => {
    // Listen for theme changes
    const handleThemeChange = () => {
      const theme = localStorage.getItem("theme") || "dark";
      setCurrentTheme(theme);
    };

    // Initial theme detection
    handleThemeChange();

    // Listen for storage changes (theme changes from other tabs)
    window.addEventListener('storage', handleThemeChange);
    
    // Listen for theme change events within the same window (corrected event name)
    window.addEventListener('themeChanged', (e) => {
      setCurrentTheme(e.detail.theme);
    });

    // Also listen for direct localStorage changes
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme') || 'dark';
      setCurrentTheme(theme);
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('themeChanged', handleThemeChange);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Parallax scrolling effect and scroll indicator visibility
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      
      // Hide scroll indicator after scrolling 100px
      setShowScrollIndicator(scrolled < 100);
      
      if (heroRef.current) {
        const parallax = heroRef.current.querySelector('.hero-bg');
        if (parallax) {
          parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!project) {
    return (
      <div className="project-loading">
        <div className="loading-animation">
          <div className="loading-circle"></div>
          <div className="loading-text">Loading Project</div>
        </div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <div className={`project-detail-artistry ${isLoaded ? 'loaded' : ''}`}>
        <Helmet>
          <meta charSet="utf-8" />
          <title>{project.title} | Ephemeral Projects</title>
          <meta name="description" content={project.description} />
        </Helmet>

        {/* Cinematic Hero - Background switches between 3D model gradient and JPG image based on project.modelPath */}
        <section className="hero-cinematic" ref={heroRef}>
          <div 
            className={`hero-bg ${!project.modelPath ? 'hero-bg-image' : ''}`}
            style={!project.modelPath ? {
              backgroundImage: currentTheme === 'light' 
                ? 'url(/coverarts/whitebg.jpeg)' 
                : 'url(/coverarts/spaceodessyimg.jpeg)'
            } : {}}
          >
            {!project.modelPath && <div className="hero-image-overlay"></div>}
            <div className="hero-gradient"></div>
            <div className="hero-noise"></div>
          </div>
          
          <div className="hero-content">
            <div className="hero-meta">
                <span className="project-category-artistic">{project.category}</span>
                {project.status && <span className="project-status">{project.status}</span>}
            </div>
            
            <h1 className="hero-title">
              <span className="title-line">{project.title}</span>
            </h1>
            
            <div className="hero-description">
              <p className="hero-subtitle">{project.description}</p>
            </div>

            <div className="hero-actions-container">
              <div className="hero-actions">
                {project.link && project.link !== "#" && (
                  <a href={project.link} target="_blank" rel="noopener noreferrer" className="action-btn primary">
                    <span>Explore Project</span>
                    <div className="btn-bg"></div>
                  </a>
                )}
                {project.github && (
                  <a href={project.github} target="_blank" rel="noopener noreferrer" className="action-btn secondary">
                    <span>View Source</span>
                    <div className="btn-bg"></div>
                  </a>
                )}
              </div>
              
              <div className={`hero-scroll-indicator ${!showScrollIndicator ? 'hidden' : ''}`}>
                <div className="scroll-line"></div>
                <span className="scroll-text">Scroll to explore</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-container">
              <div className="project-artwork">
                {project.modelPath ? (
                  <Suspense fallback={
                    <div className="artwork-placeholder">
                      <div className="artwork-pattern"></div>
                      <div className="artwork-glow"></div>
                    </div>
                  }>
                    <PCBViewer 
                      modelPath={project.modelPath}
                    />
                  </Suspense>
                ) : (
                  <div className="artwork-placeholder">
                    <div className="artwork-pattern"></div>
                    <div className="artwork-glow"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon Message */}
        <section className="section-coming-soon">
          <Container>
            <div className="coming-soon-content">
              <h2>Updates Coming Soon</h2>
              <p>Detailed project information will be available soon. Explore other projects in the meantime.</p>
              <Link to="/portfolio" className="back-to-portfolio">
                <span>Explore Other Projects</span>
              </Link>
            </div>
          </Container>
        </section>
      </div>
    </HelmetProvider>
  );
};
