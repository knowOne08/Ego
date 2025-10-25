import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database helper functions
export class SupabaseDB {
    // Get all published blogs
    static async getAllBlogs() {
        const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('status', 'published')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }

    // Get blog by ID
    static async getBlogById(id) {
        const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    }

    // Create new blog
    static async createBlog(blogData) {
        const { data, error } = await supabase
            .from('blogs')
            .insert([blogData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // Update blog
    static async updateBlog(id, updates) {
        const { data, error } = await supabase
            .from('blogs')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // Delete blog
    static async deleteBlog(id) {
        const { error } = await supabase
            .from('blogs')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }

    // Upload image to Supabase Storage
    static async uploadImage(file, fileName) {
        const { data, error } = await supabase.storage
            .from('blog-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('blog-images')
            .getPublicUrl(fileName);
        
        return publicUrl;
    }

    // Get optimized image URL
    static getOptimizedImageUrl(imagePath, options = {}) {
        const { width = 800, height = 600, quality = 80, format = 'webp' } = options;
        
        if (!imagePath) return null;
        
        // Supabase image transformations
        const { data: { publicUrl } } = supabase.storage
            .from('blog-images')
            .getPublicUrl(imagePath, {
                transform: {
                    width,
                    height,
                    resize: 'cover',
                    format,
                    quality
                }
            });
        
        return publicUrl;
    }

    // Delete image from storage
    static async deleteImage(imagePath) {
        const { error } = await supabase.storage
            .from('blog-images')
            .remove([imagePath]);
        
        if (error) throw error;
        return true;
    }

    // Get all pages for a blog
    static async getBlogPages(blogId) {
        const { data, error } = await supabase
            .from('blog_pages')
            .select('*')
            .eq('blog_id', blogId)
            .order('page_order', { ascending: true });
        
        if (error) throw error;
        return data;
    }

    // Get a specific page by slug
    static async getPageBySlug(blogId, pageSlug) {
        const { data, error } = await supabase
            .from('blog_pages')
            .select('*')
            .eq('blog_id', blogId)
            .eq('slug', pageSlug)
            .single();
        
        if (error) throw error;
        return data;
    }

    // Get page navigation (previous/next pages within a blog)
    static async getPageNavigation(blogId, currentPageOrder) {
        const pages = await this.getBlogPages(blogId);
        
        const currentIndex = pages.findIndex(p => p.page_order === currentPageOrder);
        
        return {
            previous: currentIndex > 0 ? pages[currentIndex - 1] : null,
            next: currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null
        };
    }

    // Create or update a blog page
    static async upsertBlogPage(pageData) {
        const { data, error } = await supabase
            .from('blog_pages')
            .upsert([pageData], {
                onConflict: 'blog_id,slug'
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // Delete a blog page
    static async deleteBlogPage(blogId, slug) {
        const { error } = await supabase
            .from('blog_pages')
            .delete()
            .eq('blog_id', blogId)
            .eq('slug', slug);
        
        if (error) throw error;
        return true;
    }
}
