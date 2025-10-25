#!/usr/bin/env node

/**
 * SQLite to PostgreSQL Migration Script
 * 
 * This script helps migrate blog data from SQLite to PostgreSQL/Supabase
 * 
 * Usage:
 *   node migrate-sqlite-to-postgres.js
 * 
 * Requirements:
 *   npm install better-sqlite3 @supabase/supabase-js dotenv
 */

require('dotenv').config();
const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SQLITE_DB_PATH = '../blog.db';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin access

// Initialize connections
const sqliteDb = new Database(SQLITE_DB_PATH, { readonly: true });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Convert SQLite boolean (0/1) to PostgreSQL boolean
 */
function toBool(value) {
    return value === 1 || value === '1' || value === true;
}

/**
 * Parse tags from SQLite (string) to PostgreSQL (JSONB)
 */
function parseTags(tagsString) {
    if (!tagsString) return [];
    
    try {
        // If it's already JSON, parse it
        if (tagsString.startsWith('[')) {
            return JSON.parse(tagsString);
        }
        // If it's comma-separated, split it
        return tagsString.split(',').map(t => t.trim());
    } catch (error) {
        console.warn('Failed to parse tags:', tagsString);
        return [];
    }
}

/**
 * Migrate blogs from SQLite to PostgreSQL
 */
async function migrateBlogs() {
    console.log('📚 Migrating blogs...');
    
    // Get all blogs from SQLite
    const blogs = sqliteDb.prepare('SELECT * FROM blogs').all();
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const blog of blogs) {
        try {
            // Transform SQLite data to PostgreSQL format
            const pgBlog = {
                slug: blog.slug,
                title: blog.title,
                excerpt: blog.excerpt,
                content: blog.content,
                date: blog.date,
                readTime: blog.readTime || blog.read_time,
                author: blog.author,
                is_multipage: toBool(blog.is_multipage),
                cover_light: blog.cover_light,
                cover_dark: blog.cover_dark,
                github_folder_name: blog.github_folder_name,
                github_repo_url: blog.github_repo_url,
                image: blog.image,
                tags: parseTags(blog.tags),
                status: blog.status || 'published',
                featured: toBool(blog.featured),
                meta_description: blog.meta_description,
                meta_keywords: blog.meta_keywords,
                view_count: blog.view_count || 0,
                like_count: blog.like_count || 0,
                created_at: blog.created_at,
                updated_at: blog.updated_at,
                published_at: blog.published_at
            };
            
            // Insert into Supabase
            const { data, error } = await supabase
                .from('blogs')
                .upsert(pgBlog, { onConflict: 'slug' })
                .select();
            
            if (error) {
                console.error(`❌ Error migrating blog "${blog.title}":`, error.message);
                errorCount++;
            } else {
                console.log(`✅ Migrated blog: ${blog.title}`);
                successCount++;
                
                // Store the new ID for page migration
                blog.pg_id = data[0].id;
            }
        } catch (error) {
            console.error(`❌ Exception migrating blog "${blog.title}":`, error.message);
            errorCount++;
        }
    }
    
    console.log(`\n📊 Blogs migration complete: ${successCount} succeeded, ${errorCount} failed\n`);
    return blogs;
}

/**
 * Migrate blog pages from SQLite to PostgreSQL
 */
async function migrateBlogPages(blogs) {
    console.log('📄 Migrating blog pages...');
    
    // Get all pages from SQLite
    const pages = sqliteDb.prepare('SELECT * FROM blog_pages').all();
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const page of pages) {
        try {
            // Find the corresponding blog in PostgreSQL
            const sqliteBlog = blogs.find(b => b.id === page.blog_id);
            if (!sqliteBlog || !sqliteBlog.pg_id) {
                console.error(`❌ Cannot find PostgreSQL blog for page "${page.title}"`);
                errorCount++;
                continue;
            }
            
            // Transform SQLite data to PostgreSQL format
            const pgPage = {
                blog_id: sqliteBlog.pg_id,
                slug: page.slug,
                title: page.title,
                content: page.content,
                page_order: page.page_order || 0,
                excerpt: page.excerpt,
                created_at: page.created_at,
                updated_at: page.updated_at
            };
            
            // Insert into Supabase
            const { error } = await supabase
                .from('blog_pages')
                .upsert(pgPage, { onConflict: 'blog_id,slug' });
            
            if (error) {
                console.error(`❌ Error migrating page "${page.title}":`, error.message);
                errorCount++;
            } else {
                console.log(`✅ Migrated page: ${page.title}`);
                successCount++;
            }
        } catch (error) {
            console.error(`❌ Exception migrating page "${page.title}":`, error.message);
            errorCount++;
        }
    }
    
    console.log(`\n📊 Pages migration complete: ${successCount} succeeded, ${errorCount} failed\n`);
}

/**
 * Verify migration
 */
async function verifyMigration() {
    console.log('🔍 Verifying migration...\n');
    
    // Count SQLite records
    const sqliteBlogs = sqliteDb.prepare('SELECT COUNT(*) as count FROM blogs').get();
    const sqlitePages = sqliteDb.prepare('SELECT COUNT(*) as count FROM blog_pages').get();
    
    // Count PostgreSQL records
    const { count: pgBlogsCount } = await supabase
        .from('blogs')
        .select('*', { count: 'exact', head: true });
    
    const { count: pgPagesCount } = await supabase
        .from('blog_pages')
        .select('*', { count: 'exact', head: true });
    
    console.log('📊 Migration Summary:');
    console.log('─────────────────────────────────');
    console.log(`SQLite Blogs:      ${sqliteBlogs.count}`);
    console.log(`PostgreSQL Blogs:  ${pgBlogsCount}`);
    console.log(`─────────────────────────────────`);
    console.log(`SQLite Pages:      ${sqlitePages.count}`);
    console.log(`PostgreSQL Pages:  ${pgPagesCount}`);
    console.log('─────────────────────────────────\n');
    
    if (pgBlogsCount >= sqliteBlogs.count && pgPagesCount >= sqlitePages.count) {
        console.log('✅ Migration appears successful!');
    } else {
        console.log('⚠️  Some records may not have been migrated. Please verify manually.');
    }
}

/**
 * Main migration function
 */
async function main() {
    console.log('🚀 Starting SQLite to PostgreSQL migration...\n');
    
    // Check configuration
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ Missing Supabase configuration!');
        console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file');
        process.exit(1);
    }
    
    try {
        // Step 1: Migrate blogs
        const blogs = await migrateBlogs();
        
        // Step 2: Migrate blog pages
        await migrateBlogPages(blogs);
        
        // Step 3: Verify migration
        await verifyMigration();
        
        console.log('\n✨ Migration complete!');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        // Close SQLite connection
        sqliteDb.close();
    }
}

// Run migration
main();
