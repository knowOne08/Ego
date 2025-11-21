import React, { useState, useEffect } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async"
import {
    meta,
    poetryQuotes,
    poems,
    myPoems,
  } from "../../content_option";
import './style.css'
import { Container, Row, Col } from "react-bootstrap";
// import { checkIfEnglish } from "../../utils/checkIfStingIsEnglish";

export const PoetryCollection = () => {
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [activeTab, setActiveTab] = useState(() => {
        // Check URL hash to determine initial tab
        const hash = window.location.hash;
        return hash === '#my-poems' ? 'my-poems' : 'featured';
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentQuoteIndex((prevIndex) => 
                prevIndex === poetryQuotes.length - 1 ? 0 : prevIndex + 1
            );
        }, 6000);

        return () => clearInterval(interval);
    }, []);

    // Listen for hash changes to update active tab
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            setActiveTab(hash === '#my-poems' ? 'my-poems' : 'featured');
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
    return (
        <HelmetProvider>
            <Container className="sec_sp">
                <Helmet>
                    <meta charSet="utf-8" />
                    <title>Poetry Collection | {meta.title}</title>
                    <meta name="description" content={meta.description} />
                </Helmet>
                
                <Row className="sec_sp">
                    <Col lg="12">
                        <h1 className="color_sec">Poetry</h1>
                        <hr className="t_border my-4 ml-0 text-left" />
                    </Col>
                </Row>

                <Row className="mb-5">
                    <Col lg="8" className="mx-auto">
                        <div className="quote_section text-center">
                            <p className="quote_text">
                                {poetryQuotes[currentQuoteIndex]}
                            </p>
                        </div>
                    </Col>
                </Row>

                <Row className="mb-4">
                    <Col lg="10" className="mx-auto">
                        <div className="tab_navigation">
                            <button 
                                className={`tab_button ${activeTab === 'featured' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('featured');
                                    window.history.replaceState(null, null, '/poetry');
                                }}
                            >
                                Recommended
                            </button>
                            <button 
                                className={`tab_button ${activeTab === 'my-poems' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('my-poems');
                                    window.history.replaceState(null, null, '/poetry#my-poems');
                                }}
                            >
                                Scribbles
                            </button>
                        </div>
                    </Col>
                </Row>

                {activeTab === 'my-poems' ? (
                    myPoems.map((poem, index) => (
                        <Row key={`my-poem-${poem.no}`} className="mb-4">
                            <Col lg="10" className="mx-auto">
                                <a href={`/my-poetry/${poem.no}`} className="poem_link">
                                    <div className="poem_item">
                                        <h3 className="poem_title">
                                            {poem.title}
                                        </h3>
                                        <p className="poem_author text_2 personal-poem-author">
                                            {poem.author}
                                        </p>
                                        <p className="poem_excerpt personal-poem-excerpt">
                                            {poem.poem.trim().split('\n').filter(line => line.trim()).slice(0, 2).join(' ').substring(0, 120)}...
                                        </p>
                                        <div className="read_more">
                                            <span>Read Full Poem</span>
                                            <span className="arrow">→</span>
                                        </div>
                                    </div>
                                </a>
                                <hr className="t_border my-4 ml-0 text-left" />
                            </Col>
                        </Row>
                    ))
                ) : (
                    poems.map((poem, index) => (
                        <Row key={poem.no} className="mb-4">
                            <Col lg="10" className="mx-auto">
                                <a href={`/poetry/${poem.no}`} className="poem_link">
                                    <div className="poem_item">
                                        <h3 className="poem_title">
                                            {poem.title}
                                        </h3>
                                        <p className="poem_author text_2 personal-poem-author">
                                            {poem.author}
                                        </p>
                                        <p className="poem_excerpt personal-poem-excerpt">
                                            {poem.poem.trim().split('\n').filter(line => line.trim()).slice(0, 2).join(' ').substring(0, 120)}...
                                        </p>
                                        <div className="read_more">
                                            <span>Read Full Poem</span>
                                            <span className="arrow">→</span>
                                        </div>
                                    </div>
                                </a>
                                <hr className="t_border my-4 ml-0 text-left" />
                            </Col>
                        </Row>
                    ))
                )}
            </Container>
        </HelmetProvider>
    )
}