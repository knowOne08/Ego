import React from "react";
import { Helmet, HelmetProvider } from "react-helmet-async"
import { meta, poems, myPoems } from "../../content_option";
import { Container, Row, Col } from "react-bootstrap";
import './style.css'

export const PoetryCard = () => {
    // Extract poem number from URL properly (handles multi-digit numbers)
    const urlParts = window.location.pathname.split('/');
    const poemNoFromUrl = parseInt(urlParts[urlParts.length - 1]);
    const isMyPoetry = window.location.pathname.includes('/my-poetry/');
    
    // Find the poem by matching the 'no' property instead of using array index
    let poem;
    if (isMyPoetry) {
        poem = myPoems.find(p => p.no === poemNoFromUrl);
    } else {
        poem = poems.find(p => p.no === poemNoFromUrl);
    }
    
    const backLink = isMyPoetry ? "/poetry#my-poems" : "/poetry";
    const pageTitle = isMyPoetry ? "My Poetry" : "Recommended Poems";
    
    if (!poem) {
        return (
            <Container className="sec_sp">
                <Row>
                    <Col lg="8" className="mx-auto text-center">
                        <h1>Poem not found</h1>
                        <p><a href={backLink}>← Back </a></p>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <HelmetProvider>
            <Container className="sec_sp">
                <Helmet>
                    <meta charSet="utf-8" />
                    <title>{poem.title} | {meta.title}</title>
                    <meta name="description" content={`Read "${poem.title}" by ${poem.author}`} />
                </Helmet>
                
                <Row>
                    <Col lg="8" className="mx-auto">
                        <div className="poem_navigation mb-4">
                            <a href={backLink} className="back_link">← Back </a>
                        </div>
                        
                        <div className="poem_content">
                            <header className="poem_header">
                                <h1>
                                    {poem.title}
                                </h1>
                                <div className="poem_meta">
                                    <p className="poem_author">
                                        <a href={poem.aboutAuthor} className="author_link" target="_blank" rel="noopener noreferrer">
                                            {poem.author}
                                        </a>
                                    </p>
                                </div>
                                <hr className="t_border my-4 ml-0 text-left" />
                            </header>
                            
                            <div>
                                <pre className="poem_body">{poem.poem}</pre>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </HelmetProvider>
    )
}