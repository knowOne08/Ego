import React from "react";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import {paintings, meta} from "../../content_option";

export const ArtCard = () => {
  const currentUrl = window.location.href;
    let paintingCard  =  {};
    paintings.map((painting)=>{
        if(currentUrl.includes(painting.link)){
            paintingCard = painting;
        } ;
    })

  return (
    <HelmetProvider>
      <Container fluid className="art-detail-container">
        <Helmet>
          <meta charSet="utf-8" />
          <title> {paintingCard.description} | {meta.title} </title>{" "}
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
              <img 
                src={paintingCard.img} 
                alt={paintingCard.description}
                className="artwork-image"
              />
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
      </Container>
    </HelmetProvider>
  );
};
