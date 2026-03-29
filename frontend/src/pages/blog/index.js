import React, { useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Link } from "react-router-dom";
import { meta } from "../../content_option";
import "./style.css";
import { Container, Row, Col } from "react-bootstrap";
import { getAllBlogs } from "../../services/blogService";
import defaultCover from "../../assets/images/FallenImg.jpeg";

export const Blog = () => {
    const [selectedTag, setSelectedTag] = useState("All");
    const blogs = getAllBlogs();

    const getBlogUrl = (blog) => `/blog/${blog.id}`;

    // Get all unique tags
    const allTags = ["All", ...new Set(blogs.flatMap(blog => blog.tags || []))];

    // Filter blogs based on selected tag
    const filteredBlogs = selectedTag === "All"
        ? blogs
        : blogs.filter(blog => blog.tags && blog.tags.includes(selectedTag));

    // Sort blogs by date (newest first)
    const sortedBlogs = [...filteredBlogs].sort((a, b) => new Date(b.date) - new Date(a.date));

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
                {sortedBlogs.some(blog => blog.featured) && (
                <div className="featured-section">
                    <h2 className="section-title">Featured</h2>
                    <Row>
                        {sortedBlogs.filter(blog => blog.featured).map((blog) => (
                            <Col lg={6} md={12} key={blog.id} className="mb-4">
                                <Link to={getBlogUrl(blog)} className="blog-card-link">
                                    <div className="blog-card featured-card">
                                        {blog.coverUrl && (
                                            <div className="blog-card-image">
                                                <img src={blog.coverUrl} alt={blog.title} />
                                            </div>
                                        )}
                                        <div className="blog-content">
                                            <div className="blog-meta">
                                                <span className="blog-date">{blog.date}</span>
                                                <span className="blog-read-time">{blog.readTime}</span>
                                            </div>
                                            <div className="blog-tags">
                                                {blog.tags.slice(0, 3).map(tag => (
                                                    <span key={tag} className="blog-tag">{tag}</span>
                                                ))}
                                            </div>
                                            <h3 className="blog-card-title">{blog.title}</h3>
                                            <p className="blog-excerpt">{blog.excerpt}</p>
                                        </div>
                                    </div>
                                </Link>
                            </Col>
                        ))}
                    </Row>
                </div>
                )}

                {/* All Blogs */}
                <div className="all-blogs-section">
                    <h2 className="section-title">All Posts</h2>
                    <div className="blog-grid">
                        {sortedBlogs.map((blog) => (
                            <Link to={getBlogUrl(blog)} key={blog.id} className="blog-card-link">
                                <div className="blog-card">
                                    <div className="blog-card-image">
                                            <img src={blog.coverUrl || defaultCover} alt={blog.title} />
                                        </div>
                                    <div className="blog-content">
                                        <div className="blog-meta">
                                            <span className="blog-date">{blog.date}</span>
                                            <span className="blog-read-time">{blog.readTime}</span>
                                        </div>
                                        <div className="blog-tags">
                                            {blog.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="blog-tag">{tag}</span>
                                            ))}
                                        </div>
                                        <h3 className="blog-card-title">{blog.title}</h3>
                                        <p className="blog-excerpt">{blog.excerpt}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </Container>
        </HelmetProvider>
    );
};
