import React from "react";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { dataportfolio, meta } from "../../content_option";

export const Portfolio = () => {
  const mainProjects = dataportfolio.filter(project => project.isMainProject);
  const otherProjects = dataportfolio.filter(project => !project.isMainProject);

  const ProjectCard = ({ project, index }) => {
    const CardContent = () => (
      <div className="project-card mb-4">
        <div className="project-header">
          <h3 className="project-title">
            {project.title}
            {project.status === "ongoing" && <span className="status-badge">ongoing</span>}
          </h3>
          <span className="project-category">{project.category}</span>
        </div>
        
        <div className="project-content">
          <p className="project-description">{project.description}</p>
          
          {project.subProjects && (
            <div className="sub-projects">
              <ul>
                {project.subProjects.map((sub, idx) => (
                  <li key={idx}>
                    <strong>{sub.name}:</strong> {sub.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {project.funding && (
            <div className="funding-info">
              <span className="funding-badge">{project.funding}</span>
            </div>
          )}
          
          <div className="technologies">
            {project.technologies.map((tech, idx) => (
              <span key={idx} className="tech-tag">{tech}</span>
            ))}
          </div>
        </div>
      </div>
    );

    // Make all cards clickable to detail page
    const projectSlug = project.title.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <Link 
        key={index}
        to={`/project/${projectSlug}`}
        className="project-card-link"
      >
        <CardContent />
      </Link>
    );
  };

  return (
    <HelmetProvider>
      <Container className="About-header">
        <Helmet>
          <meta charSet="utf-8" />
          <title> Works | {meta.title} </title>
          <meta name="description" content={meta.description} />
        </Helmet>
        
        <Row className="mb-5 mt-3 pt-md-3">
          <Col lg="8">
            <h1 className="display-4 mb-4"> Works </h1>
            <hr className="t_border my-4 ml-0 text-left" />
          </Col>
        </Row>
        
        {/* Main Projects Section */}
        <Row className="mb-5">
          <Col lg="12">
            <h2 className="section-title mb-4">Builds</h2>
            <div className="projects-grid">
              {mainProjects.map((project, index) => (
                <ProjectCard key={index} project={project} index={index} />
              ))}
            </div>
          </Col>
        </Row>
        
        {/* Other Projects Section */}
        <Row className="mb-5">
          <Col lg="12">
            <h2 className="section-title mb-4">Other Projects</h2>
            <div className="projects-grid">
              {otherProjects.map((project, index) => (
                <ProjectCard key={index} project={project} index={index} />
              ))}
            </div>
          </Col>
        </Row>
      </Container>
    </HelmetProvider>
  );
};
