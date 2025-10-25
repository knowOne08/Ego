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
      
      // Find all README.md files in blog folders
      const blogFiles = glob.sync(`${this.blogDir}/*/README.md`);
      console.log(`📚 Found ${blogFiles.length} blog(s) to process`);

      for (const filePath of blogFiles) {
        try {
          await this.processBlog(filePath);
        } catch (error) {
          console.error(`❌ Error processing ${filePath}:`, error.message);
          this.errors.push({ file: filePath, error: error.message });
        }
      }

      console.log(`✅ Successfully processed ${this.processedBlogs.length} blogs`);
      if (this.errors.length > 0) {
        console.log(`⚠️  ${this.errors.length} errors occurred`);
        this.errors.forEach(err => console.log(`   - ${err.file}: ${err.error}`));
      }

    } catch (error) {
      console.error('💥 Fatal error during sync:', error);
      process.exit(1);
    }
  }

  async processBlog(filePath) {
    console.log(`📖 Processing: ${filePath}`);
    
    // Extract blog folder name (used as slug)
    const blogFolder = path.dirname(filePath).split('/').pop();
    const blogFolderPath = path.dirname(filePath);
    
    // Read and parse markdown file
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = frontMatter(content);
    
    // Extract metadata from frontmatter or content
    const metadata = this.extractMetadata(parsed, blogFolder);
    
    // Process images and assets in the blog folder
    const processedContent = await this.processAssets(parsed.body, blogFolderPath, blogFolder);
    
    // Create/update blog in Supabase
    await this.upsertBlog(metadata, processedContent, blogFolder);
    
    this.processedBlogs.push({
      title: metadata.title,
      slug: blogFolder,
      folder: blogFolderPath
    });
  }

  extractMetadata(parsed, blogFolder) {
    const { attributes, body } = parsed;
    
    // Get title from frontmatter or first heading
    let title = attributes.title;
    if (!title) {
      const titleMatch = body.match(/^#\s+(.+)$/m);
      title = titleMatch ? titleMatch[1] : blogFolder.replace(/-/g, ' ');
    }
    
    // Use description from frontmatter as excerpt
    let excerpt = attributes.description || attributes.excerpt || '';
    
    // If no frontmatter description, extract first paragraph as fallback
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
    
    return {
      title: title.trim(),
      excerpt: excerpt.trim(),
      tags: attributes.tags || attributes.categories || [],
      featured: attributes.featured || false,
      date: attributes.date || new Date().toISOString().split('T')[0],
      read_time: `${readTime} min read`,
      status: attributes.status || 'published'
    };
  }

  async processAssets(content, blogFolderPath, blogFolder) {
    // Don't process image paths here - keep them as-is (.gitbook/assets/... or ./...)
    // The backend will convert them to proper GitHub raw URLs when serving
    // This keeps the database clean and allows for flexible URL generation
    
    console.log(`� Keeping asset paths as-is for backend processing`);
    return content;
  }

  async isLargeFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size > 5 * 1024 * 1024; // 5MB threshold
    } catch {
      return false;
    }
  }

  async upsertBlog(metadata, content, slug) {
    try {
      // Check if blog already exists
      const { data: existing } = await supabase
        .from('blogs')
        .select('id')
        .eq('slug', slug)
        .single();

      const blogData = {
        title: metadata.title,
        excerpt: metadata.excerpt,
        content: content,
        date: metadata.date,
        read_time: metadata.read_time,
        tags: JSON.stringify(metadata.tags),
        featured: metadata.featured,
        slug: slug,
        status: metadata.status,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        // Update existing blog
        const { error } = await supabase
          .from('blogs')
          .update(blogData)
          .eq('id', existing.id);
        
        if (error) throw error;
        console.log(`✅ Updated blog: ${metadata.title}`);
      } else {
        // Create new blog
        const { error } = await supabase
          .from('blogs')
          .insert([blogData]);
        
        if (error) throw error;
        console.log(`🆕 Created new blog: ${metadata.title}`);
      }
    } catch (error) {
      throw new Error(`Failed to upsert blog ${slug}: ${error.message}`);
    }
  }
}

// Run the sync
async function main() {
  const sync = new GitHubBlogSync();
  await sync.syncAllBlogs();
}

main().catch(console.error);
