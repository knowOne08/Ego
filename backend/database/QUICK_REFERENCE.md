# Database Quick Reference

A handy cheat sheet for common database operations.

## 🚀 Quick Start

### SQLite (Local)
```bash
# Create database
sqlite3 blog.db < database/schema.sql

# Open database
sqlite3 blog.db

# List tables
.tables

# Show table structure
.schema blogs
```

### PostgreSQL/Supabase
```sql
-- In Supabase SQL Editor, paste schema-postgres.sql and run
-- Or connect via psql:
psql -h your-db.supabase.co -U postgres -d postgres
```

---

## 📊 Common Queries

### Get All Published Blogs
```sql
SELECT * FROM published_blogs_summary ORDER BY date DESC;
```

### Get Single Blog with All Pages
```sql
-- SQLite
SELECT b.*, bp.* 
FROM blogs b 
LEFT JOIN blog_pages bp ON b.id = bp.blog_id 
WHERE b.slug = 'your-slug' 
ORDER BY bp.page_order;

-- PostgreSQL
SELECT * FROM get_blog_with_pages('your-slug');
```

### Get Featured Blogs
```sql
-- SQLite
SELECT * FROM published_blogs_summary WHERE featured = 1;

-- PostgreSQL
SELECT * FROM featured_blogs;
```

### Search Blogs (PostgreSQL)
```sql
SELECT * FROM search_blogs('react hooks');
```

### Get Blogs by Tag
```sql
-- SQLite
SELECT * FROM blogs WHERE tags LIKE '%react%' AND status = 'published';

-- PostgreSQL
SELECT * FROM get_blogs_by_tag('react');
-- OR
SELECT * FROM blogs WHERE tags @> '["react"]'::jsonb AND status = 'published';
```

### Increment Views
```sql
-- SQLite
UPDATE blogs SET view_count = view_count + 1 WHERE slug = 'your-slug';

-- PostgreSQL
SELECT increment_blog_views('your-slug');
```

---

## ✏️ CRUD Operations

### Create Blog
```sql
INSERT INTO blogs (slug, title, excerpt, content, date, author, status, is_multipage)
VALUES (
    'my-new-blog',
    'My New Blog',
    'This is an exciting new blog post',
    '# My New Blog\n\nContent goes here...',
    CURRENT_DATE,
    'Your Name',
    'published',
    FALSE
);
```

### Create Multi-page Blog
```sql
-- 1. Create blog
INSERT INTO blogs (slug, title, excerpt, date, author, status, is_multipage)
VALUES (
    'my-guide',
    'Complete Guide',
    'A comprehensive guide',
    CURRENT_DATE,
    'Your Name',
    'published',
    TRUE
) RETURNING id;

-- 2. Add pages (use the returned id)
INSERT INTO blog_pages (blog_id, slug, title, content, page_order) VALUES
    (1, 'intro', 'Introduction', '# Intro\n\nContent...', 0),
    (1, 'chapter-1', 'Chapter 1', '# Chapter 1\n\nContent...', 1),
    (1, 'chapter-2', 'Chapter 2', '# Chapter 2\n\nContent...', 2);
```

### Update Blog
```sql
UPDATE blogs
SET title = 'Updated Title',
    excerpt = 'Updated excerpt',
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'your-slug';
```

### Delete Blog (cascades to pages)
```sql
DELETE FROM blogs WHERE slug = 'your-slug';
```

### Update Page Order
```sql
UPDATE blog_pages
SET page_order = 1
WHERE blog_id = 1 AND slug = 'chapter-1';
```

---

## 🏷️ Tag Operations

### Add Tags (PostgreSQL)
```sql
UPDATE blogs
SET tags = '["react", "javascript", "tutorial"]'::jsonb
WHERE slug = 'your-slug';
```

### Append Tag (PostgreSQL)
```sql
UPDATE blogs
SET tags = tags || '["new-tag"]'::jsonb
WHERE slug = 'your-slug';
```

### Remove Tag (PostgreSQL)
```sql
UPDATE blogs
SET tags = tags - 'old-tag'
WHERE slug = 'your-slug';
```

---

## 🔍 Analytics

### View Count by Blog
```sql
SELECT slug, title, view_count
FROM blogs
WHERE status = 'published'
ORDER BY view_count DESC
LIMIT 10;
```

### Engagement Rate
```sql
SELECT 
    slug,
    title,
    view_count,
    like_count,
    ROUND((like_count * 100.0 / NULLIF(view_count, 0)), 2) as engagement_rate
FROM blogs
WHERE status = 'published'
ORDER BY engagement_rate DESC;
```

### Most Popular Tags (PostgreSQL)
```sql
SELECT 
    tag,
    COUNT(*) as blog_count
FROM blogs,
    jsonb_array_elements_text(tags) as tag
WHERE status = 'published'
GROUP BY tag
ORDER BY blog_count DESC;
```

---

## 🛠️ Maintenance

### Update Read Times
```sql
UPDATE blogs
SET readTime = 
    CASE 
        WHEN LENGTH(content) / 5 / 200 < 1 THEN '1 min read'
        ELSE (LENGTH(content) / 5 / 200) || ' min read'
    END
WHERE content IS NOT NULL AND is_multipage = FALSE;
```

### Fix Published Timestamps
```sql
UPDATE blogs
SET published_at = created_at
WHERE status = 'published' AND published_at IS NULL;
```

### Reorder Pages Sequentially
```sql
WITH ordered_pages AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY blog_id ORDER BY page_order) - 1 as new_order
    FROM blog_pages
)
UPDATE blog_pages
SET page_order = (SELECT new_order FROM ordered_pages WHERE ordered_pages.id = blog_pages.id);
```

### Clean Up Drafts Older than 6 Months
```sql
-- SQLite
UPDATE blogs SET status = 'archived' 
WHERE status = 'draft' AND created_at < date('now', '-6 months');

-- PostgreSQL
UPDATE blogs SET status = 'archived' 
WHERE status = 'draft' AND created_at < CURRENT_TIMESTAMP - INTERVAL '6 months';
```

---

## 🔄 Conversions

### Single-page → Multi-page
```sql
-- 1. Update flag
UPDATE blogs SET is_multipage = TRUE WHERE slug = 'your-slug';

-- 2. Move content to first page
INSERT INTO blog_pages (blog_id, slug, title, content, page_order)
SELECT id, 'introduction', 'Introduction', content, 0
FROM blogs WHERE slug = 'your-slug';

-- 3. Clear original content
UPDATE blogs SET content = NULL WHERE slug = 'your-slug';
```

### Multi-page → Single-page
```sql
-- 1. Concatenate pages
UPDATE blogs
SET content = (
    SELECT string_agg(bp.content, E'\n\n---\n\n' ORDER BY bp.page_order)
    FROM blog_pages bp WHERE bp.blog_id = blogs.id
),
is_multipage = FALSE
WHERE slug = 'your-slug';

-- 2. Delete pages
DELETE FROM blog_pages
WHERE blog_id = (SELECT id FROM blogs WHERE slug = 'your-slug');
```

---

## 💾 Backup & Restore

### SQLite Backup
```bash
# Backup entire database
sqlite3 blog.db ".backup backup.db"

# Export to SQL
sqlite3 blog.db ".dump" > backup.sql

# Restore from backup
sqlite3 new_blog.db < backup.sql
```

### PostgreSQL Backup
```bash
# Export via pg_dump
pg_dump -h your-db.supabase.co -U postgres -d postgres > backup.sql

# Export specific table
pg_dump -h your-db.supabase.co -U postgres -t blogs -d postgres > blogs_backup.sql

# Restore
psql -h your-db.supabase.co -U postgres -d postgres < backup.sql
```

### CSV Export (PostgreSQL)
```sql
-- From psql
\copy (SELECT * FROM blogs) TO '/tmp/blogs.csv' WITH CSV HEADER;
\copy (SELECT * FROM blog_pages) TO '/tmp/pages.csv' WITH CSV HEADER;
```

---

## 🐛 Debugging

### Find Orphaned Pages
```sql
SELECT bp.*
FROM blog_pages bp
LEFT JOIN blogs b ON bp.blog_id = b.id
WHERE b.id IS NULL;
```

### Find Multi-page Blogs Without Pages
```sql
SELECT b.*
FROM blogs b
LEFT JOIN blog_pages bp ON b.id = bp.blog_id
WHERE b.is_multipage = TRUE
GROUP BY b.id
HAVING COUNT(bp.id) = 0;
```

### Check for Duplicate Slugs
```sql
SELECT slug, COUNT(*) as count
FROM blogs
GROUP BY slug
HAVING COUNT(*) > 1;
```

### Verify Foreign Keys
```sql
SELECT bp.id, bp.blog_id, bp.title
FROM blog_pages bp
LEFT JOIN blogs b ON bp.blog_id = b.id
WHERE b.id IS NULL;
```

---

## 📈 Performance

### Check Index Usage (PostgreSQL)
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Unused Indexes (PostgreSQL)
```sql
SELECT indexname
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey';
```

### Rebuild Search Vectors (PostgreSQL)
```sql
UPDATE blogs SET updated_at = updated_at;
UPDATE blog_pages SET updated_at = updated_at;
```

---

## 🔐 Security (PostgreSQL/Supabase)

### View RLS Policies
```sql
SELECT * FROM pg_policies WHERE tablename IN ('blogs', 'blog_pages');
```

### Enable/Disable RLS
```sql
-- Enable
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Disable (careful!)
ALTER TABLE blogs DISABLE ROW LEVEL SECURITY;
```

### Create Custom Policy
```sql
CREATE POLICY "Your custom policy"
    ON blogs FOR SELECT
    USING (status = 'published' OR auth.uid() = user_id);
```

---

## 📊 Reporting

### Monthly Stats
```sql
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as blogs_created,
    SUM(view_count) as total_views
FROM blogs
GROUP BY month
ORDER BY month DESC;
```

### Author Stats
```sql
SELECT 
    author,
    COUNT(*) as total_blogs,
    SUM(view_count) as total_views,
    AVG(view_count) as avg_views
FROM blogs
GROUP BY author
ORDER BY total_blogs DESC;
```

---

## 🎯 Tips

1. **Always backup before major operations**
2. **Use transactions for multi-step operations**
3. **Test queries on development data first**
4. **Use EXPLAIN ANALYZE to check query performance**
5. **Keep your indexes up to date**
6. **Monitor slow queries**
7. **Use prepared statements in application code**

---

## 📚 More Resources

- Full Schema: `schema.sql` (SQLite) or `schema-postgres.sql` (PostgreSQL)
- Utilities: `utilities.sql` (advanced queries)
- Migration: `migrate-sqlite-to-postgres.js` (data migration)
- Complete Docs: `README.md`

---

**Quick Access Commands**

```bash
# SQLite console
sqlite3 blog.db

# PostgreSQL console (Supabase)
psql -h your-project.supabase.co -U postgres -d postgres

# Run SQL file
sqlite3 blog.db < file.sql
psql -h your-db.supabase.co -U postgres -d postgres -f file.sql
```

---

Last Updated: 2024 | Version: 2.0
