import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file ABSOLUTELY FIRST
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Redis connection early (before app starts)
import { initializeRedis } from './src/services/cacheService.js';
await initializeRedis();

// Use dynamic import to load app AFTER dotenv and Redis are configured
// This ensures all environment variables are available when app.js is imported
import { createApp } from './src/app.js';

const app = createApp();
const PORT = process.env.PORT || 3000;

// Start server for traditional Node.js deployment
app.listen(PORT, () => {
  console.log(`BFF Server running on ports ${PORT}`);
});

