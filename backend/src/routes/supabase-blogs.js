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
        
        // Optimize images for listing view
        const blogsWithOptimizedImages = blogs.map(blog => ({
            ...blog,
            image: blog.image ? SupabaseDB.getOptimizedImageUrl(blog.image, {
                width: 600,
                height: 400,
                quality: 75
            }) : null,
            tags: typeof blog.tags === 'string' ? JSON.parse(blog.tags) : blog.tags || []
        }));

        res.json(blogsWithOptimizedImages);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ error: 'Failed to fetch blogs' });
    }
});

// Get blog by ID (public endpoint)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await SupabaseDB.getBlogById(id);
        
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Get full-size optimized image for blog post
        const blogWithOptimizedImage = {
            ...blog,
            image: blog.image ? SupabaseDB.getOptimizedImageUrl(blog.image, {
                width: 1200,
                height: 800,
                quality: 85
            }) : null,
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
