import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './editor.css';

const API_BASE_URL = 'http://localhost:3003/api';
const API_KEY = 'hello123';

const BlogEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        tags: [],
        featured: false,
        status: 'published',
        image: null
    });

    const [newTag, setNewTag] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        if (isEditing) {
            fetchBlog();
        }
    }, [id, isEditing]);

    const fetchBlog = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/blogs/${id}`, {
                headers: {
                    'X-API-Key': API_KEY
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch blog');
            }

            const blog = await response.json();
            setFormData({
                title: blog.title,
                excerpt: blog.excerpt,
                content: blog.content,
                tags: blog.tags || [],
                featured: blog.featured,
                status: blog.status,
                image: null
            });

            if (blog.image) {
                setImagePreview(blog.image.startsWith('/uploads/') 
                    ? `${API_BASE_URL.replace('/api', '')}${blog.image}`
                    : blog.image
                );
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim() || !formData.content.trim()) {
            setError('Title and content are required');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('excerpt', formData.excerpt);
            submitData.append('content', formData.content);
            submitData.append('tags', JSON.stringify(formData.tags));
            submitData.append('featured', formData.featured);
            submitData.append('status', formData.status);
            
            if (formData.image) {
                submitData.append('image', formData.image);
            }

            const url = isEditing 
                ? `${API_BASE_URL}/admin/${id}`
                : `${API_BASE_URL}/admin`;
            
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'X-API-Key': API_KEY
                },
                body: submitData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save blog');
            }

            const result = await response.json();
            setSuccess(isEditing ? 'Blog updated successfully!' : 'Blog created successfully!');
            
            // Redirect to admin dashboard after a delay
            setTimeout(() => {
                navigate('/admin');
            }, 2000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    if (loading && isEditing && !formData.title) {
        return (
            <div className="blog-editor">
                <div className="loading">Loading blog...</div>
            </div>
        );
    }

    return (
        <div className="blog-editor">
            <div className="editor-header">
                <h1>{isEditing ? 'Edit Blog' : 'Create New Blog'}</h1>
                <button 
                    type="button" 
                    onClick={() => navigate('/admin')}
                    className="btn btn-secondary"
                >
                    Back to Dashboard
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit} className="blog-form">
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="title">Title *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter blog title..."
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="excerpt">Excerpt</label>
                    <textarea
                        id="excerpt"
                        name="excerpt"
                        value={formData.excerpt}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Brief description of the blog post..."
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="content">Content *</label>
                    <textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        rows="20"
                        required
                        placeholder="Write your blog content in Markdown..."
                    />
                    <small className="form-hint">Supports Markdown formatting</small>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="image">Featured Image</label>
                        <input
                            type="file"
                            id="image"
                            name="image"
                            onChange={handleImageChange}
                            accept="image/*"
                        />
                        {imagePreview && (
                            <div className="image-preview">
                                <img src={imagePreview} alt="Preview" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label>Tags</label>
                    <div className="tags-input">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Add a tag and press Enter..."
                        />
                        <button type="button" onClick={addTag} className="btn btn-small btn-secondary">
                            Add Tag
                        </button>
                    </div>
                    <div className="tags-list">
                        {formData.tags.map((tag, index) => (
                            <span key={index} className="tag">
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="tag-remove"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="status">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                        >
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="featured"
                                checked={formData.featured}
                                onChange={handleInputChange}
                            />
                            Featured Blog
                        </label>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin')}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : (isEditing ? 'Update Blog' : 'Create Blog')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BlogEditor;
