# Database Schema Documentation

This directory contains the complete database schemas for the **Ultimate Blog System** with multi-page blog support and GitBook integration.

## 📁 Files

### Core Schema Files

#### `schema.sql` - SQLite Schema
- **Purpose**: Local development with SQLite
- **Use Case**: Backend API running with SQLite (`blog.db`)
- **Features**: Simple setup, portable, no server required

#### `schema-postgres.sql` - PostgreSQL/Supabase Schema  
- **Purpose**: Production deployment with Supabase/PostgreSQL
- **Use Case**: Full-featured production system with advanced features
- **Features**: Full-text search, JSONB tags, RLS policies, advanced indexing

### Utility Files

#### `utilities.sql` - Database Utilities
- **Purpose**: Collection of helpful queries for database management
- **Includes**: Analytics, maintenance, debugging, performance analysis, reporting queries
- **Use**: Reference for common operations and maintenance tasks

#### `migrate-sqlite-to-postgres.js` - Migration Script
- **Purpose**: Migrate data from SQLite to PostgreSQL/Supabase
- **Usage**: `node migrate-sqlite-to-postgres.js`
- **Requirements**: `better-sqlite3`, `@supabase/supabase-js`, `dotenv`

#### `seed-database.js` - Test Data Generator
- **Purpose**: Generate realistic test data for development
- **Usage**: `node seed-database.js --count 20 --multipage 50`
- **Features**: Configurable blog count, multi-page percentage, realistic content

### Documentation

#### `README.md` - This File
- **Purpose**: Complete database documentation
- **Includes**: Setup guides, query examples, maintenance tips, troubleshooting

#### `QUICK_REFERENCE.md` - Cheat Sheet
- **Purpose**: Quick reference for common operations
- **Includes**: CRUD operations, searches, analytics, maintenance commands

---

## 🗄️ Database Architecture

### Two-Table Design

#### 1. **`blogs`** Table
Main table for blog metadata and content.

**Key Fields:**
- `id` - Primary key
- `slug` - Unique URL-friendly identifier
- `title` - Blog title
- `excerpt` - Short description
- `content` - Full content (for single-page blogs)
- `is_multipage` - Boolean flag for multi-page blogs
- `cover_light` / `cover_dark` - Cover images for light/dark mode
- `github_folder_name` - Folder name in GitHub repo
- `tags` - Tags (JSON in SQLite, JSONB in PostgreSQL)
- `status` - Draft, published, or archived
- `featured` - Featured blog flag
- `view_count` / `like_count` - Analytics

#### 2. **`blog_pages`** Table
Individual pages for multi-page blogs (GitBook-style).

**Key Fields:**
- `id` - Primary key
- `blog_id` - Foreign key to blogs table
- `slug` - Page slug (unique within blog)
- `title` - Page title
- `content` - Page content (Markdown)
- `page_order` - Display order
- `excerpt` - Optional page description

---

## 🚀 Getting Started

### For SQLite (Local Development)

```bash
# Navigate to backend directory
cd backend

# Create database and run schema
sqlite3 blog.db < database/schema.sql

# Verify tables were created
sqlite3 blog.db "SELECT name FROM sqlite_master WHERE type='table';"
```

### For Supabase (Production)

1. **Open Supabase Dashboard**
   - Go to your project at https://app.supabase.com
   - Navigate to SQL Editor

2. **Run the Schema**
   - Copy contents of `schema-postgres.sql`
   - Paste into SQL Editor
   - Click "Run"

3. **Verify Installation**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

4. **Check Sample Data**
   ```sql
   SELECT * FROM published_blogs_summary;
   ```

---

## 🔍 Key Features

### SQLite Schema (`schema.sql`)
- ✅ Simple integer primary keys with autoincrement
- ✅ Integer-based boolean flags (0/1)
- ✅ String-based tags (JSON as text)
- ✅ Triggers for automatic timestamps
- ✅ Views for common queries
- ✅ Sample data included

### PostgreSQL Schema (`schema-postgres.sql`)
- ✅ **Serial/BigSerial** primary keys for scalability
- ✅ **Native boolean** types
- ✅ **JSONB** for efficient tag querying
- ✅ **Full-text search** with tsvector and GIN indexes
- ✅ **Triggers** for auto-updates and search vector maintenance
- ✅ **Views** for common queries
- ✅ **Functions** for complex operations (search, tag filtering)
- ✅ **Row Level Security (RLS)** policies for Supabase auth
- ✅ **Advanced indexes** for performance optimization
- ✅ Sample data with conflict handling

---

## 📊 Database Views

Both schemas include helpful views:

### `published_blogs_summary`
All published blogs with page counts.
```sql
SELECT * FROM published_blogs_summary;
```

### `multipage_blogs_detail`
Multi-page blogs with all their pages.
```sql
SELECT * FROM multipage_blogs_detail;
```

### PostgreSQL-Only Views:

#### `featured_blogs`
Get featured blogs only.
```sql
SELECT * FROM featured_blogs;
```

#### `popular_blogs`
Blogs sorted by view count.
```sql
SELECT * FROM popular_blogs;
```

---

## 🔧 Utility Functions (PostgreSQL Only)

### Search Blogs
```sql
-- Search for blogs containing "react"
SELECT * FROM search_blogs('react');
```

### Get Blog with Pages
```sql
-- Get complete blog data including all pages
SELECT * FROM get_blog_with_pages('complete-guide-to-react');
```

### Increment View Count
```sql
-- Track blog views
SELECT increment_blog_views('welcome-to-my-blog');
```

### Get Blogs by Tag
```sql
-- Find all React-related blogs
SELECT * FROM get_blogs_by_tag('react');
```

---

## 🔐 Row Level Security (RLS)

The PostgreSQL schema includes RLS policies for Supabase:

### Public Access
- ✅ Anyone can **view** published blogs
- ✅ Anyone can **view** pages of published blogs

### Authenticated Access
- ✅ Authenticated users can **create/update/delete** blogs
- ✅ Authenticated users can **create/update/delete** pages

### Customize Policies
To allow authenticated users to see drafts:
```sql
CREATE POLICY "Authenticated users can view all blogs"
    ON blogs FOR SELECT
    TO authenticated
    USING (true);
```

---

## 📈 Performance Optimizations

### Indexes Created

**For `blogs` table:**
- `slug` (unique lookups)
- `status` (filtering published blogs)
- `date` (sorting by date)
- `featured` (featured blogs)
- `is_multipage` (filtering multi-page blogs)
- `tags` (JSONB GIN index for tag queries) - PostgreSQL only
- `search_vector` (full-text search) - PostgreSQL only

**For `blog_pages` table:**
- `blog_id` (foreign key lookups)
- `slug` (page lookups)
- `(blog_id, page_order)` (ordered page retrieval)
- `search_vector` (full-text search) - PostgreSQL only

### Composite Indexes (PostgreSQL)
- `(status, date)` - Common filtering + sorting
- `(status, featured)` - Featured published blogs

---

## 🏷️ Tag System

### SQLite
Tags stored as JSON text:
```json
["react", "javascript", "tutorial"]
```

Query by tag:
```sql
SELECT * FROM blogs WHERE tags LIKE '%react%' AND status = 'published';
```

### PostgreSQL
Tags stored as JSONB with GIN index:
```json
["react", "javascript", "tutorial"]
```

Query by tag (optimized):
```sql
SELECT * FROM blogs WHERE tags @> '["react"]'::jsonb AND status = 'published';
```

Or use the function:
```sql
SELECT * FROM get_blogs_by_tag('react');
```

---

## 🔄 Automatic Updates

Both schemas include triggers for:

1. **Auto-updating timestamps**
   - `updated_at` automatically set on any update
   
2. **Parent blog updates**
   - When a page is modified, the parent blog's `updated_at` is updated

3. **Search vector updates** (PostgreSQL only)
   - Full-text search vectors automatically updated on insert/update

---

## 🧪 Sample Data

Both schemas include sample data to help you get started:

### Sample Blogs:
1. **"Welcome to My Blog"** - Single-page blog
2. **"Complete Guide to React"** - Multi-page blog with 5 pages

### Remove Sample Data
If you don't want sample data, comment out the `INSERT` statements before running the schema.

---

## 📝 Common Queries

### Get All Published Blogs
```sql
SELECT * FROM published_blogs_summary ORDER BY date DESC;
```

### Get Single Blog with Pages
```sql
-- SQLite
SELECT b.*, bp.* 
FROM blogs b 
LEFT JOIN blog_pages bp ON b.id = bp.blog_id 
WHERE b.slug = 'complete-guide-to-react' 
ORDER BY bp.page_order;

-- PostgreSQL
SELECT * FROM get_blog_with_pages('complete-guide-to-react');
```

### Get All Pages for a Blog
```sql
SELECT * FROM blog_pages 
WHERE blog_id = (SELECT id FROM blogs WHERE slug = 'complete-guide-to-react')
ORDER BY page_order;
```

### Search Blogs (PostgreSQL)
```sql
SELECT * FROM search_blogs('react hooks tutorial');
```

### Increment View Count
```sql
-- SQLite
UPDATE blogs SET view_count = view_count + 1 WHERE slug = 'welcome-to-my-blog';

-- PostgreSQL
SELECT increment_blog_views('welcome-to-my-blog');
```

### Get Featured Blogs
```sql
-- SQLite
SELECT * FROM published_blogs_summary WHERE featured = 1;

-- PostgreSQL
SELECT * FROM featured_blogs;
```

---

## 🛠️ Maintenance

### Backup Database

**SQLite:**
```bash
# Backup to file
sqlite3 blog.db ".backup backup.db"

# Or export to SQL
sqlite3 blog.db ".dump" > backup.sql
```

**PostgreSQL/Supabase:**
- Use Supabase dashboard for automatic backups
- Or use `pg_dump` for manual backups

### Reset View Counts
```sql
UPDATE blogs SET view_count = 0;
```

### Archive Old Drafts
```sql
-- SQLite
UPDATE blogs SET status = 'archived' 
WHERE status = 'draft' 
AND created_at < date('now', '-6 months');

-- PostgreSQL
UPDATE blogs SET status = 'archived' 
WHERE status = 'draft' 
AND created_at < CURRENT_TIMESTAMP - INTERVAL '6 months';
```

### Database Statistics (PostgreSQL)
```sql
SELECT 
    'blogs' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE status = 'published') as published,
    COUNT(*) FILTER (WHERE status = 'draft') as drafts,
    COUNT(*) FILTER (WHERE is_multipage = TRUE) as multipage
FROM blogs
UNION ALL
SELECT 
    'blog_pages' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT blog_id) as unique_blogs,
    NULL,
    NULL
FROM blog_pages;
```

---

## 🚨 Migration Guide

### From SQLite to PostgreSQL

1. **Export SQLite Data**
   ```bash
   sqlite3 blog.db ".mode insert blogs" ".output blogs.sql" "SELECT * FROM blogs;"
   sqlite3 blog.db ".mode insert blog_pages" ".output blog_pages.sql" "SELECT * FROM blog_pages;"
   ```

2. **Adjust Data Types**
   - Change `0/1` to `FALSE/TRUE` for boolean fields
   - Convert JSON text to JSONB format

3. **Import to PostgreSQL**
   - Run `schema-postgres.sql` first
   - Import adjusted data

### From Single-Page to Multi-Page

```sql
-- Convert a single-page blog to multi-page
-- 1. Update blog
UPDATE blogs SET is_multipage = TRUE WHERE slug = 'your-blog-slug';

-- 2. Move content to first page
INSERT INTO blog_pages (blog_id, slug, title, content, page_order)
SELECT id, 'introduction', 'Introduction', content, 0
FROM blogs WHERE slug = 'your-blog-slug';

-- 3. Optional: Clear original content
UPDATE blogs SET content = NULL WHERE slug = 'your-blog-slug';
```

---

## 📚 Schema Evolution

When updating the schema in production:

1. **Always backup first!**
2. Test changes in development
3. Use migrations (not DROP TABLE) in production
4. Consider using database migration tools:
   - SQLite: Simple SQL scripts
   - PostgreSQL: Alembic, Flyway, or Supabase Migrations

---

## 🔗 Related Documentation

- [Blog System Overview](../BLOG_SYSTEM.md)
- [GitBook Setup Guide](../GITBOOK_REPO_SETUP.md)
- [GitHub Actions Workflow](../EXTERNAL_REPO_WORKFLOW.yml)
- [Supabase Setup Guide](../SUPABASE_GUIDE.md)

---

## 🐛 Troubleshooting

### "Table already exists" error
The schemas include `DROP TABLE IF EXISTS` - this will delete existing data. Remove these lines if you want to preserve data.

### Search not working (PostgreSQL)
Rebuild search vectors:
```sql
UPDATE blogs SET updated_at = updated_at;
UPDATE blog_pages SET updated_at = updated_at;
```

### Slow queries
Check if indexes are being used:
```sql
EXPLAIN ANALYZE SELECT * FROM blogs WHERE slug = 'test';
```

### Foreign key violations
Make sure blog exists before creating pages:
```sql
INSERT INTO blogs (...) VALUES (...);
-- Use RETURNING id or get id from last insert
INSERT INTO blog_pages (blog_id, ...) VALUES (blog_id, ...);
```

---

## 💡 Tips

1. **Use views** for common queries instead of complex JOINs
2. **Use functions** (PostgreSQL) for reusable logic
3. **Monitor query performance** regularly
4. **Keep indexes up to date** with your query patterns
5. **Use prepared statements** in your application code
6. **Enable query logging** during development
7. **Regular backups** are essential!

---

## 📞 Support

For questions or issues:
1. Check the troubleshooting section above
2. Review the inline comments in the schema files
3. Consult the related documentation
4. Review Supabase docs for PostgreSQL-specific features

---

**Last Updated:** 2024
**Version:** 2.0 (Multi-page blog system with GitBook integration)
