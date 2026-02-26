import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import dataSourceRoutes from './routes/dataSourceRoutes.js';
import resolverRoutes from '../src/routes/resolverRoutes.js';

/**
 * createApp - Factory that returns a configured Express app.
 * Use this when embedding the package into another project.
 */
export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check route
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
  });

  // Routes
  app.use('/auth', authRoutes);
//   app.use('/api', dataSourceRoutes);
  app.use('/api', resolverRoutes)

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}

export default createApp;
