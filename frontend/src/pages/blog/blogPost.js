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

const API_BASE_URL = 'http://localhost:3003/api';
const API_KEY = 'hello123';

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
    const [currentPage, setCurrentPage] = useState(null);
    const [pages, setPages] = useState([]);
    const [pageNavigation, setPageNavigation] = useState({ previous: null, next: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showLightModeOverlay, setShowLightModeOverlay] = useState(false);
    const [wasInDarkMode, setWasInDarkMode] = useState(false);

    // Handle light mode preference IMMEDIATELY on mount (before content loads)
    useEffect(() => {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        
        if (currentTheme === 'dark') {
            console.log('🌙 Dark mode detected, switching to light mode with overlay...');
            
            // User was in dark mode, switch to light and show overlay IMMEDIATELY
            setWasInDarkMode(true);
            localStorage.setItem('theme', 'light');
            document.documentElement.setAttribute('data-theme', 'light');
            
            // Dispatch custom event to notify theme toggle
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: 'light' } }));
            
            // Show overlay immediately (it will stay visible during loading)
            setShowLightModeOverlay(true);
            
            // Play 2001 Space Odyssey-style music
            console.log('🎵 Attempting to play audio...');
            
            // Create audio element
            const audio = new Audio('/audio/space-odyssey.mp3');
            audio.volume = 0.8; // Max volume - audio file has built-in fade
            audio.preload = 'auto';
            
            // Start at a specific time (in seconds)
            audio.currentTime = 0; // Change this to start at different point (e.g., 5 for 5 seconds in)
            
            console.log('🎵 Audio object created:', audio.src);
            console.log('⏱️  Starting at:', audio.currentTime, 'seconds');
            
            // Try to play
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('✅ SUCCESS! Audio is playing at full volume!');
                        console.log('🔊 Volume:', audio.volume);
                        console.log('⏱️  Duration:', audio.duration);
                    })
                    .catch(error => {
                        console.error('❌ Audio playback failed:', error.name, error.message);
                        console.log('ℹ️  This is usually due to browser autoplay policy');
                    });
            }
            
            // Hide overlay after animation completes (6 seconds)
            // Audio continues playing for a bit longer (10 seconds total)
            const hideTimeout = setTimeout(() => {
                setShowLightModeOverlay(false);
            }, 6000); // Overlay hides at 6 seconds
            
            const stopAudioTimeout = setTimeout(() => {
                if (audio) {
                    audio.pause();
                    console.log('🛑 Audio stopped');
                }
            }, 13000); // Audio stops at 10 seconds
            
            // Cleanup
            return () => {
                clearTimeout(hideTimeout);
                clearTimeout(stopAudioTimeout);
                if (audio) audio.pause();
            };
        }
        
        // Cleanup: restore dark mode when leaving the blog post
        return () => {
            if (wasInDarkMode) {
                localStorage.setItem('theme', 'dark');
                document.documentElement.setAttribute('data-theme', 'dark');
                
                // Dispatch custom event to notify theme toggle
                window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: 'dark' } }));
            }
        };
    }, []); // Only run on mount

    useEffect(() => {
        fetchBlogContent();
    }, [blogId, pageSlug]);

    // Apply flex layout to divs with multiple figures
    useEffect(() => {
        if (!currentPage?.content) return;
        
        // Small delay to ensure DOM is fully rendered
        const timer = setTimeout(() => {
            // Find all divs and check if they have multiple figures
            const allDivs = document.querySelectorAll('.blog-content-body > div');
            allDivs.forEach(div => {
                const figures = div.querySelectorAll(':scope > figure');
                if (figures.length > 1) {
                    div.classList.add('multiple-figures');
                }
            });
            
            // Also check for divs with align="left" attribute (GitBook inline images)
            const leftAlignedDivs = document.querySelectorAll('.blog-content-body div[align="left"]');
            leftAlignedDivs.forEach(div => {
                const figures = div.querySelectorAll('figure');
                if (figures.length > 1) {
                    div.classList.add('multiple-figures');
                }
            });
        }, 200); // Increased delay for better reliability

        return () => clearTimeout(timer);
    }, [currentPage, blogId, pageSlug]); // Added blogId and pageSlug to dependencies

    const fetchBlogContent = async () => {
        try {
            let response;
            
            if (pageSlug) {
                // Fetch specific page within a blog
                response = await fetch(`${API_BASE_URL}/blogs/${blogId}/page/${pageSlug}`, {
                    headers: { 'X-API-Key': API_KEY }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setBlog(data.blog);
                    setCurrentPage(data.page);
                    setPageNavigation(data.navigation);
                    
                    // Fetch all pages for TOC if multipage
                    if (data.blog.is_multipage) {
                        const pagesResponse = await fetch(`${API_BASE_URL}/blogs/${blogId}/pages`, {
                            headers: { 'X-API-Key': API_KEY }
                        });
                        if (pagesResponse.ok) {
                            const pagesData = await pagesResponse.json();
                            setPages(pagesData.pages || []);
                        }
                    }
                }
            } else {
                // No pageSlug - redirect to first page for multi-page blogs
                response = await fetch(`${API_BASE_URL}/blogs/${blogId}/content`, {
                    headers: { 'X-API-Key': API_KEY }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // If multi-page blog, redirect to first page
                    if (data.is_multipage && data.pages && data.pages.length > 0) {
                        const firstPage = data.pages[0];
                        navigate(`/blog/${blogId}/page/${firstPage.slug}`, { replace: true });
                        return;
                    }
                    
                    // Single-page blog: show full content
                    setBlog(data);
                    setCurrentPage({
                        title: data.title,
                        content: data.content,
                        page_order: 0,
                        slug: 'main'
                    });
                    setPages([]);
                    setPageNavigation({ previous: null, next: null });
                }
            }
            
            if (!response.ok) {
                if (response.status === 404) {
                    setBlog(null);
                    return;
                }
                throw new Error('Failed to fetch blog');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Process content - wrap standalone images in figure tags and convert GitBook embeds
    const processContent = (content) => {
        if (!content) return '';
        
        let processedContent = content;
        
        // Convert GitBook YouTube embeds to iframe embeds
        // Pattern: {% embed url="https://youtu.be/VIDEO_ID" %}
        // or {% embed url="https://www.youtube.com/watch?v=VIDEO_ID" %}
        processedContent = processedContent.replace(
            /\{%\s*embed\s+url="([^"]+)"\s*%\}/gi,
            (match, url) => {
                // Extract YouTube video ID from various URL formats
                let videoId = null;
                
                // Format 1: https://youtu.be/VIDEO_ID
                const youtuBeMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
                if (youtuBeMatch) {
                    videoId = youtuBeMatch[1];
                }
                
                // Format 2: https://www.youtube.com/watch?v=VIDEO_ID
                const youtubeMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
                if (youtubeMatch) {
                    videoId = youtubeMatch[1];
                }
                
                // Format 3: https://www.youtube.com/embed/VIDEO_ID
                const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
                if (embedMatch) {
                    videoId = embedMatch[1];
                }
                
                if (videoId) {
                    // Return responsive YouTube embed
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
                
                // For other embeds (not YouTube), create a simple link
                return `<div class="embed-fallback"><a href="${url}" target="_blank" rel="noopener noreferrer">View embedded content: ${url}</a></div>`;
            }
        );
        
        // Wrap standalone img tags (not already in figures) with figure and figcaption
        // Only wrap if img is NOT preceded by <figure> tag
        processedContent = processedContent.replace(
            /(?<!<figure[^>]*>[\s\S]*?)<img\s+([^>]*?)alt="([^"]*)"([^>]*?)>/gi,
            (match, before, altText, after) => {
                // Check if this match is already inside a figure
                // Simple heuristic: if we don't see </figure> before this in a small window, it's standalone
                const beforeContext = content.substring(Math.max(0, content.indexOf(match) - 100), content.indexOf(match));
                const isInFigure = beforeContext.includes('<figure') && !beforeContext.includes('</figure>');
                
                if (isInFigure) {
                    return match; // Keep as is
                }
                
                // Wrap standalone image
                return `<figure><img ${before}alt="${altText}"${after}><figcaption>${altText}</figcaption></figure>`;
            }
        );
        
        // Clean up whitespace
        processedContent = processedContent.replace(/\n{3,}/g, '\n\n');
        
        return processedContent;
    };

    // Custom components for ReactMarkdown
    const markdownComponents = {
        // Remove custom img/svg handlers - let GitBook HTML pass through as-is
        // The CSS will handle all styling for figures, images, and figcaptions
        
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
            // Skip rendering H1 if it matches the blog title (avoid duplicate)
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
        a: ({href, children, ...props}) => {
            // Handle internal blog navigation links specially
            if (href && href.startsWith('/blog/')) {
                const isNext = children?.toString?.().includes('Next:');
                const isPrev = children?.toString?.().includes('Previous:');
                
                if (isNext || isPrev) {
                    return (
                        <div className={`blog-nav-card ${isNext ? 'next' : 'prev'}`}>
                            <div className="blog-nav-direction">
                                {isPrev ? '← Previous' : 'Next →'}
                            </div>
                            <a 
                                href={href}
                                className="blog-nav-link"
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate(href);
                                }}
                                {...props}
                            >
                                <div className="blog-nav-title">
                                    {children?.toString?.().replace(/^(Next:|Previous:)\s*/, '')}
                                </div>
                            </a>
                        </div>
                    );
                }
            }
            
            return (
                <a 
                    href={href} 
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="blog-link"
                    {...props}
                >
                    {children}
                </a>
            );
        }
        // Let divs, figures, and figcaptions pass through as-is
        // The CSS handles all GitBook HTML styling
    };

    if (loading) {
        return (
            <>
                {/* Show overlay during loading if switching from dark mode */}
                {showLightModeOverlay && (
                    <div className="light-mode-overlay">
                        <div className="light-mode-message">
                            Switching to light mode for better reading...
                        </div>
                    </div>
                )}
                <Container className="blog-post-container">
                    <div className="blog-loading" style={{ opacity: showLightModeOverlay ? 0 : 1 }}>
                        <div className="loading-spinner"></div>
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
                    <button onClick={fetchBlogContent} className="retry-button">Retry</button>
                    <button onClick={() => navigate('/blog')} className="back-button">
                        ← Back to Blog
                    </button>
                </div>
            </Container>
        );
    }
    
    if (!blog || !currentPage) {
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

    const navigateToPage = (pageSlug) => {
        if (pageSlug === 'main') {
            // Single-page blog - stay on main route
            navigate(`/blog/${blogId}`);
        } else {
            // Multi-page blog - navigate to specific page
            navigate(`/blog/${blogId}/page/${pageSlug}`);
        }
    };

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
                {blog.is_multipage && pages.length > 1 && (
                    <>
                        {/* Sidebar Toggle Button */}
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
                                        {pages.map((page) => (
                                            <button
                                                key={page.slug}
                                                onClick={() => navigateToPage(page.slug)}
                                                className={`toc-item ${currentPage?.slug === page.slug ? 'active' : ''}`}
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
                <main className={`blog-main-content ${blog.is_multipage && pages.length > 1 ? (sidebarOpen ? 'with-sidebar' : 'with-sidebar-closed') : ''}`}>
                    <Container className="blog-post-container">
                        <article className="blog-post">
                            <div className="blog-post-header">
                                {/* Desktop and mobile back button */}
                                <button onClick={() => navigate('/blog')} className="back-button">
                                    ← Back to Blog
                                </button>
                                
                                <div className="blog-post-meta">
                                    <span className="blog-post-date">{blog.date}</span>
                                    <span className="blog-post-read-time">{blog.readTime}</span>
                                </div>
                                
                                <h1 className="blog-post-title">{currentPage?.title || blog.title}</h1>
                                
                                {blog.excerpt && !blog.is_multipage && (
                                    <p className="blog-post-description">{blog.excerpt}</p>
                                )}
                                
                                <div className="blog-post-tags">
                                    {(blog.tags || []).map(tag => (
                                        <span key={tag} className="blog-post-tag">{tag}</span>
                                    ))}
                                </div>
                            </div>
                            
                            {blog.image && !blog.is_multipage && (
                                <div className="blog-post-image">
                                    <img 
                                        src={blog.image.startsWith('/uploads/') 
                                            ? `${API_BASE_URL.replace('/api', '')}${blog.image}`
                                            : blog.image
                                        } 
                                        alt={blog.title} 
                                    />
                                </div>
                            )}
                            
                            <div className="blog-post-content">
                                <div className="blog-content-body">
                                    <ReactMarkdown
                                        children={processContent(currentPage?.content || blog.content || blog.excerpt)}
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[
                                            rehypeRaw,
                                            [rehypeSanitize, customSanitizeSchema]
                                        ]}
                                        components={markdownComponents}
                                    />
                                </div>
                            </div>
                            
                            {/* Mobile TOC - Show below content on mobile/tablet */}
                            {blog.is_multipage && pages.length > 1 && (
                                <div className="blog-pages-toc">
                                    <h3>Table of Contents</h3>
                                    <ul>
                                        {pages.map((page, index) => (
                                            <li 
                                                key={page.slug}
                                                className={currentPage?.slug === page.slug ? 'active' : ''}
                                            >
                                                <button
                                                    onClick={() => navigateToPage(page.slug)}
                                                    className="toc-link"
                                                >
                                                    {index + 1}. {page.title}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {/* Page navigation: Previous/Next page within the same blog */}
                            {(pageNavigation.previous || pageNavigation.next) && (
                                <div className="blog-post-navigation">
                                    {pageNavigation.previous && (
                                        <div 
                                            className="blog-nav-button prev"
                                            onClick={() => navigateToPage(pageNavigation.previous.slug)}
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
                                            onClick={() => navigateToPage(pageNavigation.next.slug)}
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
