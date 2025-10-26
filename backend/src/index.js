// index.js
import dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import router from './routes/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;
const apiKey = process.env.API_KEY || 'your-secret-api-key';

// Security middleware
app.use(helmet());

// CORS configuration for production and development
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:3001',
  'https://yashbuilds.com',
  'https://www.yashbuilds.com',
  'https://ego-zeta.vercel.app',
  'https://ego-qocqpothv-knowone08s-projects.vercel.app',
  // Add any other Vercel preview domains as needed
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    console.log('CORS check for origin:', origin);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const validateApiKey = (req, res, next) => {
    const providedApiKey = req.header('X-API-Key');
  
    if (!providedApiKey || providedApiKey !== apiKey) {
      return res.status(401).json({ error: 'Unauthorized. Invalid API key.' });
    }
  
    // API key is valid, continue with the next middleware or route handler
    next();
  };

app.get('/', (req, res) => {
  res.send('Hello, Backend running !!');
});

// Public routes (no API key required)
app.use('/api/blogs', router);

// Protected routes (API key required)
app.use('/api/admin', validateApiKey);
app.use('/api/admin', router);

app.listen(port, '0.0.0.0' , () => {
  console.log(`Server is running on port ${port}`);
});
