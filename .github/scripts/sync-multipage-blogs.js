const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');
const glob = require('glob');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// GitHub raw content base URL
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${process.env.GITHUB_REPOSITORY}/main`;

class GitHubBlogSync {
  constructor() {
    this.blogDir = 'blogs';
    this.processedBlogs = [];
    this.errors = [];
  }

  async syncAllBlogs() {
    try {
      console.log('🚀 Starting blog sync...');
      
      // Find all blog folders (folders containing README.md or SUMMARY.md)
      const blogFolders = this.findBlogFolders();
      console.log(`📚 Found ${blogFolders.length} blog folder(s) to process`);

      for (const folderPath of blogFolders) {
        try {
          await this.processBlogFolder(folderPath);
        } catch (error) {
          console.error(`❌ Error processing ${folderPath}:`, error.message);
          this.errors.push({ folder: folderPath, error: error.message });
        }
      }

      console.log(`✅ Successfully processed ${this.processedBlogs.length} blogs`);
      if (this.errors.length > 0) {
        console.log(`⚠️  ${this.errors.length} errors occurred`);
        this.errors.forEach(err => console.log(`   - ${err.folder}: ${err.error}`));
      }

    } catch (error) {
      console.error('💥 Fatal error during sync:', error);
      process.exit(1);
    }
  }

  findBlogFolders() {
    // Find all folders containing README.md or SUMMARY.md
    const readmeFiles = glob.sync(`${this.blogDir}/*/README.md`);
    return [...new Set(readmeFiles.map(f => path.dirname(f)))];
  }

  async processBlogFolder(folderPath) {
    console.log(`📖 Processing folder: ${folderPath}`);
    
    const blogSlug = path.basename(folderPath);
    
    // Check if SUMMARY.md exists (GitBook multi-page structure)
    const summaryPath = path.join(folderPath, 'SUMMARY.md');
    const hasSummary = await this.fileExists(summaryPath);
    
    if (hasSummary) {
      await this.processMultiPageBlog(folderPath, blogSlug);
    } else {
      await this.processSinglePageBlog(folderPath, blogSlug);
    }
  }

  async processSinglePageBlog(folderPath, blogSlug) {
    console.log(`  📄 Single-page blog: ${blogSlug}`);
    
    const readmePath = path.join(folderPath, 'README.md');
    const content = await fs.readFile(readmePath, 'utf-8');
    const parsed = frontMatter(content);
    
    // Extract metadata
    const metadata = this.extractMetadata(parsed, blogSlug);
    
    // Create/update blog entry
    const blog = await this.upsertBlog({
      ...metadata,
      slug: blogSlug,
      is_multipage: false,
      page_count: 1
    });
    
    // Create/update the main page
    await this.upsertBlogPage({
      blog_id: blog.id,
      title: metadata.title,
      slug: 'main',
      page_order: 0,
      content: parsed.body
    });
    
    this.processedBlogs.push({
      title: metadata.title,
      slug: blogSlug,
      type: 'single-page'
    });
  }

  async processMultiPageBlog(folderPath, blogSlug) {
    console.log(`  📚 Multi-page blog: ${blogSlug}`);
    
    const summaryPath = path.join(folderPath, 'SUMMARY.md');
    const readmePath = path.join(folderPath, 'README.md');
    
    // Parse SUMMARY.md to get page structure
    const pages = await this.parseSummary(summaryPath, folderPath);
    
    // Get main page metadata from README.md
    const readmeContent = await fs.readFile(readmePath, 'utf-8');
    const parsed = frontMatter(readmeContent);
    const metadata = this.extractMetadata(parsed, blogSlug);
    
    // Create/update blog entry
    const blog = await this.upsertBlog({
      ...metadata,
      slug: blogSlug,
      is_multipage: true,
      page_count: pages.length
    });
    
    // Create/update all pages
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      try {
        const pageContent = await fs.readFile(page.filePath, 'utf-8');
        const pageParsed = frontMatter(pageContent);
        
        await this.upsertBlogPage({
          blog_id: blog.id,
          title: page.title,
          slug: page.slug,
          page_order: i,
          content: pageParsed.body
        });
        
        console.log(`    ✅ Synced page ${i}: ${page.title}`);
      } catch (error) {
        console.error(`    ❌ Error syncing page ${page.title}:`, error.message);
      }
    }
    
    this.processedBlogs.push({
      title: metadata.title,
      slug: blogSlug,
      type: 'multi-page',
      pages: pages.length
    });
  }

  async parseSummary(summaryPath, folderPath) {
    const content = await fs.readFile(summaryPath, 'utf-8');
    const pages = [];
    
    // Parse markdown links from SUMMARY.md
    // Format: * [Title](path/to/file.md)
    const linkRegex = /\*\s*\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      const title = match[1].trim();
      const relativePath = match[2].trim();
      const filePath = path.join(folderPath, relativePath);
      
      // Generate slug from title
      const slug = this.generateSlug(title);
      
      pages.push({
        title,
        slug,
        filePath,
        relativePath
      });
    }
    
    return pages;
  }

  extractMetadata(parsed, blogSlug) {
    const { attributes, body } = parsed;
    
    // Get title from frontmatter or first heading
    let title = attributes.title;
    if (!title) {
      const titleMatch = body.match(/^#\s+(.+)$/m);
      title = titleMatch ? titleMatch[1] : blogSlug.replace(/-/g, ' ');
    }
    
    // Use description from frontmatter as excerpt
    let excerpt = attributes.description || attributes.excerpt || '';
    
    // If no frontmatter description, extract first paragraph
    if (!excerpt) {
      const withoutHeadings = body.replace(/^#+\s+.+$/gm, '').trim();
      const firstParagraph = withoutHeadings.split('\n\n')[0];
      if (firstParagraph) {
        excerpt = firstParagraph
          .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
          .replace(/[*_`]/g, '')
          .replace(/^>\s*/gm, '')
          .trim();
        
        if (excerpt.length > 200) {
          excerpt = excerpt.substring(0, 200).trim() + '...';
        }
      }
    }
    
    // Estimate reading time
    const wordCount = body.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);
    
    // Extract cover art information
    const cover = attributes.cover || {};
    const layout = attributes.layout || {};
    const coverConfig = layout.cover || {};
    
    return {
      title: title.trim(),
      excerpt: excerpt.trim(),
      tags: attributes.tags || attributes.categories || [],
      featured: attributes.featured || false,
      date: attributes.date || new Date().toISOString().split('T')[0],
      read_time: `${readTime} min read`,
      status: attributes.status || 'published',
      // Cover art fields
      cover_light: cover.light || null,
      cover_dark: cover.dark || null,
      cover_y: attributes.coverY || 0,
      cover_visible: coverConfig.visible !== false, // Default true
      cover_size: coverConfig.size || 'hero' // hero, full, or small
    };
  }

  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async upsertBlog(blogData) {
    try {
      // Check if blog exists
      const { data: existing } = await supabase
        .from('blogs')
        .select('id')
        .eq('slug', blogData.slug)
        .single();

      const dataToSave = {
        title: blogData.title,
        excerpt: blogData.excerpt,
        date: blogData.date,
        read_time: blogData.read_time,
        tags: JSON.stringify(blogData.tags),
        featured: blogData.featured,
        slug: blogData.slug,
        status: blogData.status,
        is_multipage: blogData.is_multipage,
        page_count: blogData.page_count,
        cover_light: blogData.cover_light,
        cover_dark: blogData.cover_dark,
        cover_y: blogData.cover_y,
        cover_visible: blogData.cover_visible,
        cover_size: blogData.cover_size,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        const { data, error } = await supabase
          .from('blogs')
          .update(dataToSave)
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        console.log(`  ✅ Updated blog: ${blogData.title}`);
        return data;
      } else {
        const { data, error } = await supabase
          .from('blogs')
          .insert([dataToSave])
          .select()
          .single();
        
        if (error) throw error;
        console.log(`  🆕 Created blog: ${blogData.title}`);
        return data;
      }
    } catch (error) {
      throw new Error(`Failed to upsert blog ${blogData.slug}: ${error.message}`);
    }
  }

  async upsertBlogPage(pageData) {
    try {
      // Check if page exists
      const { data: existing } = await supabase
        .from('blog_pages')
        .select('id')
        .eq('blog_id', pageData.blog_id)
        .eq('slug', pageData.slug)
        .single();

      const dataToSave = {
        blog_id: pageData.blog_id,
        title: pageData.title,
        slug: pageData.slug,
        page_order: pageData.page_order,
        content: pageData.content,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        const { error } = await supabase
          .from('blog_pages')
          .update(dataToSave)
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blog_pages')
          .insert([dataToSave]);
        
        if (error) throw error;
      }
    } catch (error) {
      throw new Error(`Failed to upsert page ${pageData.slug}: ${error.message}`);
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Run the sync
async function main() {
  const sync = new GitHubBlogSync();
  await sync.syncAllBlogs();
}

main().catch(console.error);
