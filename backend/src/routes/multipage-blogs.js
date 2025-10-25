import express from 'express';
import { SupabaseDB } from '../supabase.js';

const router = express.Router();

// Helper function to process GitBook image URLs
const processGitBookImages = (content, githubRepo, githubFolderName) => {
    if (!content || !githubRepo || !githubFolderName) return content;
    
    let processedContent = content;
    const encodedFolderName = encodeURIComponent(githubFolderName);
    
    // Process different image path formats
    processedContent = processedContent.replace(
        /!\[([^\]]*)\]\(\.gitbook\/assets\/([^)]+)\)/g,
        (match, alt, filename) => {
            const encodedFilename = encodeURIComponent(filename.trim());
            return `![${alt}](https://raw.githubusercontent.com/${githubRepo}/main/${encodedFolderName}/.gitbook/assets/${encodedFilename})`;
        }
    );
    
    processedContent = processedContent.replace(
        /(<img[^>]*src=["'])\.gitbook\/assets\/([^"']+)(["'][^>]*>)/g,
        (match, prefix, filename, suffix) => {
            const encodedFilename = encodeURIComponent(filename.trim());
            return `${prefix}https://raw.githubusercontent.com/${githubRepo}/main/${encodedFolderName}/.gitbook/assets/${encodedFilename}${suffix}`;
        }
    );
    
    processedContent = processedContent.replace(
        /!\[([^\]]*)\]\(\.\/([^)]+)\)/g,
        (match, alt, filename) => {
            const encodedFilename = encodeURIComponent(filename.trim());
            return `![${alt}](https://raw.githubusercontent.com/${githubRepo}/main/${encodedFolderName}/${encodedFilename})`;
        }
    );
    
    return processedContent;
};

const getGithubRepoForBlog = () => {
    return process.env.GITBOOK_GITHUB_REPO || 'knowOne08/blogs';
};

// ============================================
// BLOG LISTING ENDPOINTS
// ============================================

// Get all blogs (for listing page)
router.get('/blogs', async (req, res) => {
    try {
        const { data, error } = await SupabaseDB
            .from('blogs')
            .select('*')
            .eq('status', 'published')
            .order('date', { ascending: false });

        if (error) throw error;

        // Parse tags from JSON
        const blogs = data.map(blog => ({
            ...blog,
            tags: typeof blog.tags === 'string' ? JSON.parse(blog.tags) : blog.tags
        }));

        res.json(blogs);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ error: 'Failed to fetch blogs' });
    }
});

// Get single blog metadata (without pages)
router.get('/blogs/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const { data, error } = await SupabaseDB
            .from('blogs')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Parse tags
        const blog = {
            ...data,
            tags: typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags
        };

        res.json(blog);
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).json({ error: 'Failed to fetch blog' });
    }
});

// ============================================
// MULTI-PAGE BLOG ENDPOINTS
// ============================================

// Get blog with all its pages (table of contents)
router.get('/blogs/:slug/pages', async (req, res) => {
    try {
        const { slug } = req.params;

        // Get blog metadata
        const { data: blog, error: blogError } = await SupabaseDB
            .from('blogs')
            .select('*')
            .eq('slug', slug)
            .single();

        if (blogError) throw blogError;
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Get all pages for this blog
        const { data: pages, error: pagesError } = await SupabaseDB
            .from('blog_pages')
            .select('id, title, slug, page_order')
            .eq('blog_id', blog.id)
            .order('page_order', { ascending: true });

        if (pagesError) throw pagesError;

        res.json({
            ...blog,
            tags: typeof blog.tags === 'string' ? JSON.parse(blog.tags) : blog.tags,
            pages: pages || []
        });
    } catch (error) {
        console.error('Error fetching blog pages:', error);
        res.status(500).json({ error: 'Failed to fetch blog pages' });
    }
});

// Get specific page within a blog
router.get('/blogs/:blogSlug/page/:pageSlug', async (req, res) => {
    try {
        const { blogSlug, pageSlug } = req.params;

        // Get blog metadata
        const { data: blog, error: blogError } = await SupabaseDB
            .from('blogs')
            .select('*')
            .eq('slug', blogSlug)
            .single();

        if (blogError) throw blogError;
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Get the specific page
        const { data: page, error: pageError } = await SupabaseDB
            .from('blog_pages')
            .select('*')
            .eq('blog_id', blog.id)
            .eq('slug', pageSlug)
            .single();

        if (pageError) throw pageError;
        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        // Process images in content
        const githubRepo = getGithubRepoForBlog();
        const processedContent = processGitBookImages(page.content, githubRepo, blogSlug);

        // Get navigation (previous/next pages within this blog)
        const { data: prevPage } = await SupabaseDB
            .from('blog_pages')
            .select('id, title, slug, page_order')
            .eq('blog_id', blog.id)
            .lt('page_order', page.page_order)
            .order('page_order', { ascending: false })
            .limit(1)
            .single();

        const { data: nextPage } = await SupabaseDB
            .from('blog_pages')
            .select('id, title, slug, page_order')
            .eq('blog_id', blog.id)
            .gt('page_order', page.page_order)
            .order('page_order', { ascending: true })
            .limit(1)
            .single();

        res.json({
            blog: {
                ...blog,
                tags: typeof blog.tags === 'string' ? JSON.parse(blog.tags) : blog.tags
            },
            page: {
                ...page,
                content: processedContent
            },
            navigation: {
                previous: prevPage || null,
                next: nextPage || null
            }
        });
    } catch (error) {
        console.error('Error fetching blog page:', error);
        res.status(500).json({ error: 'Failed to fetch blog page' });
    }
});

// Get main page of a blog (page_order = 0)
router.get('/blogs/:slug/content', async (req, res) => {
    try {
        const { slug } = req.params;

        // Get blog metadata
        const { data: blog, error: blogError } = await SupabaseDB
            .from('blogs')
            .select('*')
            .eq('slug', slug)
            .single();

        if (blogError) throw blogError;
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Get main page (page_order = 0)
        const { data: mainPage, error: pageError } = await SupabaseDB
            .from('blog_pages')
            .select('*')
            .eq('blog_id', blog.id)
            .eq('page_order', 0)
            .single();

        if (pageError) throw pageError;
        if (!mainPage) {
            return res.status(404).json({ error: 'Main page not found' });
        }

        // Process images
        const githubRepo = getGithubRepoForBlog();
        const processedContent = processGitBookImages(mainPage.content, githubRepo, slug);

        // If multipage, get all pages for TOC
        let pages = [];
        if (blog.is_multipage) {
            const { data: allPages } = await SupabaseDB
                .from('blog_pages')
                .select('id, title, slug, page_order')
                .eq('blog_id', blog.id)
                .order('page_order', { ascending: true });
            pages = allPages || [];
        }

        // Get next page (if multipage)
        let nextPage = null;
        if (blog.is_multipage) {
            const { data: next } = await SupabaseDB
                .from('blog_pages')
                .select('id, title, slug, page_order')
                .eq('blog_id', blog.id)
                .gt('page_order', 0)
                .order('page_order', { ascending: true })
                .limit(1)
                .single();
            nextPage = next;
        }

        res.json({
            ...blog,
            tags: typeof blog.tags === 'string' ? JSON.parse(blog.tags) : blog.tags,
            content: processedContent,
            pages: pages,
            navigation: {
                previous: null,
                next: nextPage
            }
        });
    } catch (error) {
        console.error('Error fetching blog content:', error);
        res.status(500).json({ error: 'Failed to fetch blog content' });
    }
});

// ============================================
// BLOG NAVIGATION ENDPOINTS
// ============================================

// Get previous/next blog posts (by date)
router.get('/blogs/:slug/navigation', async (req, res) => {
    try {
        const { slug } = req.params;

        // Get current blog
        const { data: currentBlog, error: currentError } = await SupabaseDB
            .from('blogs')
            .select('date')
            .eq('slug', slug)
            .single();

        if (currentError) throw currentError;
        if (!currentBlog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Get previous blog (older)
        const { data: previousBlog } = await SupabaseDB
            .from('blogs')
            .select('id, title, slug, date')
            .eq('status', 'published')
            .lt('date', currentBlog.date)
            .order('date', { ascending: false })
            .limit(1)
            .single();

        // Get next blog (newer)
        const { data: nextBlog } = await SupabaseDB
            .from('blogs')
            .select('id, title, slug, date')
            .eq('status', 'published')
            .gt('date', currentBlog.date)
            .order('date', { ascending: true })
            .limit(1)
            .single();

        res.json({
            previous: previousBlog || null,
            next: nextBlog || null
        });
    } catch (error) {
        console.error('Error fetching blog navigation:', error);
        res.status(500).json({ error: 'Failed to fetch navigation' });
    }
});

export default router;
