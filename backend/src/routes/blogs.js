import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import database from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
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

// Get all blogs
router.get('/', (req, res) => {
    database.getAllBlogs((err, blogs) => {
        if (err) {
            console.error('Error fetching blogs:', err);
            return res.status(500).json({ error: 'Failed to fetch blogs' });
        }

        // Parse tags for each blog
        const blogsWithParsedTags = blogs.map(blog => ({
            ...blog,
            tags: JSON.parse(blog.tags || '[]'),
            featured: blog.featured === 1
        }));

        res.json(blogsWithParsedTags);
    });
});

// Get blog by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    database.getBlogById(id, (err, blog) => {
        if (err) {
            console.error('Error fetching blog:', err);
            return res.status(500).json({ error: 'Failed to fetch blog' });
        }

        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Parse tags
        blog.tags = JSON.parse(blog.tags || '[]');
        blog.featured = blog.featured === 1;

        res.json(blog);
    });
});

// Create new blog
router.post('/', (req, res) => {
    const { title, excerpt, content, tags, featured, image } = req.body;

    if (!title || !excerpt || !content) {
        return res.status(400).json({ error: 'Title, excerpt, and content are required' });
    }

    const blogData = {
        title,
        excerpt,
        content,
        date: new Date().toISOString().split('T')[0],
        readTime: estimateReadingTime(content),
        tags: tags || [],
        featured: featured || false,
        image: image || null,
        slug: generateSlug(title)
    };

    database.createBlog(blogData, function(err) {
        if (err) {
            console.error('Error creating blog:', err);
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'A blog with this title already exists' });
            }
            return res.status(500).json({ error: 'Failed to create blog' });
        }

        res.status(201).json({ 
            message: 'Blog created successfully', 
            id: this.lastID,
            slug: blogData.slug
        });
    });
});

// Update blog
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, excerpt, content, readTime, tags, featured, image } = req.body;

    if (!title || !excerpt || !content) {
        return res.status(400).json({ error: 'Title, excerpt, and content are required' });
    }

    const blogData = {
        title,
        excerpt,
        content,
        readTime: readTime || estimateReadingTime(content),
        tags: tags || [],
        featured: featured || false,
        image: image || null,
        slug: generateSlug(title)
    };

    database.updateBlog(id, blogData, function(err) {
        if (err) {
            console.error('Error updating blog:', err);
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'A blog with this title already exists' });
            }
            return res.status(500).json({ error: 'Failed to update blog' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        res.json({ message: 'Blog updated successfully' });
    });
});

// Delete blog
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    database.deleteBlog(id, function(err) {
        if (err) {
            console.error('Error deleting blog:', err);
            return res.status(500).json({ error: 'Failed to delete blog' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        res.json({ message: 'Blog deleted successfully' });
    });
});

// Upload image
router.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }

    const imageData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        size: req.file.size,
        mimetype: req.file.mimetype
    };

    database.saveImage(imageData, function(err) {
        if (err) {
            console.error('Error saving image:', err);
            return res.status(500).json({ error: 'Failed to save image' });
        }

        res.json({
            message: 'Image uploaded successfully',
            image: {
                id: this.lastID,
                filename: imageData.filename,
                path: imageData.path,
                originalName: imageData.originalName
            }
        });
    });
});

// Get all images
router.get('/images/all', (req, res) => {
    database.getAllImages((err, images) => {
        if (err) {
            console.error('Error fetching images:', err);
            return res.status(500).json({ error: 'Failed to fetch images' });
        }

        res.json(images);
    });
});

export default router;
