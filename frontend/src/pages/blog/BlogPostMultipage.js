import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { marked } from "marked";
import "./blogPost.css";

const API_BASE_URL = 'http://localhost:3003/api';
const API_KEY = 'hello123';

export const BlogPost = () => {
    const { slug, pageSlug } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [currentPage, setCurrentPage] = useState(null);
    const [pages, setPages] = useState([]);
    const [navigation, setNavigation] = useState({ previous: null, next: null });
    const [blogNavigation, setBlogNavigation] = useState({ previous: null, next: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTOC, setShowTOC] = useState(false);

    useEffect(() => {
        fetchBlogContent();
        fetchBlogNavigation();
    }, [slug, pageSlug]);

    const fetchBlogContent = async () => {
        try {
            setLoading(true);
            let response;

            if (pageSlug) {
                // Fetch specific page
                response = await fetch(`${API_BASE_URL}/blogs/${slug}/page/${pageSlug}`, {
                    headers: { 'X-API-Key': API_KEY }
                });
            } else {
                // Fetch main page
                response = await fetch(`${API_BASE_URL}/blogs/${slug}/content`, {
                    headers: { 'X-API-Key': API_KEY }
                });
            }

            if (!response.ok) throw new Error('Failed to fetch blog');

            const data = await response.json();

            if (pageSlug) {
                // Data from /page/:pageSlug endpoint
                setBlog(data.blog);
                setCurrentPage(data.page);
                setNavigation(data.navigation);
                
                // Fetch all pages for TOC
                if (data.blog.is_multipage) {
                    const pagesResponse = await fetch(`${API_BASE_URL}/blogs/${slug}/pages`, {
                        headers: { 'X-API-Key': API_KEY }
                    });
                    const pagesData = await pagesResponse.json();
                    setPages(pagesData.pages || []);
                }
            } else {
                // Data from /content endpoint (main page)
                setBlog(data);
                setCurrentPage({
                    title: data.title,
                    content: data.content,
                    page_order: 0,
                    slug: 'main'
                });
                setPages(data.pages || []);
                setNavigation(data.navigation || { previous: null, next: null });
            }

            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const fetchBlogNavigation = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/blogs/${slug}/navigation`, {
                headers: { 'X-API-Key': API_KEY }
            });
            const data = await response.json();
            setBlogNavigation(data);
        } catch (err) {
            console.error('Failed to fetch blog navigation:', err);
        }
    };

    const navigateToPage = (pageSlug) => {
        if (pageSlug === 'main') {
            navigate(`/blog/${slug}`);
        } else {
            navigate(`/blog/${slug}/page/${pageSlug}`);
        }
        setShowTOC(false);
    };

    if (loading) {
        return (
            <div className="blog-post-loading">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (error || !blog || !currentPage) {
        return (
            <div className="blog-post-error">
                <h2>Blog post not found</h2>
                <p>{error || 'The requested blog post could not be found.'}</p>
                <Link to="/blog" className="back-button">← Back to Blog</Link>
            </div>
        );
    }

    // Render markdown content
    const renderContent = () => {
        const rawHtml = marked(currentPage.content || '');
        return { __html: rawHtml };
    };

    return (
        <HelmetProvider>
            <div className="blog-post-container">
                <Helmet>
                    <title>{currentPage.title} | Blog</title>
                    <meta name="description" content={blog.excerpt} />
                </Helmet>

                {/* Cover Art Hero Image */}
                {blog.cover_visible && (blog.cover_light || blog.cover_dark) && currentPage.page_order === 0 && (
                    <div className={`blog-cover-hero ${blog.cover_size || 'hero'}`}>
                        <img 
                            src={blog.cover_light} 
                            alt={blog.title} 
                            className="blog-cover-image blog-cover-light" 
                            style={{ objectPosition: `center ${blog.cover_y || 0}%` }}
                        />
                        {blog.cover_dark && (
                            <img 
                                src={blog.cover_dark} 
                                alt={blog.title} 
                                className="blog-cover-image blog-cover-dark" 
                                style={{ objectPosition: `center ${blog.cover_y || 0}%` }}
                            />
                        )}
                        <div className="blog-cover-overlay"></div>
                    </div>
                )}

                {/* Header with back button and TOC toggle */}
                <div className="blog-post-header">
                    <Link to="/blog" className="back-button" aria-label="Back to blog">
                        ←
                    </Link>
                    
                    {blog.is_multipage && pages.length > 1 && (
                        <button 
                            className={`toc-toggle-button ${showTOC ? 'open' : ''}`}
                            onClick={() => setShowTOC(!showTOC)}
                            aria-label="Toggle table of contents"
                        >
                            <span className="toc-icon">☰</span>
                            <span className="toc-text">Chapters</span>
                            <span className="toc-arrow">›</span>
                        </button>
                    )}
                </div>

                {/* Table of Contents Sidebar */}
                {blog.is_multipage && showTOC && (
                    <aside className={`table-of-contents ${showTOC ? 'visible' : ''}`}>
                        <h3>Table of Contents</h3>
                        <nav>
                            <ul>
                                {pages.map((page) => (
                                    <li 
                                        key={page.slug}
                                        className={currentPage.slug === page.slug ? 'active' : ''}
                                    >
                                        <button onClick={() => navigateToPage(page.slug)}>
                                            <span className="page-number">{page.page_order + 1}.</span>
                                            <span className="page-title">{page.title}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </aside>
                )}

                {/* Main Content */}
                <article className="blog-post-content">
                    {/* Breadcrumbs for multipage blogs */}
                    {blog.is_multipage && (
                        <nav className="breadcrumbs" aria-label="Breadcrumb">
                            <Link to="/blog">Blog</Link>
                            <span className="separator">›</span>
                            <Link to={`/blog/${slug}`}>{blog.title}</Link>
                            {currentPage.page_order > 0 && (
                                <>
                                    <span className="separator">›</span>
                                    <span>{currentPage.title}</span>
                                </>
                            )}
                        </nav>
                    )}

                    {/* Blog metadata (show only on main page) */}
                    {currentPage.page_order === 0 && (
                        <header className="blog-post-meta">
                            <h1>{blog.title}</h1>
                            <div className="meta-info">
                                <time dateTime={blog.date}>
                                    {new Date(blog.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </time>
                                <span className="separator">•</span>
                                <span>{blog.read_time}</span>
                                {blog.is_multipage && (
                                    <>
                                        <span className="separator">•</span>
                                        <span>{blog.page_count} chapters</span>
                                    </>
                                )}
                            </div>
                            {blog.tags && blog.tags.length > 0 && (
                                <div className="tags">
                                    {blog.tags.map(tag => (
                                        <span key={tag} className="tag">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </header>
                    )}

                    {/* Chapter title for non-main pages */}
                    {currentPage.page_order > 0 && (
                        <header className="chapter-header">
                            <span className="chapter-number">Chapter {currentPage.page_order}</span>
                            <h1>{currentPage.title}</h1>
                        </header>
                    )}

                    {/* Content */}
                    <div 
                        className="markdown-content" 
                        dangerouslySetInnerHTML={renderContent()}
                    />

                    {/* Page Navigation (within blog) */}
                    {blog.is_multipage && (navigation.previous || navigation.next) && (
                        <nav className="page-navigation" aria-label="Page navigation">
                            {navigation.previous ? (
                                <button 
                                    onClick={() => navigateToPage(navigation.previous.slug)}
                                    className="nav-button prev"
                                >
                                    <span className="nav-arrow">←</span>
                                    <div className="nav-content">
                                        <span className="nav-label">Previous</span>
                                        <span className="nav-title">{navigation.previous.title}</span>
                                    </div>
                                </button>
                            ) : (
                                <div></div>
                            )}
                            
                            {navigation.next && (
                                <button 
                                    onClick={() => navigateToPage(navigation.next.slug)}
                                    className="nav-button next"
                                >
                                    <div className="nav-content">
                                        <span className="nav-label">Next</span>
                                        <span className="nav-title">{navigation.next.title}</span>
                                    </div>
                                    <span className="nav-arrow">→</span>
                                </button>
                            )}
                        </nav>
                    )}

                    {/* Blog Navigation (between blogs - show only on main page) */}
                    {currentPage.page_order === 0 && !blog.is_multipage && (blogNavigation.previous || blogNavigation.next) && (
                        <nav className="blog-navigation" aria-label="Blog post navigation">
                            {blogNavigation.previous ? (
                                <Link to={`/blog/${blogNavigation.previous.slug}`} className="nav-button prev">
                                    <span className="nav-arrow">←</span>
                                    <div className="nav-content">
                                        <span className="nav-label">Previous Post</span>
                                        <span className="nav-title">{blogNavigation.previous.title}</span>
                                    </div>
                                </Link>
                            ) : (
                                <div></div>
                            )}
                            
                            {blogNavigation.next && (
                                <Link to={`/blog/${blogNavigation.next.slug}`} className="nav-button next">
                                    <div className="nav-content">
                                        <span className="nav-label">Next Post</span>
                                        <span className="nav-title">{blogNavigation.next.title}</span>
                                    </div>
                                    <span className="nav-arrow">→</span>
                                </Link>
                            )}
                        </nav>
                    )}
                </article>
            </div>
        </HelmetProvider>
    );
};

export default BlogPost;
