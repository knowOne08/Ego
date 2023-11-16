import { Helmet, HelmetProvider } from "react-helmet-async"
import { meta, paintings } from "../../content_option"
import "./style.css";
import { Col, Row } from "react-bootstrap";
export const ArtGallery = () => {

    return (
        <HelmetProvider>
        <Helmet>
          <meta charSet="utf-8" />
          <title> Art Gallery | {meta.title}</title>
          <meta name="description" content={meta.description} />
        </Helmet> 
        {/* <div className="heading">
              <p className="title">Digital Art Gallery</p>
              <p className="quote">Some of the most Breathtaking, Beautiful, Terrifying and Humbling pieces of Art !</p>
        </div> */}
        <div className="po_items_ho">
          {paintings.map((data, i) => {
            return (
              <div key={i} className="po_item">
                <img src={data.img} alt="" />
                <div className="content">
                   <div className="description">
                    <p className="name">{data.description}</p>
                    <p className="artist">by {data.artist}</p>
                   </div>
                    <a href={data.link}>Learn More</a>
                </div>
              </div>
            );
          })}
        </div>
        </HelmetProvider>
    )
}