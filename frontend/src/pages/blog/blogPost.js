import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { meta } from "../../content_option";
import "./blogPost.css";
import { Container } from "react-bootstrap";

const API_BASE_URL = 'http://localhost:3003/api';
const API_KEY = 'hello123';

export const BlogPost = () => {
    const { blogId } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBlog();
    }, [blogId]);

    const fetchBlog = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/blogs/${blogId}`, {
                headers: {
                    'X-API-Key': API_KEY
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    setBlog(null);
                    return;
                }
                throw new Error('Failed to fetch blog');
            }
            
            const data = await response.json();
            setBlog(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Function to render markdown-like content
    const renderContent = (content) => {
        if (!content) return '';
        
        return content
            .replace(/\n/g, '<br/>')
            .replace(/#{1,6} (.*?)(<br\/>|$)/g, (match, title, ending) => {
                const level = match.match(/^#+/)[0].length;
                return `<h${level}>${title}</h${level}>${ending}`;
            })
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/>(.*)(<br\/>|$)/g, '<blockquote>$1</blockquote>$2')
            .replace(/```[\s\S]*?```/g, (match) => {
                const code = match.slice(3, -3).trim();
                return `<pre><code>${code}</code></pre>`;
            });
    };

    if (loading) {
        return (
            <Container className="blog-post-container">
                <div className="blog-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading blog post...</p>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="blog-post-container">
                <div className="blog-error">
                    <h1>Error loading blog post</h1>
                    <p>{error}</p>
                    <button onClick={fetchBlog} className="retry-button">Retry</button>
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
            <Container className="blog-post-container">
                <Helmet>
                    <meta charSet="utf-8" />
                    <title>{blog.title} | {meta.title}</title>
                    <meta name="description" content={blog.excerpt} />
                </Helmet>
                
                <article className="blog-post">
                    <div className="blog-post-header">
                        <button onClick={() => navigate('/blog')} className="back-button">
                            ← Back to Blog
                        </button>
                        
                        <div className="blog-post-meta">
                            <span className="blog-post-date">{blog.date}</span>
                            <span className="blog-post-read-time">{blog.readTime}</span>
                        </div>
                        
                        <h1 className="blog-post-title">{blog.title}</h1>
                        
                        <div className="blog-post-tags">
                            {(blog.tags || []).map(tag => (
                                <span key={tag} className="blog-post-tag">{tag}</span>
                            ))}
                        </div>
                    </div>
                    
                    {blog.image && (
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
                        <div 
                            className="blog-content-body"
                            dangerouslySetInnerHTML={{ 
                                __html: renderContent(blog.content || blog.excerpt)
                            }}
                        />
                    </div>
                    
                    <div className="blog-post-footer">
                        <div className="blog-navigation">
                            <button onClick={() => navigate('/blog')} className="back-to-blog">
                                View All Posts
                            </button>
                        </div>
                    </div>
                </article>
            </Container>
        </HelmetProvider>
    );
};
