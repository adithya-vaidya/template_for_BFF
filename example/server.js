import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env for the example server
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { createApp } from '../src/app.js';

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Example server running on port ${PORT}`);
});
