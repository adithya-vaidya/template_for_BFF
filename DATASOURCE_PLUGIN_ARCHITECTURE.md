# DataSource Plugin Architecture - Documentation

## Overview

This BFF (Backend for Frontend) project implements an **AppSync-like plugin architecture** for Node.js. It allows you to:

- Configure multiple datasources (APIs, databases, microservices)
- Dynamically route requests to different backends
- Manage datasources at runtime
- Implement retry logic and error handling
- Create a flexible, extensible middleware layer

## Configuration

### 1. Environment Variables (.env)

Define datasources in your `.env` file using the format:
```
DATASOURCE_<NAME>=<TYPE>|<BASE_URL>|<TIMEOUT>|<RETRY_COUNT>
```

**Example:**
```env
# User Microservice
DATASOURCE_USER_SERVICE=http|http://localhost:4000|5000|3

# Product API
DATASOURCE_PRODUCT_SERVICE=http|http://localhost:4001|5000|3

# Payment Service
DATASOURCE_PAYMENT_SERVICE=http|http://localhost:4002|5000|3
```

### Parameters:
- **NAME**: Unique identifier for the datasource (lowercase)
- **TYPE**: Type of datasource (http, rest, graphql, etc.)
- **BASE_URL**: The base URL of the service
- **TIMEOUT**: Request timeout in milliseconds (default: 5000)
- **RETRY_COUNT**: Number of retry attempts on failure (default: 3)

## API Endpoints

### 1. List All Datasources
```
GET /api/datasources
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "total": 3,
    "datasources": [
      {
        "name": "user_service",
        "type": "http",
        "baseUrl": "http://localhost:4000",
        "timeout": 5000,
        "retryCount": 3
      }
    ]
  }
}
```

### 2. Call a Datasource
```
POST /api/datasources/call
```

**Request Body:**
```json
{
  "datasource": "user_service",
  "method": "GET",
  "path": "/api/users/123",
  "headers": {
    "Authorization": "Bearer token"
  },
  "params": {
    "includeDetails": true
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "datasource": "user_service",
  "meta": {
    "statusCode": 200,
    "timestamp": "2026-02-16T12:00:00Z"
  }
}
```

### 3. Register New Datasource (Runtime)
```
POST /api/datasources/register
```

**Request Body:**
```json
{
  "name": "new_service",
  "type": "http",
  "baseUrl": "http://localhost:8080",
  "timeout": 10000,
  "retryCount": 5,
  "headers": {
    "Authorization": "Bearer token"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "DataSource 'new_service' registered successfully",
  "datasource": {
    "name": "new_service",
    "type": "http",
    "baseUrl": "http://localhost:8080",
    "timeout": 10000,
    "retryCount": 5
  }
}
```

### 4. Unregister Datasource
```
POST /api/datasources/unregister
```

**Request Body:**
```json
{
  "name": "old_service"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "DataSource 'old_service' unregistered successfully"
}
```

## Usage Examples

### Example 1: Call User Service

```bash
curl -X POST http://localhost:3000/api/datasources/call \
  -H "Content-Type: application/json" \
  -d '{
    "datasource": "user_service",
    "method": "GET",
    "path": "/api/users/123"
  }'
```

### Example 2: POST Request with Body

```bash
curl -X POST http://localhost:3000/api/datasources/call \
  -H "Content-Type: application/json" \
  -d '{
    "datasource": "user_service",
    "method": "POST",
    "path": "/api/users",
    "body": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }'
```

### Example 3: Register New Service at Runtime

```bash
curl -X POST http://localhost:3000/api/datasources/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "analytics_service",
    "type": "http",
    "baseUrl": "http://analytics.example.com",
    "timeout": 8000,
    "retryCount": 2
  }'
```

## Features

### Automatic Retry Logic
- Exponential backoff: 100ms, 200ms, 400ms, etc.
- Configurable retry count per datasource
- Automatic failure recovery

### Error Handling
- Detailed error messages
- Available datasources listed on errors
- Proper HTTP status codes

### Security
- Custom headers support
- Authorization headers can be passed per request
- Default User-Agent header

### Flexibility
- Register datasources via environment variables
- Register/unregister datasources at runtime
- Support for multiple datasource types
- Custom timeout configuration

## Architecture

```
BFF Server
├── DataSourceManager (src/datasources/dataSourceManager.js)
│   ├── Initialize from .env
│   ├── Manage datasource registry
│   ├── Handle requests with retry logic
│   └── Support runtime registration
├── DataSourceController (src/controllers/dataSourceController.js)
│   ├── List datasources
│   ├── Call datasource
│   ├── Register datasource
│   └── Unregister datasource
└── DataSourceRoutes (src/routes/dataSourceRoutes.js)
    ├── GET  /api/datasources
    ├── POST /api/datasources/call
    ├── POST /api/datasources/register
    └── POST /api/datasources/unregister
```

## Production Considerations

1. **Security**:
   - Use environment variables for sensitive URLs and tokens
   - Implement authentication/authorization checks
   - Validate all incoming requests

2. **Performance**:
   - Implement caching for frequently accessed data
   - Use connection pooling
   - Monitor datasource response times

3. **Monitoring**:
   - Log all datasource calls
   - Track failure rates
   - Monitor timeout occurrences

4. **Token Management**:
   - Store refresh tokens in Redis (not in-memory)
   - Implement token rotation
   - Use token blacklist for logout

## Dependencies

- express: Web framework
- cors: Cross-origin resource sharing
- axios: HTTP client
- joi: Data validation
- jsonwebtoken: JWT authentication
- dotenv: Environment variable management
