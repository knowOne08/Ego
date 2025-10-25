import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './style.css';
import { API_BASE_URL, API_KEY } from "../../config/api";

const AdminDashboard = () => {
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
            setBlogs(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteBlog = async (id) => {
        if (!window.confirm('Are you sure you want to delete this blog?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-API-Key': API_KEY
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete blog');
            }

            setBlogs(blogs.filter(blog => blog.id !== id));
        } catch (err) {
            setError(err.message);
        }
    };

    const toggleFeatured = async (id, currentStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY
                },
                body: JSON.stringify({ featured: !currentStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update blog');
            }

            setBlogs(blogs.map(blog => 
                blog.id === id ? { ...blog, featured: !currentStatus } : blog
            ));
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="admin-dashboard">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-dashboard">
                <div className="error">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1>Blog Admin Dashboard</h1>
                <Link to="/admin/new" className="btn btn-primary">
                    Create New Blog
                </Link>
            </div>

            <div className="blog-stats">
                <div className="stat-card">
                    <h3>Total Blogs</h3>
                    <p>{blogs.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Featured</h3>
                    <p>{blogs.filter(blog => blog.featured).length}</p>
                </div>
                <div className="stat-card">
                    <h3>Published</h3>
                    <p>{blogs.filter(blog => blog.status === 'published').length}</p>
                </div>
            </div>

            <div className="blog-list">
                <h2>All Blogs</h2>
                {blogs.length === 0 ? (
                    <p className="no-blogs">No blogs found. <Link to="/admin/new">Create your first blog!</Link></p>
                ) : (
                    <div className="blog-table">
                        <div className="table-header">
                            <div className="col-title">Title</div>
                            <div className="col-date">Date</div>
                            <div className="col-status">Status</div>
                            <div className="col-featured">Featured</div>
                            <div className="col-actions">Actions</div>
                        </div>
                        {blogs.map(blog => (
                            <div key={blog.id} className="table-row">
                                <div className="col-title">
                                    <h4>{blog.title}</h4>
                                    <p>{blog.excerpt.substring(0, 100)}...</p>
                                </div>
                                <div className="col-date">
                                    {new Date(blog.date).toLocaleDateString()}
                                </div>
                                <div className="col-status">
                                    <span className={`status ${blog.status}`}>
                                        {blog.status}
                                    </span>
                                </div>
                                <div className="col-featured">
                                    <button
                                        className={`featured-toggle ${blog.featured ? 'featured' : ''}`}
                                        onClick={() => toggleFeatured(blog.id, blog.featured)}
                                    >
                                        {blog.featured ? '★' : '☆'}
                                    </button>
                                </div>
                                <div className="col-actions">
                                    <Link to={`/admin/edit/${blog.id}`} className="btn btn-small btn-secondary">
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => deleteBlog(blog.id)}
                                        className="btn btn-small btn-danger"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
