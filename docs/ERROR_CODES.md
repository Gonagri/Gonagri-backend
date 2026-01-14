# Error Codes Reference

Complete reference of all error codes used by the API.

## Error Code Format

All error responses follow this format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

---

## HTTP Status Codes & Error Codes

### 400 Bad Request

**VALIDATION_ERROR**
- **Status**: 400
- **Meaning**: Invalid input data
- **Common Causes**:
  - Missing required field
  - Invalid email format
  - String too long or too short
  - Invalid data type
- **Example**:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid email format"
    }
  }
  ```
- **How to Fix**: Review request body and check field values

---

### 401 Unauthorized

**UNAUTHORIZED**
- **Status**: 401
- **Meaning**: Authentication required or failed
- **Common Causes**:
  - Missing authorization header
  - Invalid token
  - Expired token
- **Example**:
  ```json
  {
    "success": false,
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Unauthorized"
    }
  }
  ```
- **How to Fix**: Include valid credentials or token

---

### 404 Not Found

**NOT_FOUND**
- **Status**: 404
- **Meaning**: Resource or endpoint doesn't exist
- **Common Causes**:
  - Wrong endpoint path
  - Resource doesn't exist in database
  - Typo in URL
- **Example**:
  ```json
  {
    "success": false,
    "error": {
      "code": "NOT_FOUND",
      "message": "Route not found"
    }
  }
  ```
- **How to Fix**: Check endpoint path in API documentation

---

### 409 Conflict

**CONFLICT**
- **Status**: 409
- **Meaning**: Duplicate resource or constraint violation
- **Common Causes**:
  - Email already subscribed
  - Duplicate entry
  - Unique constraint violation
- **Example**:
  ```json
  {
    "success": false,
    "error": {
      "code": "CONFLICT",
      "message": "Email is already subscribed to the waitlist"
    }
  }
  ```
- **How to Fix**: Use different values or check if resource already exists

---

### 429 Too Many Requests

**RATE_LIMIT**
- **Status**: 429
- **Meaning**: Too many requests from this IP
- **Common Causes**:
  - Exceeded rate limit (50 req/15min for auth endpoints)
  - DoS attempt
  - Client polling too aggressively
- **Example**:
  ```json
  {
    "statusCode": 429,
    "message": "Too many requests from this IP, please try again later."
  }
  ```
- **How to Fix**: Wait 15 minutes or reduce request frequency

**Rate Limit Headers**:
```
RateLimit-Limit: 50
RateLimit-Remaining: 0
RateLimit-Reset: 1705250400
```

---

### 500 Internal Server Error

**INTERNAL_ERROR**
- **Status**: 500
- **Meaning**: Server error occurred
- **Common Causes**:
  - Database connection failure
  - Unexpected error in code
  - Server crash
- **Development Response**:
  ```json
  {
    "success": false,
    "error": {
      "code": "INTERNAL_ERROR",
      "message": "Connection refused"
    },
    "stack": "Error: connect ECONNREFUSED..."
  }
  ```
- **Production Response**:
  ```json
  {
    "success": false,
    "error": {
      "code": "INTERNAL_ERROR",
      "message": "Internal Server Error"
    }
  }
  ```
- **How to Fix**: Contact backend team, check server logs

---

## Quick Reference Table

| Code | Status | Meaning | Action |
|------|--------|---------|--------|
| VALIDATION_ERROR | 400 | Invalid input | Check request body |
| UNAUTHORIZED | 401 | Not authenticated | Add credentials |
| NOT_FOUND | 404 | Resource missing | Check URL/path |
| CONFLICT | 409 | Duplicate resource | Use different value |
| RATE_LIMIT | 429 | Too many requests | Wait and retry |
| INTERNAL_ERROR | 500 | Server error | Contact support |

---

## Endpoint-Specific Errors

### POST /v1/waitlist/

**Possible Errors**:
1. **VALIDATION_ERROR** (400)
   - Missing email field
   - Invalid email format
   
2. **CONFLICT** (409)
   - Email already subscribed
   
3. **RATE_LIMIT** (429)
   - Too many subscribe attempts from IP
   
4. **INTERNAL_ERROR** (500)
   - Database error
   - Server error

---

### POST /v1/contact/

**Possible Errors**:
1. **VALIDATION_ERROR** (400)
   - Missing name field
   - Name too long (>100 chars)
   - Invalid email format
   - Missing message field
   
2. **RATE_LIMIT** (429)
   - Too many contact submissions from IP
   
3. **INTERNAL_ERROR** (500)
   - Database error
   - Server error

---

### GET /health

**Possible Errors**:
1. **INTERNAL_ERROR** (500)
   - Database connection failed
   - Server error

---

## Handling Errors in Frontend

### Basic Pattern

```javascript
const response = await fetch('/v1/waitlist/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email })
});

const data = await response.json();

if (data.success) {
  // Success - data.data contains the result
  console.log('Subscribed!', data.data);
} else {
  // Error - data.error contains error info
  console.error('Error:', data.error.code, data.error.message);
  
  // Map error codes to user messages
  switch(data.error.code) {
    case 'VALIDATION_ERROR':
      showValidationError(data.error.message);
      break;
    case 'CONFLICT':
      showMessage('Email already subscribed');
      break;
    case 'RATE_LIMIT':
      showMessage('Too many requests, please try again later');
      break;
    case 'INTERNAL_ERROR':
      showMessage('Server error, please try again');
      break;
  }
}
```

### React Example

```typescript
const [email, setEmail] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

const handleSubscribe = async () => {
  setLoading(true);
  setError('');
  
  try {
    const response = await fetch('/v1/waitlist/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Success
      alert('Thanks for subscribing!');
      setEmail('');
    } else {
      // Handle error
      const messages = {
        'VALIDATION_ERROR': 'Please enter a valid email',
        'CONFLICT': 'This email is already subscribed',
        'RATE_LIMIT': 'Too many attempts, please try later',
        'INTERNAL_ERROR': 'Server error, please try again'
      };
      
      setError(messages[data.error.code] || data.error.message);
    }
  } catch (err) {
    setError('Network error, please try again');
  } finally {
    setLoading(false);
  }
};
```

---

## Common Error Scenarios

### Scenario 1: Invalid Email Format

**Request**:
```bash
POST /v1/waitlist/
{
  "email": "notanemail"
}
```

**Response** (400):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format"
  }
}
```

**Fix**: Ensure email contains `@` and valid domain

---

### Scenario 2: Email Already Subscribed

**Request**:
```bash
POST /v1/waitlist/
{
  "email": "john@example.com"
}
```

**Response** (409):
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Email is already subscribed to the waitlist"
  }
}
```

**Fix**: Use different email or show "already subscribed" message

---

### Scenario 3: Missing Required Field

**Request**:
```bash
POST /v1/contact/
{
  "email": "john@example.com",
  "message": "Hello"
}
```

**Response** (400):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name is required"
  }
}
```

**Fix**: Include all required fields

---

### Scenario 4: Rate Limit Exceeded

**Request**: Make 51+ requests in 15 minutes

**Response** (429):
```json
{
  "statusCode": 429,
  "message": "Too many requests from this IP, please try again later."
}
```

**Fix**: Wait 15 minutes before retrying

---

### Scenario 5: Server Error

**Request**: Any request when server is down

**Response** (500):
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal Server Error"
  }
}
```

**Fix**: Retry later or contact support

---

## PostgreSQL Error Codes Handled

| PG Code | Name | Handled As | Example |
|---------|------|-----------|---------|
| 23505 | UNIQUE_VIOLATION | CONFLICT | Duplicate email |
| 42P01 | UNDEFINED_TABLE | INTERNAL_ERROR | Table not found |
| 08006 | CONNECTION_FAILURE | INTERNAL_ERROR | DB connection lost |

---

## Debugging Tips

### Enable Development Mode

In `.env`:
```env
NODE_ENV=development
```

This will include full error stack traces in responses (don't use in production).

### Check Server Logs

```bash
npm run dev
# Look for console errors and database connection messages
```

### Test with curl

```bash
# Test invalid email
curl -X POST http://localhost:3000/v1/waitlist/ \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid"}'

# Should return VALIDATION_ERROR
```

### Check Database

```sql
-- See if email exists
SELECT * FROM subscribers WHERE email = 'test@example.com';

-- Check database connection
SELECT 1;
```
