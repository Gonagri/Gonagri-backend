# API Documentation

## Response Format Standard

### Success Response
```json
{
  "success": true,
  "data": {
    // Endpoint-specific data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## Endpoints

### 1. Health Check

**Endpoint**: `GET /health`

**Description**: Check if the API is running and database is connected

**Request**: No body required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-14T10:30:00.000Z"
  }
}
```

**Use Case**: Monitoring, load balancer health checks, deployment verification

---

### 2. Subscribe to Waitlist

**Endpoint**: `POST /v1/waitlist/`

**Description**: Add an email to the Coming Soon waitlist

**Rate Limit**: 50 requests per 15 minutes per IP

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Request Headers**:
```
Content-Type: application/json
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-01-14T10:30:00.000Z"
  }
}
```

**Error Responses**:

**400 Bad Request** - Validation Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format"
  }
}
```

**409 Conflict** - Email already subscribed:
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Email is already subscribed to the waitlist"
  }
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "statusCode": 429,
  "message": "Too many requests from this IP, please try again later."
}
```

**Use Case**: Collecting emails from Coming Soon page

**Validation Rules**:
- Email must be valid format (RFC 5322)
- Email must be unique (no duplicates)

---

### 3. Submit Contact Message

**Endpoint**: `POST /v1/contact/`

**Description**: Submit a contact message from the Coming Soon page

**Rate Limit**: 50 requests per 15 minutes per IP

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I have a question about your product..."
}
```

**Request Headers**:
```
Content-Type: application/json
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello, I have a question about your product...",
    "created_at": "2024-01-14T10:30:00.000Z"
  }
}
```

**Error Responses**:

**400 Bad Request** - Validation Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name is required"
  }
}
```

Possible validation errors:
- `"Name is required"` - Empty name
- `"Name is too long"` - Name > 100 characters
- `"Invalid email format"` - Invalid email
- `"Message is required"` - Empty message

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "statusCode": 429,
  "message": "Too many requests from this IP, please try again later."
}
```

**Use Case**: Collecting contact messages from Coming Soon page

**Validation Rules**:
- Name: Required, max 100 characters
- Email: Required, valid format (RFC 5322)
- Message: Required, any length

---

## HTTP Status Codes

| Status | Meaning | When Used |
|--------|---------|-----------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST request (resource created) |
| 400 | Bad Request | Validation error, invalid input |
| 404 | Not Found | Endpoint doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., email already subscribed) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error (database, unexpected error) |

## Rate Limiting

### Limits

**Global API**: 100 requests per 15 minutes per IP
- Applied to all endpoints

**Auth Endpoints**: 50 requests per 15 minutes per IP
- Applied to `/v1/waitlist/` and `/v1/contact/`
- More restrictive to prevent abuse

### Headers

Rate limit information is included in response headers:
```
RateLimit-Limit: 50
RateLimit-Remaining: 49
RateLimit-Reset: 1705250400
```

### Response When Limit Exceeded

```
HTTP/1.1 429 Too Many Requests

{
  "message": "Too many requests from this IP, please try again later."
}
```

## CORS

**Allowed Origins**: Only the configured `CORS_ORIGIN` environment variable
- Default (development): `http://localhost:3000`

**Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers**: Content-Type, Authorization

**CORS Preflight Caching**: 3600 seconds (1 hour)

**Example**:
```
Request:
  Origin: http://localhost:3000
  
Response Headers:
  Access-Control-Allow-Origin: http://localhost:3000
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
  Access-Control-Max-Age: 3600
```

If origin doesn't match configured `CORS_ORIGIN`, CORS headers are not included.

## Error Codes Reference

| Code | Status | Meaning | Example |
|------|--------|---------|---------|
| VALIDATION_ERROR | 400 | Input validation failed | Invalid email format |
| NOT_FOUND | 404 | Resource not found | Wrong endpoint |
| CONFLICT | 409 | Duplicate or constraint violation | Email already subscribed |
| UNAUTHORIZED | 401 | Unauthorized access | Missing/invalid token |
| INTERNAL_ERROR | 500 | Server error | Database connection failed |

## Testing

### Using cURL

**Test Health Endpoint**:
```bash
curl -X GET http://localhost:3000/health
```

**Test Waitlist Subscribe**:
```bash
curl -X POST http://localhost:3000/v1/waitlist/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Test Contact Message**:
```bash
curl -X POST http://localhost:3000/v1/contact/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Test message"
  }'
```

### Using Postman

1. Import the endpoints above
2. Set `Content-Type: application/json`
3. Update `{{BASE_URL}}` to `http://localhost:3000`

## Frontend Integration

### Expected Request Format

All endpoints expect:
```json
{
  "Content-Type": "application/json"
}
```

### Expected Response Format

All endpoints return:
```json
{
  "success": boolean,
  "data": object | undefined,
  "error": {
    "code": string,
    "message": string
  } | undefined
}
```

### Client-Side Error Handling

```javascript
if (response.success) {
  // Handle success
  console.log(response.data);
} else {
  // Handle error
  console.error(response.error.code, response.error.message);
  
  // Map error codes to user messages
  switch(response.error.code) {
    case 'VALIDATION_ERROR':
      // Show validation error to user
      break;
    case 'CONFLICT':
      // Show "already exists" message
      break;
    case 'INTERNAL_ERROR':
      // Show "try again later" message
      break;
  }
}
```
