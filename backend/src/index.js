// index.js
import express from 'express';
import dotenv from "dotenv"
import router from './routes/routes';
dotenv.config()
const app = express();
const port = process.env.PORT || 4000;
const apiKey = process.env.API_KEY;

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
app.use('/api', validateApiKey);
app.use('/api', router);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
