import jwt from 'jsonwebtoken';

// Dummy users database (in production, this would be a real database)
let dummyUsers = [
  {
    id: 1,
    username: 'admin',
    password: 'password123',
    email: 'admin@example.com',
    name: 'Administrator'
  },
  {
    id: 2,
    username: 'user',
    password: 'userpass456',
    email: 'user@example.com',
    name: 'Regular User'
  },
  {
    id: 3,
    username: 'test',
    password: 'testpass789',
    email: 'test@example.com',
    name: 'Test User'
  }
];

// Token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-super-secret-refresh-key-change-in-production';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

// Auth Service - Contains business logic for authentication
export const authService = {
  login: async (username, password) => {
    try {
      // 1. Query dummy user database for user
      const user = dummyUsers.find(u => u.username === username);

      if (!user) {
        throw new Error('User not found');
      }

      // 2. Validate password (in production, compare with hashed password)
      if (user.password !== password) {
        throw new Error('Invalid password');
      }

      // 3. Generate JWT tokens with production quality
      const accessToken = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      const refreshToken = jwt.sign(
        {
          id: user.id,
          username: user.username
        },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      );

      // 4. Return user data and tokens in response
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        },
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresIn: JWT_EXPIRY,
        message: 'Login successful'
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  },

  register: async (username, password, email, name) => {
    try {
      // 1. Check if user already exists
      const existingUser = dummyUsers.find(u => u.username === username || u.email === email);

      if (existingUser) {
        throw new Error('User already exists');
      }

      // 2. Create new user (in production, hash password and save to database)
      const newUser = {
        id: dummyUsers.length + 1,
        username: username,
        password: password, // In production, hash this!
        email: email,
        name: name
      };

      // 3. Add user to dummy database
      dummyUsers.push(newUser);

      // 4. Return success response
      return {
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name
        },
        message: 'Registration successful'
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  },

  logout: async (token) => {
    try {
      // 1. Verify token is valid
      const decoded = jwt.verify(token, JWT_SECRET);

      // 2. Add token to blacklist (in production, store in Redis with TTL)
      tokenBlacklist.add(token);

      // 3. Return success response
      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  },

  refreshToken: async (refreshToken) => {
    try {
      // 1. Check if token is blacklisted (revoked)
      if (tokenBlacklist.has(refreshToken)) {
        throw new Error('Token has been revoked');
      }

      // 2. Verify refresh token
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

      // 3. Generate new access token
      const newAccessToken = jwt.sign(
        {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      // 4. Return new access token
      return {
        success: true,
        accessToken: newAccessToken,
        expiresIn: JWT_EXPIRY,
        message: 'Token refreshed successfully'
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }
};
