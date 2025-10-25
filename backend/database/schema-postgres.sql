-- =====================================================
-- ULTIMATE BLOG SYSTEM DATABASE SCHEMA (PostgreSQL/Supabase)
-- Multi-page blog support with GitBook integration
-- =====================================================

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. This schema is optimized for PostgreSQL/Supabase
-- 2. Run this in the Supabase SQL Editor
-- 3. Includes Row Level Security (RLS) policies for Supabase
-- 4. Includes full-text search capabilities
-- 5. Always backup before running DROP commands
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Drop existing tables if they exist (for clean setup)
-- WARNING: This will DELETE ALL DATA!
DROP TABLE IF EXISTS blog_pages CASCADE;
DROP TABLE IF EXISTS blogs CASCADE;

-- =====================================================
-- BLOGS TABLE
-- Main table for storing blog metadata
-- =====================================================
CREATE TABLE blogs (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    
    -- Blog Identification
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    
    -- Content
    excerpt TEXT,
    content TEXT,
    
    -- Metadata
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    readTime TEXT DEFAULT '5 min read',
    author TEXT DEFAULT 'Anonymous',
    
    -- Multi-page Support
    is_multipage BOOLEAN DEFAULT FALSE,
    
    -- Cover Images (Light/Dark mode support)
    cover_light TEXT,
    cover_dark TEXT,
    
    -- GitHub Integration
    github_folder_name TEXT,
    github_repo_url TEXT,
    
    -- Regular Image (fallback)
    image TEXT,
    
    -- Tags (stored as JSONB for better querying)
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Status & Visibility
    status TEXT DEFAULT 'published' CHECK(status IN ('draft', 'published', 'archived')),
    featured BOOLEAN DEFAULT FALSE,
    
    -- SEO
    meta_description TEXT,
    meta_keywords TEXT,
    
    -- Timestamps (automatic)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Publishing
    published_at TIMESTAMPTZ,
    
    -- Analytics
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    
    -- Full-text search vector (for fast searching)
    search_vector tsvector
);

-- =====================================================
-- BLOG_PAGES TABLE
-- For multi-page blog content (GitBook-style)
-- =====================================================
CREATE TABLE blog_pages (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    
    -- Foreign Key to blogs table
    blog_id BIGINT NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    
    -- Page Identification
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    
    -- Content
    content TEXT NOT NULL,
    
    -- Ordering
    page_order INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    excerpt TEXT,
    
    -- Timestamps (automatic)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Full-text search vector
    search_vector tsvector,
    
    -- Constraints
    UNIQUE(blog_id, slug)
);

-- =====================================================
-- INDEXES
-- Optimize query performance
-- =====================================================

-- Blogs table indexes
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_blogs_date ON blogs(date DESC);
CREATE INDEX idx_blogs_featured ON blogs(featured);
CREATE INDEX idx_blogs_multipage ON blogs(is_multipage);
CREATE INDEX idx_blogs_created_at ON blogs(created_at DESC);
CREATE INDEX idx_blogs_published_at ON blogs(published_at DESC NULLS LAST);
CREATE INDEX idx_blogs_view_count ON blogs(view_count DESC);

-- JSONB index for tags (for efficient tag queries)
CREATE INDEX idx_blogs_tags ON blogs USING GIN (tags);

-- Full-text search index
CREATE INDEX idx_blogs_search ON blogs USING GIN (search_vector);

-- Blog pages indexes
CREATE INDEX idx_blog_pages_blog_id ON blog_pages(blog_id);
CREATE INDEX idx_blog_pages_slug ON blog_pages(slug);
CREATE INDEX idx_blog_pages_order ON blog_pages(blog_id, page_order);

-- Full-text search index for pages
CREATE INDEX idx_blog_pages_search ON blog_pages USING GIN (search_vector);

-- Composite indexes for common queries
CREATE INDEX idx_blogs_status_date ON blogs(status, date DESC);
CREATE INDEX idx_blogs_status_featured ON blogs(status, featured);

-- =====================================================
-- TRIGGERS
-- Automatic timestamp updates and search vector maintenance
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update search vector for blogs
CREATE OR REPLACE FUNCTION update_blogs_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.author, '')), 'D');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update search vector for blog pages
CREATE OR REPLACE FUNCTION update_blog_pages_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'C');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger: Update blogs.updated_at on any update
CREATE TRIGGER trigger_update_blogs_timestamp 
    BEFORE UPDATE ON blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update blog_pages.updated_at on any update
CREATE TRIGGER trigger_update_blog_pages_timestamp 
    BEFORE UPDATE ON blog_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update blogs search vector
CREATE TRIGGER trigger_update_blogs_search 
    BEFORE INSERT OR UPDATE ON blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_blogs_search_vector();

-- Trigger: Update blog_pages search vector
CREATE TRIGGER trigger_update_blog_pages_search 
    BEFORE INSERT OR UPDATE ON blog_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_pages_search_vector();

-- Trigger: Update parent blog's updated_at when a page is modified
CREATE OR REPLACE FUNCTION update_blog_on_page_change()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE blogs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.blog_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_blog_on_page_change 
    AFTER INSERT OR UPDATE OR DELETE ON blog_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_on_page_change();

-- =====================================================
-- VIEWS
-- Convenient queries for common use cases
-- =====================================================

-- View: All published blogs with page count
CREATE OR REPLACE VIEW published_blogs_summary AS
SELECT 
    b.id,
    b.slug,
    b.title,
    b.excerpt,
    b.date,
    b.readTime,
    b.author,
    b.is_multipage,
    b.cover_light,
    b.cover_dark,
    b.image,
    b.tags,
    b.featured,
    b.view_count,
    b.like_count,
    b.created_at,
    b.updated_at,
    b.published_at,
    COUNT(bp.id) as page_count
FROM blogs b
LEFT JOIN blog_pages bp ON b.id = bp.blog_id
WHERE b.status = 'published'
GROUP BY b.id
ORDER BY b.date DESC;

-- View: Multi-page blogs with their pages
CREATE OR REPLACE VIEW multipage_blogs_detail AS
SELECT 
    b.id as blog_id,
    b.slug as blog_slug,
    b.title as blog_title,
    b.is_multipage,
    bp.id as page_id,
    bp.slug as page_slug,
    bp.title as page_title,
    bp.page_order,
    bp.excerpt as page_excerpt,
    bp.created_at as page_created_at
FROM blogs b
INNER JOIN blog_pages bp ON b.id = bp.blog_id
WHERE b.is_multipage = TRUE AND b.status = 'published'
ORDER BY b.id, bp.page_order;

-- View: Featured blogs
CREATE OR REPLACE VIEW featured_blogs AS
SELECT * FROM published_blogs_summary
WHERE featured = TRUE
ORDER BY date DESC;

-- View: Popular blogs (by view count)
CREATE OR REPLACE VIEW popular_blogs AS
SELECT * FROM published_blogs_summary
WHERE view_count > 0
ORDER BY view_count DESC, date DESC;

-- =====================================================
-- FUNCTIONS
-- Useful database functions
-- =====================================================

-- Function: Search blogs by text
CREATE OR REPLACE FUNCTION search_blogs(search_query TEXT)
RETURNS TABLE (
    id BIGINT,
    slug TEXT,
    title TEXT,
    excerpt TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.slug,
        b.title,
        b.excerpt,
        ts_rank(b.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM blogs b
    WHERE b.search_vector @@ plainto_tsquery('english', search_query)
        AND b.status = 'published'
    ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get blog with all pages
CREATE OR REPLACE FUNCTION get_blog_with_pages(blog_slug TEXT)
RETURNS TABLE (
    blog_id BIGINT,
    blog_slug TEXT,
    blog_title TEXT,
    blog_excerpt TEXT,
    blog_content TEXT,
    blog_date DATE,
    blog_author TEXT,
    is_multipage BOOLEAN,
    cover_light TEXT,
    cover_dark TEXT,
    page_id BIGINT,
    page_slug TEXT,
    page_title TEXT,
    page_content TEXT,
    page_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.slug,
        b.title,
        b.excerpt,
        b.content,
        b.date,
        b.author,
        b.is_multipage,
        b.cover_light,
        b.cover_dark,
        bp.id,
        bp.slug,
        bp.title,
        bp.content,
        bp.page_order
    FROM blogs b
    LEFT JOIN blog_pages bp ON b.id = bp.blog_id
    WHERE b.slug = blog_slug AND b.status = 'published'
    ORDER BY bp.page_order;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment view count
CREATE OR REPLACE FUNCTION increment_blog_views(blog_slug TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE blogs 
    SET view_count = view_count + 1 
    WHERE slug = blog_slug;
END;
$$ LANGUAGE plpgsql;

-- Function: Get blogs by tag
CREATE OR REPLACE FUNCTION get_blogs_by_tag(tag_name TEXT)
RETURNS TABLE (
    id BIGINT,
    slug TEXT,
    title TEXT,
    excerpt TEXT,
    date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT b.id, b.slug, b.title, b.excerpt, b.date
    FROM blogs b
    WHERE b.tags @> to_jsonb(ARRAY[tag_name])
        AND b.status = 'published'
    ORDER BY b.date DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- For Supabase - Customize based on your auth needs
-- =====================================================

-- Enable RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published blogs
CREATE POLICY "Public blogs are viewable by everyone"
    ON blogs FOR SELECT
    USING (status = 'published');

-- Policy: Anyone can view pages of published blogs
CREATE POLICY "Public blog pages are viewable by everyone"
    ON blog_pages FOR SELECT
    USING (
        blog_id IN (
            SELECT id FROM blogs WHERE status = 'published'
        )
    );

-- Policy: Authenticated users can view all blogs (including drafts)
-- Uncomment if you want authenticated users to see drafts
-- CREATE POLICY "Authenticated users can view all blogs"
--     ON blogs FOR SELECT
--     TO authenticated
--     USING (true);

-- Policy: Only authenticated users can insert/update/delete blogs
CREATE POLICY "Authenticated users can manage blogs"
    ON blogs FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can manage blog pages"
    ON blog_pages FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- SAMPLE DATA (Optional - Comment out if not needed)
-- =====================================================

-- Sample single-page blog
INSERT INTO blogs (
    slug, 
    title, 
    excerpt, 
    content, 
    date, 
    readTime, 
    author,
    is_multipage,
    tags,
    status,
    featured,
    published_at
) VALUES (
    'welcome-to-my-blog',
    'Welcome to My Blog',
    'This is my first blog post. Learn about what this blog is all about!',
    '# Welcome!

This is the content of my first blog post.

## About This Blog

I will be sharing my thoughts on various topics here.

### What to Expect

- Thoughtful articles
- Technical tutorials
- Personal reflections',
    '2024-01-01',
    '3 min read',
    'Admin',
    FALSE,
    '["welcome", "introduction", "meta"]'::jsonb,
    'published',
    TRUE,
    CURRENT_TIMESTAMP
) ON CONFLICT (slug) DO NOTHING;

-- Sample multi-page blog (GitBook-style)
INSERT INTO blogs (
    slug,
    title,
    excerpt,
    date,
    readTime,
    author,
    is_multipage,
    cover_light,
    cover_dark,
    tags,
    status,
    github_folder_name,
    featured,
    published_at
) VALUES (
    'complete-guide-to-react',
    'Complete Guide to React',
    'A comprehensive guide to learning React from scratch',
    '2024-02-15',
    '45 min read',
    'Admin',
    TRUE,
    'https://raw.githubusercontent.com/example/repo/main/complete-guide-to-react/assets/cover-light.png',
    'https://raw.githubusercontent.com/example/repo/main/complete-guide-to-react/assets/cover-dark.png',
    '["react", "javascript", "tutorial", "web-development"]'::jsonb,
    'published',
    'complete-guide-to-react',
    TRUE,
    CURRENT_TIMESTAMP
) ON CONFLICT (slug) DO NOTHING;

-- Sample pages for multi-page blog
INSERT INTO blog_pages (blog_id, slug, title, content, page_order, excerpt) VALUES
    (
        (SELECT id FROM blogs WHERE slug = 'complete-guide-to-react'),
        'introduction', 
        'Introduction', 
        '# Introduction to React

React is a JavaScript library for building user interfaces.

## Why React?

- Component-based architecture
- Virtual DOM for performance
- Large ecosystem and community', 
        0,
        'Learn what React is and why you should use it'
    ),
    (
        (SELECT id FROM blogs WHERE slug = 'complete-guide-to-react'),
        'getting-started', 
        'Getting Started', 
        '# Getting Started

Let''s set up your first React project.

## Prerequisites

- Node.js installed
- Basic JavaScript knowledge
- A code editor', 
        1,
        'Set up your development environment'
    ),
    (
        (SELECT id FROM blogs WHERE slug = 'complete-guide-to-react'),
        'components', 
        'Components', 
        '# Understanding Components

Components are the building blocks of React applications.

## Types of Components

1. Function Components
2. Class Components (legacy)', 
        2,
        'Deep dive into React components'
    ),
    (
        (SELECT id FROM blogs WHERE slug = 'complete-guide-to-react'),
        'state-and-props', 
        'State and Props', 
        '# State and Props

Learn about state management and props.

## Props

Props are read-only data passed to components.

## State

State is mutable data managed within a component.', 
        3,
        'Master state management and props'
    ),
    (
        (SELECT id FROM blogs WHERE slug = 'complete-guide-to-react'),
        'hooks', 
        'Hooks', 
        '# React Hooks

Modern React with Hooks.

## Common Hooks

- useState
- useEffect
- useContext
- useCallback
- useMemo', 
        4,
        'Learn about React Hooks'
    )
ON CONFLICT (blog_id, slug) DO NOTHING;

-- =====================================================
-- UTILITY QUERIES (Examples)
-- =====================================================

-- Get all published blogs with their page count
-- SELECT * FROM published_blogs_summary;

-- Get all pages for a specific blog
-- SELECT * FROM blog_pages WHERE blog_id = 1 ORDER BY page_order;

-- Get blog with specific slug including all pages
-- SELECT * FROM get_blog_with_pages('complete-guide-to-react');

-- Search blogs by text
-- SELECT * FROM search_blogs('react hooks');

-- Search blogs by tag
-- SELECT * FROM get_blogs_by_tag('react');

-- Get featured blogs
-- SELECT * FROM featured_blogs;

-- Get popular blogs
-- SELECT * FROM popular_blogs;

-- Increment view count
-- SELECT increment_blog_views('welcome-to-my-blog');

-- Get blogs with specific tags (direct query)
-- SELECT * FROM blogs WHERE tags @> '["react"]'::jsonb AND status = 'published';

-- =====================================================
-- MAINTENANCE QUERIES
-- =====================================================

-- Reset view counts
-- UPDATE blogs SET view_count = 0;

-- Archive old drafts (older than 6 months)
-- UPDATE blogs SET status = 'archived' 
-- WHERE status = 'draft' 
-- AND created_at < CURRENT_TIMESTAMP - INTERVAL '6 months';

-- Reindex full-text search vectors
-- UPDATE blogs SET updated_at = updated_at; -- This will trigger the search vector update

-- Get database statistics
-- SELECT 
--     'blogs' as table_name,
--     COUNT(*) as total_rows,
--     COUNT(*) FILTER (WHERE status = 'published') as published,
--     COUNT(*) FILTER (WHERE status = 'draft') as drafts,
--     COUNT(*) FILTER (WHERE is_multipage = TRUE) as multipage
-- FROM blogs
-- UNION ALL
-- SELECT 
--     'blog_pages' as table_name,
--     COUNT(*) as total_rows,
--     COUNT(DISTINCT blog_id) as unique_blogs,
--     NULL,
--     NULL
-- FROM blog_pages;

-- =====================================================
-- BACKUP & RESTORE
-- =====================================================

-- For Supabase, use the dashboard to create backups
-- Or use pg_dump for manual backups:
-- pg_dump -h your-project.supabase.co -U postgres -d postgres > backup.sql

-- =====================================================
-- PERFORMANCE TIPS
-- =====================================================

-- 1. Use prepared statements in your application code
-- 2. Regularly VACUUM and ANALYZE tables (Supabase handles this automatically)
-- 3. Monitor slow queries using pg_stat_statements
-- 4. Consider partitioning if you have millions of blogs
-- 5. Use connection pooling (Supabase provides this via Supavisor)

-- =====================================================
-- END OF SCHEMA
-- =====================================================
