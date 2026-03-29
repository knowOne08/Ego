import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { meta } from "../../content_option";
import "./blogPost.css";
import "./lightModeOverlay.css";
import { Container } from "react-bootstrap";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { getBlogById, fetchBlogContent, fetchBlogPages, fetchBlogPage } from "../../services/blogService";

// Custom sanitize schema to allow GitBook HTML elements
const customSanitizeSchema = {
    ...defaultSchema,
    attributes: {
        ...defaultSchema.attributes,
        '*': [...(defaultSchema.attributes['*'] || []), 'className', 'class', 'style'],
        div: ['className', 'class', 'align', 'style'],
        figure: ['className', 'class', 'style', 'data-caption', 'dataCaption'],
        figcaption: ['className', 'class', 'style'],
        img: ['className', 'class', 'width', 'height', 'alt', 'src', 'loading', 'style'],
        svg: ['className', 'class', 'width', 'height', 'viewBox', 'xmlns', 'style'],
        iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title', 'className', 'class', 'style'],
        p: ['className', 'class', 'style'],
        a: ['href', 'target', 'rel', 'className', 'class', 'style'],
    },
    tagNames: [
        ...(defaultSchema.tagNames || []),
        'figure',
        'figcaption',
        'svg',
        'path',
        'rect',
        'circle',
        'line',
        'g',
        'polygon',
        'polyline',
        'ellipse',
        'iframe',
    ]
};

export const BlogPost = () => {
    const { blogId, pageSlug } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [content, setContent] = useState('');
    const [cover, setCover] = useState(null);
    const [pages, setPages] = useState([]);
    const [currentPageSlug, setCurrentPageSlug] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showLightModeOverlay, setShowLightModeOverlay] = useState(false);
    const [wasInDarkMode, setWasInDarkMode] = useState(false);

    // Handle light mode preference IMMEDIATELY on mount (before content loads)
    useEffect(() => {
        const currentTheme = localStorage.getItem('theme') || 'dark';

        if (currentTheme === 'dark') {
            setWasInDarkMode(true);
            localStorage.setItem('theme', 'light');
            document.documentElement.setAttribute('data-theme', 'light');
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: 'light' } }));
            setShowLightModeOverlay(true);

            const audio = new Audio('/audio/space-odyssey.mp3');
            audio.volume = 1;
            audio.currentTime = 0;
            audio.play().catch(() => {});

            const hideTimeout = setTimeout(() => {
                setShowLightModeOverlay(false);
            }, 6000);

            const stopAudioTimeout = setTimeout(() => {
                audio.pause();
            }, 13000);

            return () => {
                clearTimeout(hideTimeout);
                clearTimeout(stopAudioTimeout);
                audio.pause();
            };
        }

        return () => {
            if (wasInDarkMode) {
                localStorage.setItem('theme', 'dark');
                document.documentElement.setAttribute('data-theme', 'dark');
                window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: 'dark' } }));
            }
        };
    }, []);

    // Fetch blog content from GitHub
    useEffect(() => {
        const loadContent = async () => {
            setLoading(true);
            setError(null);

            const blogData = getBlogById(blogId);
            if (!blogData) {
                setLoading(false);
                return;
            }
            setBlog(blogData);

            try {
                // Load pages list from SUMMARY.md
                const blogPages = await fetchBlogPages(blogData);
                setPages(blogPages);

                if (pageSlug) {
                    // Fetch specific page
                    const pageContent = await fetchBlogPage(blogData, pageSlug);
                    setContent(pageContent);
                    setCurrentPageSlug(pageSlug);
                } else {
                    // Fetch main README.md
                    const result = await fetchBlogContent(blogData);
                    setContent(result.content);
                    setCover(result.cover);
                    setCurrentPageSlug(null);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadContent();
    }, [blogId, pageSlug]);

    // Apply flex layout to divs with multiple figures
    useEffect(() => {
        if (!content) return;

        const timer = setTimeout(() => {
            const allDivs = document.querySelectorAll('.blog-content-body > div');
            allDivs.forEach(div => {
                const figures = div.querySelectorAll(':scope > figure');
                if (figures.length > 1) {
                    div.classList.add('multiple-figures');
                }
            });

            const leftAlignedDivs = document.querySelectorAll('.blog-content-body div[align="left"]');
            leftAlignedDivs.forEach(div => {
                const figures = div.querySelectorAll('figure');
                if (figures.length > 1) {
                    div.classList.add('multiple-figures');
                }
            });
        }, 200);

        return () => clearTimeout(timer);
    }, [content, blogId, pageSlug]);

    // Process content - wrap standalone images in figure tags and convert GitBook embeds
    const processContent = (content) => {
        if (!content) return '';

        // Remove YAML frontmatter (--- ... ---) that GitBook includes at top of README.md
        // This avoids rendering the raw frontmatter (title/description/cover/etc.) in the page
        let processedContent = String(content).replace(/^\s*---[\s\S]*?---\s*/i, '');

        // Also remove any stray frontmatter-like single-line metadata that may remain
        // e.g. lines like `description: ...` or `tags: ...` left after conversion
        processedContent = processedContent.replace(/^\s*(description|tags?):.*$/gim, '');

        // Remove leading single-line metadata lines like `key: value` occurring at the top
        // This handles cases where YAML frontmatter was not removed completely and left metadata lines
        processedContent = processedContent.replace(/^(\s*(?:[A-Za-z0-9_-]+):[^\n]*\n)+/, '');

        // Convert GitBook YouTube embeds to iframe embeds
        // Pattern: {% embed url="https://youtu.be/VIDEO_ID" %}
        // or {% embed url="https://www.youtube.com/watch?v=VIDEO_ID" %}
        processedContent = processedContent.replace(
            /\{%\s*embed\s+url="([^"]+)"\s*%\}/gi,
            (match, url) => {
                let videoId = null;

                const youtuBeMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
                if (youtuBeMatch) videoId = youtuBeMatch[1];

                const youtubeMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
                if (youtubeMatch) videoId = youtubeMatch[1];

                const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
                if (embedMatch) videoId = embedMatch[1];

                if (videoId) {
                    return `
<div class="video-embed-container">
  <iframe
    src="https://www.youtube.com/embed/${videoId}"
    title="YouTube video player"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
</div>`;
                }

                return `<div class="embed-fallback"><a href="${url}" target="_blank" rel="noopener noreferrer">View embedded content: ${url}</a></div>`;
            }
        );

        // Wrap standalone img tags (not already in figures) with figure and figcaption
        // Only wrap if img is NOT preceded by <figure> tag
        processedContent = processedContent.replace(
            /(?<!<figure[^>]*>[\s\S]*?)<img\s+([^>]*?)alt="([^"]*)"([^>]*?)>/gi,
            (match, before, altText, after, offset, str) => {
                // Use the provided offset and string to locate context without relying on external vars
                const beforeContext = str.substring(Math.max(0, offset - 100), offset);
                const isInFigure = beforeContext.includes('<figure') && !beforeContext.includes('</figure>');

                if (isInFigure) return match;

                return `<figure><img ${before}alt="${altText}"${after}><figcaption>${altText}</figcaption></figure>`;
            }
        );
        
        // Clean up whitespace
        processedContent = processedContent.replace(/\n{3,}/g, '\n\n');
        
        return processedContent;
    };

    // Custom components for ReactMarkdown
    const markdownComponents = {
        code: ({inline, className, children, ...props}) => {
            return inline ? (
                <code className="inline-code" {...props}>{children}</code>
            ) : (
                <pre className="code-block">
                    <code {...props}>{children}</code>
                </pre>
            );
        },
        blockquote: ({children, ...props}) => (
            <blockquote className="blog-blockquote" {...props}>
                {children}
            </blockquote>
        ),
        h1: ({children, ...props}) => {
            const titleText = children?.toString?.() || '';
            const blogTitle = blog?.title || '';
            if (titleText === blogTitle || blogTitle.includes(titleText)) {
                return null;
            }
            return <h1 className="blog-h1" {...props}>{children}</h1>;
        },
        h2: ({children, ...props}) => <h2 className="blog-h2" {...props}>{children}</h2>,
        h3: ({children, ...props}) => <h3 className="blog-h3" {...props}>{children}</h3>,
        h4: ({children, ...props}) => <h4 className="blog-h4" {...props}>{children}</h4>,
        p: ({children, ...props}) => <p className="blog-paragraph" {...props}>{children}</p>,
        a: ({href, children, ...props}) => (
            <a
                href={href}
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="blog-link"
                {...props}
            >
                {children}
            </a>
        )
    };

    // Compute page navigation
    const currentPageIndex = pages.findIndex(p => p.filename === currentPageSlug);
    const pageNavigation = {
        previous: currentPageIndex > 0 ? pages[currentPageIndex - 1] : null,
        next: currentPageIndex < pages.length - 1 ? pages[currentPageIndex + 1] : null,
    };
    // If on main page (README) and there are pages, "next" is the first page
    if (!currentPageSlug && pages.length > 0) {
        pageNavigation.next = pages[0];
    }

    const navigateToPage = (filename) => {
        if (!filename) {
            navigate(`/blog/${blogId}`);
        } else {
            navigate(`/blog/${blogId}/page/${filename}`);
        }
    };

    if (loading) {
        return (
            <>
                <Container className="blog-post-container">
                    <div className="blog-loading" style={{ opacity: showLightModeOverlay ? 0 : 1 }}>
                        <div className="loading-spinner">
                            <div className="loading-dot"></div>
                            <div className="loading-dot"></div>
                            <div className="loading-dot"></div>
                        </div>
                        <p>Loading blog post...</p>
                    </div>
                </Container>
            </>
        );
    }

    if (error) {
        return (
            <Container className="blog-post-container">
                <div className="blog-error">
                    <h1>Error loading blog post</h1>
                    <p>{error}</p>
                    <button onClick={() => navigate('/blog')} className="back-button">
                        ← Back to Blog
                    </button>
                </div>
            </Container>
        );
    }

    if (!blog) {
        return (
            <Container className="blog-post-container">
                <div className="blog-not-found">
                    <h1>Blog post not found</h1>
                    <button onClick={() => navigate('/blog')} className="back-button">
                        ← Back to Blog
                    </button>
                </div>
            </Container>
        );
    }

    return (
        <HelmetProvider>
            <Helmet>
                <meta charSet="utf-8" />
                <title>{blog.title} | {meta.title}</title>
                <meta name="description" content={blog.excerpt} />
            </Helmet>

            {/* Light Mode Preference Overlay */}
            {showLightModeOverlay && (
                <div className="light-mode-overlay">
                    <div className="light-mode-message">
                        <span className="music-icon">♪</span>
                        Switching to light mode for better reading...
                        <span className="music-icon">♪</span>
                    </div>
                </div>
            )}

            <div className="blog-layout-wrapper">
                {/* Sidebar - Table of Contents (Desktop) */}
                {pages.length > 0 && (
                    <>
                        <button
                            className={`sidebar-toggle ${sidebarOpen ? 'open' : ''}`}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                        >
                            <span className="chevron-arrow"></span>
                        </button>

                        <aside className={`blog-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                            <div className="blog-sidebar-content">
                                <div className="blog-toc-sidebar">
                                    <nav className="toc-nav">
                                        <button
                                            onClick={() => navigateToPage(null)}
                                            className={`toc-item ${!currentPageSlug ? 'active' : ''}`}
                                        >
                                            <span className="toc-text">Introduction</span>
                                        </button>
                                        {pages.map((page) => (
                                            <button
                                                key={page.filename}
                                                onClick={() => navigateToPage(page.filename)}
                                                className={`toc-item ${currentPageSlug === page.filename ? 'active' : ''}`}
                                            >
                                                <span className="toc-text">{page.title}</span>
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>
                        </aside>
                    </>
                )}

                {/* Main Content */}
                <main className={`blog-main-content ${pages.length > 0 ? (sidebarOpen ? 'with-sidebar' : 'with-sidebar-closed') : ''}`}>
                    <Container className="blog-post-container">
                        <article className="blog-post">
                            <div className="blog-post-header">
                                <button onClick={() => navigate('/blog')} className="back-button">
                                    ← Back to Blog
                                </button>

                                <div className="blog-post-meta">
                                    <span className="blog-post-date">{blog.date}</span>
                                    <span className="blog-post-read-time">{blog.readTime}</span>
                                </div>

                                {cover && (
                                    <div className="blog-post-image">
                                        <img src={cover} alt={blog.title} />
                                    </div>
                                )}

                                <h1 className="blog-post-title">{blog.title}</h1>

                                {/* Always show the excerpt/description below the title (small grey subtitle) */}
                                {blog.excerpt && (
                                    <p className="blog-post-description">{blog.excerpt}</p>
                                )}

                                {/* Tags are displayed only on the listing/thumbnail cards — not on the full post */}
                                {/* (Intentionally omitted here) */}
                            </div>

                            <div className="blog-post-content">
                                <div className="blog-content-body">
                                    <ReactMarkdown
                                        children={processContent(content)}
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[
                                            rehypeRaw,
                                            [rehypeSanitize, customSanitizeSchema]
                                        ]}
                                        components={markdownComponents}
                                    />
                                </div>
                            </div>

                            {/* Mobile TOC */}
                            {pages.length > 0 && (
                                <div className="blog-pages-toc">
                                    <h3>Table of Contents</h3>
                                    <ul>
                                        <li className={!currentPageSlug ? 'active' : ''}>
                                            <button onClick={() => navigateToPage(null)} className="toc-link">
                                                1. Introduction
                                            </button>
                                        </li>
                                        {pages.map((page, index) => (
                                            <li
                                                key={page.filename}
                                                className={currentPageSlug === page.filename ? 'active' : ''}
                                            >
                                                <button
                                                    onClick={() => navigateToPage(page.filename)}
                                                    className="toc-link"
                                                >
                                                    {index + 2}. {page.title}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Page navigation */}
                            {(pageNavigation.previous || pageNavigation.next) && (
                                <div className="blog-post-navigation">
                                    {pageNavigation.previous && (
                                        <div
                                            className="blog-nav-button prev"
                                            onClick={() => navigateToPage(pageNavigation.previous.filename)}
                                        >
                                            <div className="nav-arrow">←</div>
                                            <div className="nav-content">
                                                <span className="nav-label">Previous</span>
                                                <span className="nav-title">{pageNavigation.previous.title}</span>
                                            </div>
                                        </div>
                                    )}
                                    {pageNavigation.next && (
                                        <div
                                            className="blog-nav-button next"
                                            onClick={() => navigateToPage(pageNavigation.next.filename)}
                                        >
                                            <div className="nav-content">
                                                <span className="nav-label">Next</span>
                                                <span className="nav-title">{pageNavigation.next.title}</span>
                                            </div>
                                            <div className="nav-arrow">→</div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </article>
                    </Container>
                </main>
            </div>
        </HelmetProvider>
    );
};
