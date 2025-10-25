#!/usr/bin/env node

/**
 * Database Seeder for Blog System
 * 
 * Generates realistic test data for development and testing
 * 
 * Usage:
 *   node seed-database.js [options]
 * 
 * Options:
 *   --db sqlite|postgres     Database type (default: sqlite)
 *   --count <number>         Number of blogs to create (default: 10)
 *   --multipage <percent>    Percentage of multi-page blogs (default: 40)
 *   --clean                  Clean existing data before seeding
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
    dbType: 'sqlite',
    count: 10,
    multipagePercent: 40,
    clean: false
};

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--db') config.dbType = args[++i];
    if (args[i] === '--count') config.count = parseInt(args[++i]);
    if (args[i] === '--multipage') config.multipagePercent = parseInt(args[++i]);
    if (args[i] === '--clean') config.clean = true;
}

// Sample data
const authors = ['Alex Chen', 'Jordan Smith', 'Sam Taylor', 'Casey Brown', 'Morgan Davis'];
const topics = ['Technology', 'Design', 'Programming', 'Science', 'Philosophy', 'Art', 'Writing'];
const adjectives = ['Complete', 'Ultimate', 'Comprehensive', 'Essential', 'Practical', 'Modern'];
const verbs = ['Guide', 'Tutorial', 'Introduction', 'Overview', 'Handbook', 'Primer'];

// Tag pool
const allTags = [
    'javascript', 'typescript', 'react', 'node', 'python', 'web-development',
    'design', 'ui-ux', 'tutorial', 'guide', 'beginner', 'advanced',
    'productivity', 'tools', 'best-practices', 'architecture', 'testing'
];

/**
 * Generate a random slug
 */
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Generate random date within last year
 */
function randomDate() {
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
}

/**
 * Generate random tags
 */
function randomTags(min = 2, max = 5) {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...allTags].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

/**
 * Generate blog title
 */
function generateTitle() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    const formats = [
        `${adj} ${verb} to ${topic}`,
        `The ${adj} ${topic} ${verb}`,
        `${topic}: A ${adj} ${verb}`,
        `Understanding ${topic}: ${adj} ${verb}`
    ];
    
    return formats[Math.floor(Math.random() * formats.length)];
}

/**
 * Generate excerpt
 */
function generateExcerpt(title) {
    const templates = [
        `Learn everything you need to know about ${title.toLowerCase()}.`,
        `A comprehensive guide covering all aspects of ${title.toLowerCase()}.`,
        `Master the fundamentals and advanced concepts of ${title.toLowerCase()}.`,
        `Discover the best practices and techniques in ${title.toLowerCase()}.`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Generate markdown content
 */
function generateContent(title, pages = 1) {
    const sections = [
        '## Introduction\n\nThis section introduces the main concepts.',
        '## Getting Started\n\nLet\'s begin with the basics.',
        '## Key Concepts\n\nUnderstand these fundamental ideas.',
        '## Advanced Topics\n\nDive deeper into complex scenarios.',
        '## Best Practices\n\nFollow these guidelines for success.',
        '## Common Pitfalls\n\nAvoid these common mistakes.',
        '## Conclusion\n\nWrap up what we\'ve learned.'
    ];
    
    let content = `# ${title}\n\n`;
    const numSections = Math.min(pages === 1 ? 4 : 2, sections.length);
    const selectedSections = [...sections].sort(() => 0.5 - Math.random()).slice(0, numSections);
    
    content += selectedSections.join('\n\n');
    content += '\n\n```javascript\n// Example code\nconst example = "Hello World";\nconsole.log(example);\n```\n\n';
    content += '> This is an important note to remember.\n\n';
    
    return content;
}

/**
 * Generate page title
 */
function generatePageTitle(index, total) {
    if (index === 0) return 'Introduction';
    if (index === total - 1) return 'Conclusion';
    
    const titles = [
        'Getting Started',
        'Core Concepts',
        'Advanced Topics',
        'Practical Examples',
        'Best Practices',
        'Common Patterns',
        'Troubleshooting',
        'Tips and Tricks'
    ];
    
    return titles[index % titles.length];
}

/**
 * Generate SQL for blog
 */
function generateBlogSQL(index, isMultipage, dbType = 'sqlite') {
    const title = generateTitle();
    const slug = generateSlug(title);
    const author = authors[Math.floor(Math.random() * authors.length)];
    const date = randomDate();
    const tags = randomTags();
    const excerpt = generateExcerpt(title);
    const readTime = `${Math.floor(Math.random() * 30) + 5} min read`;
    const featured = Math.random() > 0.7 ? 1 : 0;
    const viewCount = Math.floor(Math.random() * 1000);
    const likeCount = Math.floor(viewCount * (Math.random() * 0.2));
    
    const tagsString = dbType === 'postgres' 
        ? `'${JSON.stringify(tags)}'::jsonb`
        : `'${JSON.stringify(tags)}'`;
    
    const boolValue = (val) => dbType === 'postgres' ? (val ? 'TRUE' : 'FALSE') : val;
    
    if (isMultipage) {
        return `
-- Multi-page Blog #${index + 1}
INSERT INTO blogs (slug, title, excerpt, date, readTime, author, is_multipage, tags, status, featured, view_count, like_count)
VALUES (
    '${slug}',
    '${title}',
    '${excerpt}',
    '${date}',
    '${readTime}',
    '${author}',
    ${boolValue(1)},
    ${tagsString},
    'published',
    ${boolValue(featured)},
    ${viewCount},
    ${likeCount}
);
`;
    } else {
        const content = generateContent(title).replace(/'/g, "''");
        return `
-- Single-page Blog #${index + 1}
INSERT INTO blogs (slug, title, excerpt, content, date, readTime, author, is_multipage, tags, status, featured, view_count, like_count)
VALUES (
    '${slug}',
    '${title}',
    '${excerpt}',
    '${content}',
    '${date}',
    '${readTime}',
    '${author}',
    ${boolValue(0)},
    ${tagsString},
    'published',
    ${boolValue(featured)},
    ${viewCount},
    ${likeCount}
);
`;
    }
}

/**
 * Generate SQL for blog pages
 */
function generatePagesSQL(blogSlug, pageCount, dbType = 'sqlite') {
    const pages = [];
    
    for (let i = 0; i < pageCount; i++) {
        const pageTitle = generatePageTitle(i, pageCount);
        const pageSlug = generateSlug(pageTitle);
        const content = generateContent(pageTitle, pageCount).replace(/'/g, "''");
        const excerpt = `Learn about ${pageTitle.toLowerCase()} in this section.`;
        
        const blogIdQuery = dbType === 'postgres'
            ? `(SELECT id FROM blogs WHERE slug = '${blogSlug}')`
            : `(SELECT id FROM blogs WHERE slug = '${blogSlug}')`;
        
        pages.push(`
INSERT INTO blog_pages (blog_id, slug, title, content, page_order, excerpt)
VALUES (
    ${blogIdQuery},
    '${pageSlug}',
    '${pageTitle}',
    '${content}',
    ${i},
    '${excerpt}'
);`);
    }
    
    return pages.join('\n');
}

/**
 * Main seeder function
 */
function generateSeedSQL() {
    let sql = `-- =====================================================
-- DATABASE SEED DATA
-- Generated: ${new Date().toISOString()}
-- Config: ${JSON.stringify(config, null, 2)}
-- =====================================================

`;

    if (config.clean) {
        sql += `-- Clean existing data
DELETE FROM blog_pages;
DELETE FROM blogs;

`;
    }

    // Generate blogs
    const multipageThreshold = config.multipagePercent / 100;
    
    for (let i = 0; i < config.count; i++) {
        const isMultipage = Math.random() < multipageThreshold;
        sql += generateBlogSQL(i, isMultipage, config.dbType);
        
        // Generate pages for multi-page blogs
        if (isMultipage) {
            const pageCount = Math.floor(Math.random() * 5) + 3; // 3-7 pages
            const blogTitle = sql.match(/title,\s*excerpt/)[0];
            const slug = sql.match(/slug = '([^']+)'/)[1];
            
            sql += `\n-- Pages for ${slug}\n`;
            sql += generatePagesSQL(slug, pageCount, config.dbType);
            sql += '\n';
        }
    }
    
    sql += `
-- =====================================================
-- END OF SEED DATA
-- =====================================================
`;

    return sql;
}

// Generate and output
console.log('🌱 Generating seed data...');
console.log(`   Database: ${config.dbType}`);
console.log(`   Blogs: ${config.count}`);
console.log(`   Multi-page: ${config.multipagePercent}%`);
console.log(`   Clean: ${config.clean ? 'Yes' : 'No'}\n`);

const sql = generateSeedSQL();
const filename = `seed-${config.dbType}-${Date.now()}.sql`;
const filepath = path.join(__dirname, filename);

fs.writeFileSync(filepath, sql);

console.log(`✅ Seed file generated: ${filename}`);
console.log(`\nTo apply:`);

if (config.dbType === 'sqlite') {
    console.log(`   sqlite3 ../blog.db < ${filename}`);
} else {
    console.log(`   psql -h your-db.supabase.co -U postgres -d postgres -f ${filename}`);
    console.log(`   Or paste into Supabase SQL Editor`);
}

console.log('\n📊 Preview of generated data:');
console.log(sql.substring(0, 1000) + '...\n');
