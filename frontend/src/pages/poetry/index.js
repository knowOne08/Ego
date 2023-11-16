import { Helmet, HelmetProvider } from "react-helmet-async"
import {
    meta,
    poetryQuotes,
    skills,
    services,
    poems,
  } from "../../content_option";
import Typewriter from "typewriter-effect";
import './style.css'
import {  Container, Row } from "react-bootstrap";
import { checkIfEnglish } from "../../utils/checkIfStingIsEnglish";
export const PoetryCollection = () => {
    let index = 0
    const replaceQuote = () =>{
        const paragraph = document.getElementById('quote');
        console.log(paragraph)
        if(index == 4)
            index = 0
        else {
            paragraph.innerHTML = poetryQuotes[index];
            index++;
        }
    }
    setInterval(replaceQuote, 7000);
    return (
        <HelmetProvider>
           <Container className="poem-header">
        <Helmet>
          <meta charSet="utf-8" />
          <title> Poem Collection | {meta.title}</title>
          <meta name="description" content={meta.description} />
        </Helmet>
        <div className="heading">
            <p className="title">Poetry</p>
            <p id="quote" className="quote">{ poetryQuotes[0]}</p>
        </div>
       <div className="menu">
            {poems.map((poem)=>{
               return (<Row className="mt-3">
                    <a href={`/poetry/${poem.no}`} className="poem_title">{poem.title}</a>
                    <p className="poem_author">{checkIfEnglish(poem.author) + poem.author}</p>
                    <hr className="t_border my-4 ml-0 text-left" />
                </Row>  )
            })}
       </div>
        </Container>
        </HelmetProvider>
    )
}