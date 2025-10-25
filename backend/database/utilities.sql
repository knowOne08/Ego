-- =====================================================
-- DATABASE UTILITIES & HELPER QUERIES
-- Collection of useful queries for database management
-- =====================================================

-- =====================================================
-- TABLE OF CONTENTS
-- =====================================================
-- 1. Data Inspection
-- 2. Analytics Queries
-- 3. Maintenance Queries
-- 4. Migration Helpers
-- 5. Debugging Queries
-- 6. Performance Analysis
-- 7. Backup & Recovery
-- =====================================================

-- =====================================================
-- 1. DATA INSPECTION
-- =====================================================

-- View all blogs with page counts
SELECT 
    b.id,
    b.slug,
    b.title,
    b.status,
    b.is_multipage,
    b.date,
    b.view_count,
    COUNT(bp.id) as page_count
FROM blogs b
LEFT JOIN blog_pages bp ON b.id = bp.blog_id
GROUP BY b.id
ORDER BY b.created_at DESC;

-- View complete blog structure
SELECT 
    b.id as blog_id,
    b.slug as blog_slug,
    b.title as blog_title,
    b.is_multipage,
    bp.id as page_id,
    bp.slug as page_slug,
    bp.title as page_title,
    bp.page_order
FROM blogs b
LEFT JOIN blog_pages bp ON b.id = bp.blog_id
ORDER BY b.id, bp.page_order;

-- Find blogs missing pages (multipage but no pages)
SELECT b.*
FROM blogs b
LEFT JOIN blog_pages bp ON b.id = bp.blog_id
WHERE b.is_multipage = TRUE
GROUP BY b.id
HAVING COUNT(bp.id) = 0;

-- Find orphaned pages (pages without parent blog)
SELECT bp.*
FROM blog_pages bp
LEFT JOIN blogs b ON bp.blog_id = b.id
WHERE b.id IS NULL;

-- Get blogs with cover images
SELECT slug, title, cover_light, cover_dark
FROM blogs
WHERE cover_light IS NOT NULL OR cover_dark IS NOT NULL;

-- Get blogs from GitHub
SELECT slug, title, github_folder_name, github_repo_url
FROM blogs
WHERE github_folder_name IS NOT NULL
ORDER BY created_at DESC;

-- =====================================================
-- 2. ANALYTICS QUERIES
-- =====================================================

-- Most viewed blogs
SELECT slug, title, view_count, like_count
FROM blogs
WHERE status = 'published'
ORDER BY view_count DESC
LIMIT 10;

-- Most liked blogs
SELECT slug, title, view_count, like_count
FROM blogs
WHERE status = 'published'
ORDER BY like_count DESC
LIMIT 10;

-- Blog engagement rate (likes per view)
SELECT 
    slug,
    title,
    view_count,
    like_count,
    CASE 
        WHEN view_count > 0 THEN ROUND((like_count * 100.0 / view_count), 2)
        ELSE 0
    END as engagement_rate
FROM blogs
WHERE status = 'published' AND view_count > 0
ORDER BY engagement_rate DESC;

-- Blogs by status
SELECT 
    status,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE is_multipage = TRUE) as multipage_count
FROM blogs
GROUP BY status;

-- Blogs by month
SELECT 
    strftime('%Y-%m', date) as month,
    COUNT(*) as count
FROM blogs
WHERE status = 'published'
GROUP BY month
ORDER BY month DESC;

-- Tag popularity (PostgreSQL)
SELECT 
    tag,
    COUNT(*) as blog_count
FROM blogs,
    jsonb_array_elements_text(tags) as tag
WHERE status = 'published'
GROUP BY tag
ORDER BY blog_count DESC;

-- Average pages per multipage blog
SELECT 
    AVG(page_count) as avg_pages,
    MIN(page_count) as min_pages,
    MAX(page_count) as max_pages
FROM (
    SELECT b.id, COUNT(bp.id) as page_count
    FROM blogs b
    INNER JOIN blog_pages bp ON b.id = bp.blog_id
    WHERE b.is_multipage = TRUE
    GROUP BY b.id
) as page_counts;

-- =====================================================
-- 3. MAINTENANCE QUERIES
-- =====================================================

-- Update read times based on content length
-- Assumes 200 words per minute reading speed
UPDATE blogs
SET readTime = 
    CASE 
        WHEN LENGTH(content) / 5 / 200 < 1 THEN '1 min read'
        ELSE (LENGTH(content) / 5 / 200) || ' min read'
    END
WHERE content IS NOT NULL AND is_multipage = FALSE;

-- Fix missing published_at timestamps
UPDATE blogs
SET published_at = created_at
WHERE status = 'published' AND published_at IS NULL;

-- Normalize slugs (lowercase, replace spaces with hyphens)
UPDATE blogs
SET slug = LOWER(REPLACE(slug, ' ', '-'))
WHERE slug LIKE '% %';

-- Remove trailing/leading whitespace from titles
UPDATE blogs SET title = TRIM(title);
UPDATE blog_pages SET title = TRIM(title);

-- Set default author for anonymous blogs
UPDATE blogs
SET author = 'Anonymous'
WHERE author IS NULL OR author = '';

-- Reorder pages with gaps
-- Creates sequential ordering: 0, 1, 2, 3...
WITH ordered_pages AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY blog_id ORDER BY page_order, id) - 1 as new_order
    FROM blog_pages
)
UPDATE blog_pages
SET page_order = (SELECT new_order FROM ordered_pages WHERE ordered_pages.id = blog_pages.id);

-- =====================================================
-- 4. MIGRATION HELPERS
-- =====================================================

-- Convert single-page blog to multi-page
-- Step 1: Update blog flag
UPDATE blogs 
SET is_multipage = TRUE 
WHERE slug = 'your-blog-slug';

-- Step 2: Create first page from content
INSERT INTO blog_pages (blog_id, slug, title, content, page_order)
SELECT 
    id,
    'introduction',
    'Introduction',
    content,
    0
FROM blogs 
WHERE slug = 'your-blog-slug' AND content IS NOT NULL;

-- Step 3: Clear original content (optional)
UPDATE blogs 
SET content = NULL 
WHERE slug = 'your-blog-slug';

-- Convert multi-page blog back to single-page
-- Step 1: Concatenate all pages
UPDATE blogs
SET content = (
    SELECT string_agg(bp.content, E'\n\n---\n\n' ORDER BY bp.page_order)
    FROM blog_pages bp
    WHERE bp.blog_id = blogs.id
),
is_multipage = FALSE
WHERE slug = 'your-blog-slug';

-- Step 2: Delete pages
DELETE FROM blog_pages
WHERE blog_id = (SELECT id FROM blogs WHERE slug = 'your-blog-slug');

-- =====================================================
-- 5. DEBUGGING QUERIES
-- =====================================================

-- Check for duplicate slugs
SELECT slug, COUNT(*) as count
FROM blogs
GROUP BY slug
HAVING COUNT(*) > 1;

-- Check for missing required fields
SELECT id, slug, title
FROM blogs
WHERE title IS NULL OR title = ''
   OR slug IS NULL OR slug = '';

-- Check for invalid page orders
SELECT bp.*, b.title as blog_title
FROM blog_pages bp
JOIN blogs b ON bp.blog_id = b.id
WHERE bp.page_order < 0
ORDER BY b.id, bp.page_order;

-- Find very long slugs (potential issues)
SELECT id, slug, LENGTH(slug) as slug_length
FROM blogs
WHERE LENGTH(slug) > 100
ORDER BY slug_length DESC;

-- Check for HTML/script injection
SELECT id, slug, title
FROM blogs
WHERE title LIKE '%<script%'
   OR title LIKE '%javascript:%'
   OR content LIKE '%<script%';

-- Verify foreign key integrity
SELECT bp.id, bp.blog_id, bp.title
FROM blog_pages bp
LEFT JOIN blogs b ON bp.blog_id = b.id
WHERE b.id IS NULL;

-- =====================================================
-- 6. PERFORMANCE ANALYSIS (PostgreSQL)
-- =====================================================

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Unused indexes (never scanned)
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey';

-- Table scan statistics
SELECT 
    schemaname,
    tablename,
    seq_scan as sequential_scans,
    seq_tup_read as rows_read_sequentially,
    idx_scan as index_scans,
    idx_tup_fetch as rows_fetched_by_index
FROM pg_stat_user_tables
WHERE schemaname = 'public';

-- =====================================================
-- 7. BACKUP & RECOVERY
-- =====================================================

-- Export blogs to CSV (PostgreSQL)
\copy (SELECT * FROM blogs) TO '/tmp/blogs_backup.csv' WITH CSV HEADER;

-- Export blog pages to CSV (PostgreSQL)
\copy (SELECT * FROM blog_pages) TO '/tmp/blog_pages_backup.csv' WITH CSV HEADER;

-- Create a snapshot view
CREATE OR REPLACE VIEW blog_snapshot AS
SELECT 
    b.id,
    b.slug,
    b.title,
    b.excerpt,
    b.author,
    b.date,
    b.is_multipage,
    b.status,
    b.featured,
    b.view_count,
    b.like_count,
    json_agg(
        json_build_object(
            'slug', bp.slug,
            'title', bp.title,
            'order', bp.page_order
        ) ORDER BY bp.page_order
    ) as pages
FROM blogs b
LEFT JOIN blog_pages bp ON b.id = bp.blog_id
GROUP BY b.id;

-- =====================================================
-- 8. CONTENT QUALITY CHECKS
-- =====================================================

-- Blogs with short content (less than 100 characters)
SELECT id, slug, title, LENGTH(content) as content_length
FROM blogs
WHERE is_multipage = FALSE
  AND (content IS NULL OR LENGTH(content) < 100)
  AND status = 'published';

-- Pages with short content
SELECT bp.id, b.slug as blog_slug, bp.slug as page_slug, bp.title, LENGTH(bp.content) as content_length
FROM blog_pages bp
JOIN blogs b ON bp.blog_id = b.id
WHERE LENGTH(bp.content) < 100;

-- Blogs without excerpts
SELECT id, slug, title
FROM blogs
WHERE (excerpt IS NULL OR excerpt = '')
  AND status = 'published';

-- Blogs without cover images
SELECT id, slug, title
FROM blogs
WHERE status = 'published'
  AND cover_light IS NULL
  AND cover_dark IS NULL
  AND image IS NULL;

-- Check for broken image URLs (basic check)
SELECT id, slug, title, 
    CASE 
        WHEN cover_light IS NOT NULL AND cover_light NOT LIKE 'http%' THEN cover_light
        WHEN cover_dark IS NOT NULL AND cover_dark NOT LIKE 'http%' THEN cover_dark
        ELSE NULL
    END as suspicious_url
FROM blogs
WHERE (cover_light IS NOT NULL AND cover_light NOT LIKE 'http%')
   OR (cover_dark IS NOT NULL AND cover_dark NOT LIKE 'http%');

-- =====================================================
-- 9. BULK OPERATIONS
-- =====================================================

-- Publish all drafts from a specific date
UPDATE blogs
SET status = 'published',
    published_at = CURRENT_TIMESTAMP
WHERE status = 'draft'
  AND date >= '2024-01-01';

-- Feature top 5 most viewed blogs
WITH top_blogs AS (
    SELECT id
    FROM blogs
    WHERE status = 'published'
    ORDER BY view_count DESC
    LIMIT 5
)
UPDATE blogs
SET featured = TRUE
WHERE id IN (SELECT id FROM top_blogs);

-- Archive blogs older than 2 years with low engagement
UPDATE blogs
SET status = 'archived'
WHERE date < CURRENT_DATE - INTERVAL '2 years'
  AND view_count < 100
  AND status = 'published';

-- Reset analytics for a fresh start
UPDATE blogs
SET view_count = 0,
    like_count = 0;

-- =====================================================
-- 10. REPORTING QUERIES
-- =====================================================

-- Monthly publishing report
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as blogs_created,
    COUNT(*) FILTER (WHERE status = 'published') as published,
    COUNT(*) FILTER (WHERE is_multipage = TRUE) as multipage,
    SUM(view_count) as total_views
FROM blogs
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Author productivity report
SELECT 
    author,
    COUNT(*) as total_blogs,
    COUNT(*) FILTER (WHERE status = 'published') as published_blogs,
    SUM(view_count) as total_views,
    AVG(view_count) as avg_views_per_blog
FROM blogs
GROUP BY author
ORDER BY total_blogs DESC;

-- Content type distribution
SELECT 
    CASE 
        WHEN is_multipage = TRUE THEN 'Multi-page'
        ELSE 'Single-page'
    END as content_type,
    status,
    COUNT(*) as count
FROM blogs
GROUP BY is_multipage, status
ORDER BY content_type, status;

-- Cover image usage report
SELECT 
    COUNT(*) as total_blogs,
    COUNT(*) FILTER (WHERE cover_light IS NOT NULL) as has_light_cover,
    COUNT(*) FILTER (WHERE cover_dark IS NOT NULL) as has_dark_cover,
    COUNT(*) FILTER (WHERE cover_light IS NOT NULL AND cover_dark IS NOT NULL) as has_both_covers,
    COUNT(*) FILTER (WHERE image IS NOT NULL) as has_fallback_image
FROM blogs
WHERE status = 'published';

-- =====================================================
-- END OF UTILITIES
-- =====================================================
