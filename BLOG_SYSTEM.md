# Blog Admin System

This project now includes a complete blog management system with both a public blog interface and a private admin dashboard for managing blog posts.

## Features

### Public Blog Interface
- **Blog listing page**: `/blog` - Shows all published blogs with filtering by tags
- **Individual blog posts**: `/blog/:id` - Full blog post view with markdown rendering
- **Responsive design**: Works on desktop and mobile
- **Tag filtering**: Filter blogs by categories
- **Featured posts**: Highlighted important posts

### Admin Dashboard
- **Dashboard**: `/admin` - Overview of all blogs with management options
- **Create new blog**: `/admin/new` - Rich editor for writing new blog posts
- **Edit existing blog**: `/admin/edit/:id` - Modify published posts
- **Image uploads**: Support for featured images
- **Markdown support**: Write in markdown for rich formatting
- **Tag management**: Organize posts with tags
- **Status control**: Published/Draft/Archived states

## Getting Started

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:3003` and automatically create:
- SQLite database with sample data
- API endpoints for blog management
- Image upload handling

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## Usage

### Adding New Blog Posts

1. Visit `http://localhost:3000/admin` to access the admin dashboard
2. Click "Create New Blog" 
3. Fill in the blog details:
   - **Title**: The blog post title
   - **Excerpt**: Brief description (optional, auto-generated if empty)
   - **Content**: Full blog content in Markdown format
   - **Tags**: Categories for the blog post
   - **Featured Image**: Upload an image for the blog post
   - **Status**: Published/Draft/Archived
   - **Featured**: Mark as featured post

4. Click "Create Blog" to publish

### Editing Existing Posts

1. Go to the admin dashboard (`/admin`)
2. Click "Edit" next to any blog post
3. Make your changes
4. Click "Update Blog" to save

### Managing Images

- Images are automatically uploaded to the `backend/uploads` directory
- Supported formats: JPEG, PNG, GIF, WebP
- Maximum file size: 10MB
- Images are automatically served at `/uploads/filename`

## API Endpoints

### Public Endpoints (No authentication required)
- `GET /api/blogs` - Get all published blogs
- `GET /api/blogs/:id` - Get specific blog by ID

### Admin Endpoints (Requires API key)
- `POST /api/admin` - Create new blog
- `PUT /api/admin/:id` - Update existing blog
- `DELETE /api/admin/:id` - Delete blog
- `POST /api/admin/upload` - Upload image

## Database Schema

### Blogs Table
- `id` - Auto-increment primary key
- `title` - Blog post title
- `excerpt` - Brief description
- `content` - Full blog content (Markdown)
- `date` - Publication date
- `readTime` - Estimated reading time
- `tags` - JSON array of tags
- `featured` - Boolean for featured status
- `image` - Featured image path
- `slug` - URL-friendly identifier
- `status` - published/draft/archived
- `createdAt` - Creation timestamp
- `updatedAt` - Last modified timestamp

## Configuration

### Environment Variables (.env)
```
PORT=3003
API_KEY=hello123
```

### API Key
The current API key is `hello123` (stored in backend/.env). Change this for production use.

## Development Notes

- The system uses SQLite for development (file: `backend/blog.db`)
- Sample blog data is automatically seeded on first run
- Frontend fetches data from the backend API
- CORS is configured to allow requests from localhost:3000
- Image uploads are stored locally in `backend/uploads/`

## Production Deployment

For production deployment:

1. Change the API key in `.env`
2. Update API URLs in frontend components to point to your production backend
3. Consider using a more robust database (PostgreSQL, MySQL)
4. Set up proper authentication for admin access
5. Configure proper image storage (AWS S3, Cloudinary, etc.)
6. Set up SSL certificates
7. Configure environment-specific CORS settings

## Troubleshooting

### Backend Issues
- Make sure port 3003 is not in use by another application
- Check that all dependencies are installed: `npm install`
- Verify the `.env` file exists with correct API key

### Frontend Issues
- Ensure backend is running before starting frontend
- Check browser console for API errors
- Verify API URLs and API key match between frontend and backend

### Database Issues
- Database is created automatically on first run
- To reset database, delete `backend/blog.db` and restart backend
- Sample data will be re-seeded automatically

## Next Steps

Future enhancements could include:
- User authentication for admin access
- Rich text editor (WYSIWYG)
- Comment system
- Search functionality
- SEO optimization
- Social media sharing
- Blog analytics
- Email notifications
- Multi-author support
