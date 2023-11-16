import { HelmetProvider } from "react-helmet-async"
import { poems } from "../../content_option";
import { Card, Container } from "react-bootstrap";
import './style.css'
import { useState } from "react";
import { checkIfEnglish } from "../../utils/checkIfStingIsEnglish";
export const PoetryCard = () => {
    let poemNo = (window.location.href).slice(-1) - 1;
    return (
        <HelmetProvider>
        <div className="container">
            <Card style={{ 
                width: 'auto',
                maxWidth: '25rem',
                height: 'auto',
                background: 'var(--bg-color)',
                border: 'none',
            }} className="main_card">
                <Card.Body>
                    <Card.Title className="card_poem_title">{poems[poemNo].title}</Card.Title>
                    <Card.Subtitle className="mb-4 text-muted card_poem_author"> <a className="author_link" href={poems[poemNo].aboutAuthor}>{checkIfEnglish(poems[poemNo].author) + poems[poemNo].author}</a></Card.Subtitle>
                    <Card.Text className="card_poem" style={{ whiteSpace: 'pre-line', marginBottom: 10 }}>
                    {poems[poemNo].poem}
                    </Card.Text>
                </Card.Body>
                </Card>
            </div>
        </HelmetProvider>
    )
}