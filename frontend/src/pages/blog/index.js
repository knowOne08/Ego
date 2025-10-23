import React, { useState, useEffect } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { meta } from "../../content_option";
import "./style.css";
import { Container, Row, Col } from "react-bootstrap";

const API_BASE_URL = 'http://localhost:3003/api';
const API_KEY = 'hello123';

export const Blog = () => {
    const [selectedTag, setSelectedTag] = useState("All");
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/blogs`, {
                headers: {
                    'X-API-Key': API_KEY
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch blogs');
            }
            
            const data = await response.json();
            // Filter only published blogs for public view
            const publishedBlogs = data.filter(blog => blog.status === 'published');
            setBlogs(publishedBlogs);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Get all unique tags
    const allTags = ["All", ...new Set(blogs.flatMap(blog => blog.tags || []))];
    
    // Filter blogs based on selected tag
    const filteredBlogs = selectedTag === "All" 
        ? blogs 
        : blogs.filter(blog => blog.tags && blog.tags.includes(selectedTag));
    
    // Sort blogs by date (newest first)
    const sortedBlogs = filteredBlogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <HelmetProvider>
            <Container className="blog-container">
                <Helmet>
                    <meta charSet="utf-8" />
                    <title>Blog | {meta.title}</title>
                    <meta name="description" content={meta.description} />
                </Helmet>
                
                <div className="blog-header">
                    <h1 className="blog-title">Thoughts & Reflections</h1>
                    <p className="blog-subtitle">
                        A collection of musings on technology, philosophy, art, and the human experience
                    </p>
                </div>

                {loading && (
                    <div className="blog-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading blogs...</p>
                    </div>
                )}

                {error && (
                    <div className="blog-error">
                        <p>Error loading blogs: {error}</p>
                        <button onClick={fetchBlogs} className="retry-button">Retry</button>
                    </div>
                )}

                {!loading && !error && (
                <>
                {/* Tag Filter */}
                <div className="tag-filter">
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            className={`tag-button ${selectedTag === tag ? 'active' : ''}`}
                            onClick={() => setSelectedTag(tag)}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Featured Blogs */}
                <div className="featured-section">
                    <h2 className="section-title">Featured</h2>
                    <Row>
                        {sortedBlogs.filter(blog => blog.featured).map((blog) => (
                            <Col lg={6} md={12} key={blog.id} className="mb-4">
                                <div className="blog-card featured-card">
                                    <div className="blog-image-container">
                                        <img src={blog.image} alt={blog.title} className="blog-image" />
                                        <div className="blog-overlay">
                                            <div className="blog-tags">
                                                {blog.tags.slice(0, 2).map(tag => (
                                                    <span key={tag} className="blog-tag">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="blog-content">
                                        <div className="blog-meta">
                                            <span className="blog-date">{blog.date}</span>
                                            <span className="blog-read-time">{blog.readTime}</span>
                                        </div>
                                        <h3 className="blog-card-title">
                                            <a href={`/blog/${blog.id}`}>{blog.title}</a>
                                        </h3>
                                        <p className="blog-excerpt">{blog.excerpt}</p>
                                        <a href={`/blog/${blog.id}`} className="read-more">
                                            Read More
                                            <span className="arrow">→</span>
                                        </a>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>

                {/* All Blogs */}
                <div className="all-blogs-section">
                    <h2 className="section-title">All Posts</h2>
                    <div className="blog-grid">
                        {sortedBlogs.map((blog) => (
                            <div key={blog.id} className="blog-card">
                                <div className="blog-image-container">
                                    <img src={blog.image} alt={blog.title} className="blog-image" />
                                    <div className="blog-overlay">
                                        <div className="blog-tags">
                                            {blog.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="blog-tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="blog-content">
                                    <div className="blog-meta">
                                        <span className="blog-date">{blog.date}</span>
                                        <span className="blog-read-time">{blog.readTime}</span>
                                    </div>
                                    <h3 className="blog-card-title">
                                        <a href={`/blog/${blog.id}`}>{blog.title}</a>
                                    </h3>
                                    <p className="blog-excerpt">{blog.excerpt}</p>
                                    <a href={`/blog/${blog.id}`} className="read-more">
                                        Read More
                                        <span className="arrow">→</span>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                </>
                )}
            </Container>
        </HelmetProvider>
    );
};
