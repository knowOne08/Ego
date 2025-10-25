import express from 'express';
import supabaseBlogRoutes from './supabase-blogs.js';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
    res.send("Test Successful");
});

// Blog routes using Supabase
router.use('/', supabaseBlogRoutes);

export default router;