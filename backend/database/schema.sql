-- =====================================================
-- ULTIMATE BLOG SYSTEM DATABASE SCHEMA
-- Multi-page blog support with GitBook integration
-- 
-- DUAL DATABASE SUPPORT: SQLite (local) & PostgreSQL (Supabase)
-- This schema works for both databases with minor syntax differences
-- =====================================================

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. For SQLite (local development): Use this file as-is
-- 2. For PostgreSQL/Supabase: 
--    - Replace INTEGER PRIMARY KEY AUTOINCREMENT with SERIAL PRIMARY KEY
--    - Replace INTEGER with SMALLINT for boolean flags
--    - Use BIGSERIAL for high-volume id columns
--    - Replace datetime('now') with CURRENT_TIMESTAMP
-- 3. Run schema migrations carefully in production
-- 4. Always backup before running DROP commands
-- =====================================================

-- Drop existing tables if they exist (for clean setup)
-- WARNING: This will DELETE ALL DATA!
DROP TABLE IF EXISTS blog_pages CASCADE;
DROP TABLE IF EXISTS blogs CASCADE;

-- =====================================================
-- BLOGS TABLE
-- Main table for storing blog metadata
-- =====================================================
CREATE TABLE IF NOT EXISTS blogs (
    -- Primary Key
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Blog Identification
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    
    -- Content
    excerpt TEXT,
    content TEXT,
    
    -- Metadata
    date TEXT NOT NULL DEFAULT (date('now')),
    readTime TEXT DEFAULT '5 min read',
    author TEXT DEFAULT 'Anonymous',
    
    -- Multi-page Support
    is_multipage INTEGER DEFAULT 0 CHECK(is_multipage IN (0, 1)),
    
    -- Cover Images (Light/Dark mode support)
    cover_light TEXT,
    cover_dark TEXT,
    
    -- GitHub Integration
    github_folder_name TEXT,
    github_repo_url TEXT,
    
    -- Regular Image (fallback)
    image TEXT,
    
    -- Tags (stored as JSON array or comma-separated)
    tags TEXT,
    
    -- Status & Visibility
    status TEXT DEFAULT 'published' CHECK(status IN ('draft', 'published', 'archived')),
    featured INTEGER DEFAULT 0 CHECK(featured IN (0, 1)),
    
    -- SEO
    meta_description TEXT,
    meta_keywords TEXT,
    
    -- Timestamps
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- Publishing
    published_at TEXT,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0
);

-- =====================================================
-- BLOG_PAGES TABLE
-- For multi-page blog content (GitBook-style)
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_pages (
    -- Primary Key
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Foreign Key to blogs table
    blog_id INTEGER NOT NULL,
    
    -- Page Identification
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    
    -- Content
    content TEXT NOT NULL,
    
    -- Ordering
    page_order INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    excerpt TEXT,
    
    -- Timestamps
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- Constraints
    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
    UNIQUE(blog_id, slug)
);

-- =====================================================
-- INDEXES
-- Optimize query performance
-- =====================================================

-- Blogs table indexes
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_date ON blogs(date DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(featured);
CREATE INDEX IF NOT EXISTS idx_blogs_multipage ON blogs(is_multipage);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);

-- Blog pages indexes
CREATE INDEX IF NOT EXISTS idx_blog_pages_blog_id ON blog_pages(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_pages_slug ON blog_pages(slug);
CREATE INDEX IF NOT EXISTS idx_blog_pages_order ON blog_pages(blog_id, page_order);

-- =====================================================
-- TRIGGERS
-- Automatic timestamp updates
-- =====================================================

-- Update blogs.updated_at on any update
CREATE TRIGGER IF NOT EXISTS update_blogs_timestamp 
AFTER UPDATE ON blogs
FOR EACH ROW
BEGIN
    UPDATE blogs SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Update blog_pages.updated_at on any update
CREATE TRIGGER IF NOT EXISTS update_blog_pages_timestamp 
AFTER UPDATE ON blog_pages
FOR EACH ROW
BEGIN
    UPDATE blog_pages SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Update parent blog's updated_at when a page is modified
CREATE TRIGGER IF NOT EXISTS update_blog_on_page_change 
AFTER UPDATE ON blog_pages
FOR EACH ROW
BEGIN
    UPDATE blogs SET updated_at = datetime('now') WHERE id = NEW.blog_id;
END;

-- =====================================================
-- VIEWS
-- Convenient queries for common use cases
-- =====================================================

-- View: All published blogs with page count
CREATE VIEW IF NOT EXISTS published_blogs_summary AS
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
    COUNT(bp.id) as page_count
FROM blogs b
LEFT JOIN blog_pages bp ON b.id = bp.blog_id
WHERE b.status = 'published'
GROUP BY b.id
ORDER BY b.date DESC;

-- View: Multi-page blogs with their pages
CREATE VIEW IF NOT EXISTS multipage_blogs_detail AS
SELECT 
    b.id as blog_id,
    b.slug as blog_slug,
    b.title as blog_title,
    b.is_multipage,
    bp.id as page_id,
    bp.slug as page_slug,
    bp.title as page_title,
    bp.page_order,
    bp.excerpt as page_excerpt
FROM blogs b
INNER JOIN blog_pages bp ON b.id = bp.blog_id
WHERE b.is_multipage = 1 AND b.status = 'published'
ORDER BY b.id, bp.page_order;

-- =====================================================
-- SAMPLE DATA (Optional - Comment out if not needed)
-- =====================================================

-- Sample single-page blog
INSERT OR IGNORE INTO blogs (
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
    featured
) VALUES (
    'welcome-to-my-blog',
    'Welcome to My Blog',
    'This is my first blog post. Learn about what this blog is all about!',
    '# Welcome!\n\nThis is the content of my first blog post.\n\n## About This Blog\n\nI will be sharing my thoughts on various topics here.',
    '2024-01-01',
    '3 min read',
    'Admin',
    0,
    '["welcome", "introduction", "meta"]',
    'published',
    1
);

-- Sample multi-page blog (GitBook-style)
INSERT OR IGNORE INTO blogs (
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
    featured
) VALUES (
    'complete-guide-to-react',
    'Complete Guide to React',
    'A comprehensive guide to learning React from scratch',
    '2024-02-15',
    '45 min read',
    'Admin',
    1,
    'https://example.com/react-cover-light.png',
    'https://example.com/react-cover-dark.png',
    '["react", "javascript", "tutorial", "web-development"]',
    'published',
    'complete-guide-to-react',
    1
);

-- Sample pages for multi-page blog
INSERT OR IGNORE INTO blog_pages (blog_id, slug, title, content, page_order) VALUES
    (2, 'introduction', 'Introduction', '# Introduction to React\n\nReact is a JavaScript library for building user interfaces.', 0),
    (2, 'getting-started', 'Getting Started', '# Getting Started\n\nLet''s set up your first React project.', 1),
    (2, 'components', 'Components', '# Understanding Components\n\nComponents are the building blocks of React applications.', 2),
    (2, 'state-and-props', 'State and Props', '# State and Props\n\nLearn about state management and props.', 3),
    (2, 'hooks', 'Hooks', '# React Hooks\n\nModern React with Hooks.', 4);

-- =====================================================
-- UTILITY QUERIES (Examples)
-- =====================================================

-- Get all published blogs with their page count
-- SELECT * FROM published_blogs_summary;

-- Get all pages for a specific blog
-- SELECT * FROM blog_pages WHERE blog_id = 1 ORDER BY page_order;

-- Get blog with specific slug including all pages
-- SELECT b.*, bp.* 
-- FROM blogs b 
-- LEFT JOIN blog_pages bp ON b.id = bp.blog_id 
-- WHERE b.slug = 'your-blog-slug' 
-- ORDER BY bp.page_order;

-- Search blogs by tag
-- SELECT * FROM blogs WHERE tags LIKE '%react%' AND status = 'published';

-- Get featured blogs
-- SELECT * FROM published_blogs_summary WHERE featured = 1;

-- Increment view count
-- UPDATE blogs SET view_count = view_count + 1 WHERE slug = 'your-blog-slug';

-- =====================================================
-- MAINTENANCE QUERIES
-- =====================================================

-- Clean up orphaned pages (should never happen due to CASCADE)
-- DELETE FROM blog_pages WHERE blog_id NOT IN (SELECT id FROM blogs);

-- Reset view counts
-- UPDATE blogs SET view_count = 0;

-- Archive old drafts (older than 6 months)
-- UPDATE blogs SET status = 'archived' 
-- WHERE status = 'draft' 
-- AND created_at < date('now', '-6 months');

-- =====================================================
-- BACKUP RECOMMENDATION
-- =====================================================
-- Always backup your database before major changes:
-- sqlite3 blog.db ".backup backup.db"
-- Or: sqlite3 blog.db ".dump" > backup.sql

-- =====================================================
-- END OF SCHEMA
-- =====================================================
