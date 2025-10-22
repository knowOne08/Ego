import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container } from "react-bootstrap";
import { dataportfolio } from "../../content_option";
import ProjectScene3D from "../../components/3d/ProjectScene3D";
import "./style.css";

export const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
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

        {/* Cinematic Hero */}
        <section className="hero-cinematic" ref={heroRef}>
          <div className="hero-bg">
            <div className="hero-gradient"></div>
            <div className="hero-noise"></div>
          </div>
          
          {/* 3D Scene Background */}
          <ProjectScene3D 
            project={project} 
            className="hero-3d-scene"
            intensity={0.8}
          />
          
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
          </div>

          <div className="hero-visual">
            <div className="visual-container">
              <div className="project-artwork">
                <div className="artwork-placeholder">
                  <div className="artwork-pattern"></div>
                  <div className="artwork-glow"></div>
                </div>
              </div>
            </div>
          </div>

          <div className={`hero-scroll-indicator ${!showScrollIndicator ? 'hidden' : ''}`}>
            <div className="scroll-line"></div>
            <span className="scroll-text">Scroll to explore</span>
          </div>
        </section>

        {/* Project Essence */}
        <section className="section-essence">
          <Container>
            <div className="essence-grid">
              <div className="essence-item">
                <div className="essence-number">01</div>
                <div className="essence-content">
                  <h3>Duration</h3>
                  <p>{project.duration || "3 months"}</p>
                </div>
              </div>
              <div className="essence-item">
                <div className="essence-number">02</div>
                <div className="essence-content">
                  <h3>Approach</h3>
                  <p>{project.teamSize || "Solo Development"}</p>
                </div>
              </div>
              {project.funding && (
                <div className="essence-item">
                  <div className="essence-number">03</div>
                  <div className="essence-content">
                    <h3>Support</h3>
                    <p>{project.funding}</p>
                  </div>
                </div>
              )}
              <div className="essence-item">
                <div className="essence-number">04</div>
                <div className="essence-content">
                  <h3>Impact</h3>
                  <p>{project.metrics?.users || "Significant reach"}</p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* The Vision */}
        <section className="section-vision">
          <Container>
            <div className="vision-layout">
              <div className="vision-text">
                <div className="section-label">The Vision</div>
                <h2 className="vision-title">
                  {project.problem || "Every great creation begins with a question that demands an answer."}
                </h2>
              </div>
              <div className="vision-visual">
                <div className="vision-artwork">
                  <div className="generative-art-placeholder">
                    <div className="art-layer layer-1"></div>
                    <div className="art-layer layer-2"></div>
                    <div className="art-layer layer-3"></div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Technology Constellation */}
        <section className="section-constellation">
          <Container>
            <div className="constellation-header">
              <div className="section-label">Technology Stack</div>
              <h2>The Tools of Creation</h2>
            </div>
            <div className="constellation-grid">
              {project.technologies.map((tech, index) => (
                <div key={index} className="constellation-item" style={{'--delay': `${index * 0.1}s`}}>
                  <div className="tech-orb">
                    <div className="orb-glow"></div>
                    <div className="orb-core"></div>
                  </div>
                  <span className="tech-name">{tech}</span>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* The Process */}
        <section className="section-process">
          <Container>
            <div className="process-header">
              <div className="section-label">The Journey</div>
              <h2>From Concept to Reality</h2>
            </div>
            
            <div className="process-narrative">
              <div className="narrative-text">
                <p className="narrative-description">
                  {project.solution || "The path from idea to implementation is rarely linear. It's a journey of discovery, iteration, and refinement."}
                </p>
              </div>
            </div>

            {project.subProjects && (
              <div className="process-components">
                <h3 className="components-title">Architecture</h3>
                <div className="components-artistic">
                  {project.subProjects.map((sub, index) => (
                    <div key={index} className="component-artistic">
                      <div className="component-icon">
                        <div className="icon-shape"></div>
                      </div>
                      <div className="component-content">
                        <h4>{sub.name}</h4>
                        <p>{sub.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Container>
        </section>

        {/* Impact Visualization */}
        <section className="section-impact">
          <Container>
            <div className="impact-layout">
              <div className="impact-visual">
                <div className="impact-chart">
                  <div className="chart-bg"></div>
                  <div className="chart-data">
                    <div className="data-point" data-value={project.metrics?.performance || "95%"}>
                      <div className="point-glow"></div>
                      <span className="point-label">Performance</span>
                    </div>
                    <div className="data-point" data-value={project.metrics?.accuracy || "98%"}>
                      <div className="point-glow"></div>
                      <span className="point-label">Accuracy</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="impact-content">
                <div className="section-label">Impact</div>
                <h2>Measuring Success</h2>
                <p>{project.technicalLearnings || "Success is measured not just in numbers, but in the problems solved and the boundaries pushed."}</p>
              </div>
            </div>
          </Container>
        </section>

        {/* Reflections */}
        <section className="section-reflections">
          <Container>
            <div className="reflections-content">
              <div className="section-label">Reflections</div>
              <h2>Lessons from the Journey</h2>
              
              <div className="reflections-grid">
                <div className="reflection-item">
                  <div className="reflection-quote">
                    "{project.managementLearnings || 'Every project teaches us something new about ourselves and our craft.'}"
                  </div>
                </div>
                <div className="reflection-item">
                  <h4>Future Horizons</h4>
                  <p>{project.futureImprovements || "The end of one project is the beginning of the next question."}</p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Related Works */}
        <section className="section-related">
          <Container>
            <div className="related-header">
              <div className="section-label">Related Works</div>
              <h2>Continue the Journey</h2>
            </div>
            <div className="related-artistic">
              {dataportfolio
                .filter(p => p.category === project.category && p.title !== project.title)
                .slice(0, 3)
                .map((relatedProject, index) => (
                  <Link 
                    key={index} 
                    to={`/project/${relatedProject.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className="related-artistic-card"
                  >
                    <div className="card-visual">
                      <div className="card-pattern"></div>
                    </div>
                    <div className="card-content">
                      <span className="card-category">{relatedProject.category}</span>
                      <h3>{relatedProject.title}</h3>
                      <p>{relatedProject.description}</p>
                    </div>
                    <div className="card-hover-effect"></div>
                  </Link>
                ))}
            </div>
          </Container>
        </section>
      </div>
    </HelmetProvider>
  );
};
