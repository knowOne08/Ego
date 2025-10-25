import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseDB } from '../supabase.js';

const router = express.Router();

// Configure multer for memory storage (since we're uploading to Supabase)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for HD images
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images are allowed.'));
        }
    }
});

// Helper function to process GitBook image URLs in content
const processGitBookImages = (content, githubRepo, githubFolderName) => {
    if (!content || !githubRepo || !githubFolderName) return content;
    
    let processedContent = content;
    
    // Encode the GitHub folder name properly (with spaces, capitals, etc.)
    const encodedFolderName = encodeURIComponent(githubFolderName);
    
    // Handle different .gitbook/assets/ path formats
    // 1. In markdown image syntax: ![alt](.gitbook/assets/file.ext)
    processedContent = processedContent.replace(
        /!\[([^\]]*)\]\(\.gitbook\/assets\/([^)]+)\)/g,
        (match, alt, filename) => {
            const cleanFilename = filename.trim();
            const encodedFilename = encodeURIComponent(cleanFilename);
            return `![${alt}](https://raw.githubusercontent.com/${githubRepo}/main/${encodedFolderName}/.gitbook/assets/${encodedFilename})`;
        }
    );
    
    // 2. In HTML img tags: <img src=".gitbook/assets/file.ext"
    processedContent = processedContent.replace(
        /(<img[^>]*src=["'])\.gitbook\/assets\/([^"']+)(["'][^>]*>)/g,
        (match, prefix, filename, suffix) => {
            const cleanFilename = filename.trim();
            const encodedFilename = encodeURIComponent(cleanFilename);
            return `${prefix}https://raw.githubusercontent.com/${githubRepo}/main/${encodedFolderName}/.gitbook/assets/${encodedFilename}${suffix}`;
        }
    );
    
    // 3. In markdown links: [text](.gitbook/assets/file.ext)
    processedContent = processedContent.replace(
        /\[([^\]]*)\]\(\.gitbook\/assets\/([^)]+)\)/g,
        (match, text, filename) => {
            const cleanFilename = filename.trim();
            const encodedFilename = encodeURIComponent(cleanFilename);
            return `[${text}](https://raw.githubusercontent.com/${githubRepo}/main/${encodedFolderName}/.gitbook/assets/${encodedFilename})`;
        }
    );
    
    // Also handle relative image paths like ./image.jpg
    processedContent = processedContent.replace(
        /!\[([^\]]*)\]\(\.\/([^)]+)\)/g,
        (match, alt, filename) => {
            const cleanFilename = filename.trim();
            const encodedFilename = encodeURIComponent(cleanFilename);
            return `![${alt}](https://raw.githubusercontent.com/${githubRepo}/main/${encodedFolderName}/${encodedFilename})`;
        }
    );
    
    return processedContent;
};

// Helper function to process cover image URLs from GitBook
const processCoverUrl = (coverUrl, githubRepo, githubFolderName) => {
    if (!coverUrl) return null;
    
    // Already a full URL
    if (coverUrl.startsWith('http://') || coverUrl.startsWith('https://')) {
        return coverUrl;
    }
    
    if (!githubRepo || !githubFolderName) return coverUrl;
    
    // Encode the GitHub folder name properly
    const encodedFolderName = encodeURIComponent(githubFolderName);
    
    // Handle .gitbook/assets/ paths
    if (coverUrl.startsWith('.gitbook/')) {
        const pathParts = coverUrl.split('/');
        const encodedParts = pathParts.map(part => encodeURIComponent(part));
        return `https://raw.githubusercontent.com/${githubRepo}/main/${encodedFolderName}/${encodedParts.join('/')}`;
    }
    
    // Handle ./ relative paths
    if (coverUrl.startsWith('./')) {
        const cleanPath = coverUrl.substring(2);
        const pathParts = cleanPath.split('/');
        const encodedParts = pathParts.map(part => encodeURIComponent(part));
        return `https://raw.githubusercontent.com/${githubRepo}/main/${encodedFolderName}/${encodedParts.join('/')}`;
    }
    
    // Handle other relative paths
    const pathParts = coverUrl.split('/');
    const encodedParts = pathParts.map(part => encodeURIComponent(part));
    return `https://raw.githubusercontent.com/${githubRepo}/main/${encodedFolderName}/${encodedParts.join('/')}`;
};

// Helper function to extract GitHub repo from blog metadata or config
const getGithubRepoForBlog = (blog) => {
    // You can store this in environment variable or in the blog metadata
    // For now, using a default - UPDATE THIS to match your actual GitBook repo
    return process.env.GITBOOK_GITHUB_REPO || 'knowOne08/blogs';
};

// Helper function to generate slug from title
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
};

// Helper function to estimate reading time
const estimateReadingTime = (content) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
};

// Get all blogs (public endpoint)
router.get('/', async (req, res) => {
    try {
        const blogs = await SupabaseDB.getAllBlogs();
        
        // Get GitHub repo from environment
        const githubRepo = getGithubRepoForBlog();
        
        // Optimize images and process cover URLs for listing view
        const blogsWithOptimizedImages = blogs.map(blog => {
            // Use github_folder_name if available (original folder name from GitBook),
            // otherwise fall back to slug or generated slug
            const githubFolderName = blog.github_folder_name || blog.slug || generateSlug(blog.title);
            
            return {
                ...blog,
                image: blog.image ? SupabaseDB.getOptimizedImageUrl(blog.image, {
                    width: 600,
                    height: 400,
                    quality: 75
                }) : null,
                // Process cover URLs (from GitBook paths to GitHub raw URLs)
                cover_light: processCoverUrl(blog.cover_light, githubRepo, githubFolderName),
                cover_dark: processCoverUrl(blog.cover_dark, githubRepo, githubFolderName),
                tags: typeof blog.tags === 'string' ? JSON.parse(blog.tags) : blog.tags || []
            };
        });

        res.json(blogsWithOptimizedImages);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ error: 'Failed to fetch blogs' });
    }
});

// IMPORTANT: More specific routes must come BEFORE general /:id route
// to prevent /:id from catching all requests

// Get navigation blogs (previous/next) for a specific blog
router.get('/navigation/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const currentBlog = await SupabaseDB.getBlogById(id);
        
        if (!currentBlog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Get all published blogs ordered by date
        const allBlogs = await SupabaseDB.getAllBlogs();
        const publishedBlogs = allBlogs
            .filter(b => b.status === 'published')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Find current blog index
        const currentIndex = publishedBlogs.findIndex(b => b.id === parseInt(id));
        
        // Get previous (older) and next (newer) blogs
        const previous = currentIndex < publishedBlogs.length - 1 
            ? { id: publishedBlogs[currentIndex + 1].id, title: publishedBlogs[currentIndex + 1].title }
            : null;
        const next = currentIndex > 0 
            ? { id: publishedBlogs[currentIndex - 1].id, title: publishedBlogs[currentIndex - 1].title }
            : null;

        res.json({ previous, next });
    } catch (error) {
        console.error('Error fetching navigation blogs:', error);
        res.status(500).json({ error: 'Failed to fetch navigation blogs' });
    }
});

// Get all pages for a specific blog
router.get('/:id/pages', async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await SupabaseDB.getBlogById(id);
        
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        const pages = await SupabaseDB.getBlogPages(id);
        
        res.json({ 
            blog: {
                id: blog.id,
                title: blog.title,
                is_multipage: blog.is_multipage
            },
            pages 
        });
    } catch (error) {
        console.error('Error fetching blog pages:', error);
        res.status(500).json({ error: 'Failed to fetch blog pages' });
    }
});

// Get a specific page within a blog
router.get('/:id/page/:pageSlug', async (req, res) => {
    try {
        const { id, pageSlug } = req.params;
        const blog = await SupabaseDB.getBlogById(id);
        
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        const page = await SupabaseDB.getPageBySlug(id, pageSlug);
        
        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        // Get GitHub repo for image processing
        const githubRepo = getGithubRepoForBlog(blog);
        const githubFolderName = blog.github_folder_name || blog.slug;
        
        // Process GitBook image URLs in the page content
        const processedContent = processGitBookImages(page.content, githubRepo, githubFolderName);
        
        // Get navigation for this page
        const navigation = await SupabaseDB.getPageNavigation(id, page.page_order);

        res.json({
            blog: {
                id: blog.id,
                title: blog.title,
                excerpt: blog.excerpt,
                date: blog.date,
                read_time: blog.read_time,
                tags: typeof blog.tags === 'string' ? JSON.parse(blog.tags) : blog.tags || [],
                image: blog.image,
                is_multipage: blog.is_multipage,
                // Process cover URLs (from GitBook paths to GitHub raw URLs)
                cover_light: processCoverUrl(blog.cover_light, githubRepo, githubFolderName),
                cover_dark: processCoverUrl(blog.cover_dark, githubRepo, githubFolderName),
                cover_y: blog.cover_y,
                cover_visible: blog.cover_visible,
                cover_size: blog.cover_size
            },
            page: {
                ...page,
                content: processedContent
            },
            navigation: {
                previous: navigation.previous ? {
                    slug: navigation.previous.slug,
                    title: navigation.previous.title
                } : null,
                next: navigation.next ? {
                    slug: navigation.next.slug,
                    title: navigation.next.title
                } : null
            }
        });
    } catch (error) {
        console.error('Error fetching blog page:', error);
        res.status(500).json({ error: 'Failed to fetch blog page' });
    }
});

// Get blog content (main page or full content for single-page blogs)
router.get('/:id/content', async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await SupabaseDB.getBlogById(id);
        
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        let response = {
            id: blog.id,
            title: blog.title,
            excerpt: blog.excerpt,
            content: blog.content,
            date: blog.date,
            readTime: blog.read_time,
            tags: typeof blog.tags === 'string' ? JSON.parse(blog.tags) : blog.tags || [],
            image: blog.image,
            is_multipage: blog.is_multipage || false
        };

        // Get GitHub repo and folder for processing URLs
        const githubRepo = getGithubRepoForBlog(blog);
        const githubFolderName = blog.github_folder_name || blog.slug;
        
        // Add processed cover URLs
        response.cover_light = processCoverUrl(blog.cover_light, githubRepo, githubFolderName);
        response.cover_dark = processCoverUrl(blog.cover_dark, githubRepo, githubFolderName);
        response.cover_y = blog.cover_y;
        response.cover_visible = blog.cover_visible;
        response.cover_size = blog.cover_size;

        // If multipage, get all pages
        if (blog.is_multipage) {
            const pages = await SupabaseDB.getBlogPages(id);
            response.pages = pages;
            
            // Get navigation for main page (page_order = 0)
            if (pages.length > 0) {
                const mainPage = pages.find(p => p.page_order === 0) || pages[0];
                const navigation = await SupabaseDB.getPageNavigation(id, mainPage.page_order);
                response.navigation = {
                    previous: navigation.previous ? {
                        slug: navigation.previous.slug,
                        title: navigation.previous.title
                    } : null,
                    next: navigation.next ? {
                        slug: navigation.next.slug,
                        title: navigation.next.title
                    } : null
                };
            }
        }

        // Process GitBook images
        response.content = processGitBookImages(response.content, githubRepo, githubFolderName);

        res.json(response);
    } catch (error) {
        console.error('Error fetching blog content:', error);
        res.status(500).json({ error: 'Failed to fetch blog content' });
    }
});

// Get blog by ID (public endpoint)
// IMPORTANT: This general /:id route must come LAST after all specific routes
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await SupabaseDB.getBlogById(id);
        
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Get GitHub repo for this blog
        const githubRepo = getGithubRepoForBlog(blog);
        
        // Use the original GitHub folder name (not slug) for image URLs
        const githubFolderName = blog.github_folder_name || blog.slug;
        
        // Process GitBook image URLs in the content
        const processedContent = processGitBookImages(blog.content, githubRepo, githubFolderName);

        // Get full-size optimized image for blog post
        const blogWithOptimizedImage = {
            ...blog,
            content: processedContent,  // Use processed content with fixed image URLs
            image: blog.image ? SupabaseDB.getOptimizedImageUrl(blog.image, {
                width: 1200,
                height: 800,
                quality: 85
            }) : null,
            // Process cover URLs (from GitBook paths to GitHub raw URLs)
            cover_light: processCoverUrl(blog.cover_light, githubRepo, githubFolderName),
            cover_dark: processCoverUrl(blog.cover_dark, githubRepo, githubFolderName),
            tags: typeof blog.tags === 'string' ? JSON.parse(blog.tags) : blog.tags || []
        };

        res.json(blogWithOptimizedImage);
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).json({ error: 'Failed to fetch blog' });
    }
});

// Create new blog (admin endpoint)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { title, excerpt, content, tags, featured, status } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        let imagePath = null;
        
        // Upload image if provided
        if (req.file) {
            const fileName = `${uuidv4()}-${req.file.originalname}`;
            imagePath = await SupabaseDB.uploadImage(req.file.buffer, fileName);
        }

        const blogData = {
            title,
            excerpt: excerpt || content.substring(0, 200) + '...',
            content,
            date: new Date().toISOString().split('T')[0],
            read_time: estimateReadingTime(content),
            tags: JSON.stringify(tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : []),
            featured: featured === 'true' || featured === true,
            image: imagePath,
            slug: generateSlug(title),
            status: status || 'published'
        };

        const newBlog = await SupabaseDB.createBlog(blogData);
        res.status(201).json(newBlog);
    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({ error: 'Failed to create blog' });
    }
});

// Update blog (admin endpoint)
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, excerpt, content, tags, featured, status } = req.body;
        
        const existingBlog = await SupabaseDB.getBlogById(id);
        if (!existingBlog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        let imagePath = existingBlog.image;
        
        // Upload new image if provided
        if (req.file) {
            const fileName = `${uuidv4()}-${req.file.originalname}`;
            imagePath = await SupabaseDB.uploadImage(req.file.buffer, fileName);
            
            // Delete old image if it exists
            if (existingBlog.image) {
                try {
                    await SupabaseDB.deleteImage(existingBlog.image);
                } catch (deleteError) {
                    console.warn('Failed to delete old image:', deleteError);
                }
            }
        }

        const updates = {
            title: title || existingBlog.title,
            excerpt: excerpt || existingBlog.excerpt,
            content: content || existingBlog.content,
            read_time: content ? estimateReadingTime(content) : existingBlog.read_time,
            tags: tags ? JSON.stringify(Array.isArray(tags) ? tags : JSON.parse(tags)) : existingBlog.tags,
            featured: featured !== undefined ? (featured === 'true' || featured === true) : existingBlog.featured,
            image: imagePath,
            slug: title ? generateSlug(title) : existingBlog.slug,
            status: status || existingBlog.status
        };

        const updatedBlog = await SupabaseDB.updateBlog(id, updates);
        res.json(updatedBlog);
    } catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).json({ error: 'Failed to update blog' });
    }
});

// Delete blog (admin endpoint)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const existingBlog = await SupabaseDB.getBlogById(id);
        if (!existingBlog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Delete associated image if it exists
        if (existingBlog.image) {
            try {
                await SupabaseDB.deleteImage(existingBlog.image);
            } catch (deleteError) {
                console.warn('Failed to delete image:', deleteError);
            }
        }

        await SupabaseDB.deleteBlog(id);
        res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ error: 'Failed to delete blog' });
    }
});

// Upload image endpoint (for rich text editor)
router.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const fileName = `${uuidv4()}-${req.file.originalname}`;
        const imagePath = await SupabaseDB.uploadImage(req.file.buffer, fileName);
        
        // Return different sizes for different use cases
        const urls = {
            original: imagePath,
            large: SupabaseDB.getOptimizedImageUrl(fileName, { width: 1200, quality: 85 }),
            medium: SupabaseDB.getOptimizedImageUrl(fileName, { width: 800, quality: 80 }),
            small: SupabaseDB.getOptimizedImageUrl(fileName, { width: 400, quality: 75 }),
            thumbnail: SupabaseDB.getOptimizedImageUrl(fileName, { width: 200, quality: 70 })
        };

        res.json({
            message: 'Image uploaded successfully',
            urls,
            fileName
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

export default router;
