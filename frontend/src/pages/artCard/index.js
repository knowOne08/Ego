import React from "react";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import {paintings, meta} from "../../content_option";

export const ArtCard = () => {
  const currentUrl = window.location.href;
    // console.log(currentUrl);
    let paintingCard  =  {};
    paintings.map((painting)=>{
        if(currentUrl.includes(painting.link)){
            paintingCard = painting;
        } ;
    })
    console.log(paintingCard)
  return (
    <HelmetProvider>
      <Container className="About-header">
        <Helmet>
          <meta charSet="utf-8" />
          <title> {paintingCard.description} | {meta.title} </title>{" "}
          <meta name="description" content={meta.description} />
        </Helmet>
        <Row className="mb-5 mt-3 pt-md-3">
          <Col lg="8">
            <h1 className="display-4 mb-4"> {paintingCard.description} </h1>{" "}
            <hr className="t_border my-4 ml-0 text-left" />
          </Col>
        </Row>    
        <div>Evolving shortly</div>
      </Container>
    </HelmetProvider>
  );
};
