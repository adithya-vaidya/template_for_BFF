import { authService } from '../services/authService.js';

export const authController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const result = await authService.login(username, password);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      res.status(401).json({
        status: 'error',
        message: error.message
      });
    }
  },

  register: async (req, res) => {
    try {
      const { username, password, email, name } = req.body;
      
      const result = await authService.register(username, password, email, name);
      
      res.status(201).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  },

  logout: async (req, res) => {
    try {
      // Get token from Authorization header or body
      const token = req.headers.authorization?.split(' ')[1] || req.body.token;
      
      if (!token) {
        return res.status(400).json({
          status: 'error',
          message: 'Token is required'
        });
      }
      
      const result = await authService.logout(token);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      res.status(401).json({
        status: 'error',
        message: error.message
      });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          status: 'error',
          message: 'Refresh token is required'
        });
      }
      
      const result = await authService.refreshToken(token);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      res.status(401).json({
        status: 'error',
        message: error.message
      });
    }
  }
};
