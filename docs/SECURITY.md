# Security & Best Practices

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ 1. HTTPS/TLS (Infrastructure)                           │
└─────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────┐
│ 2. Helmet.js - HTTP Security Headers                    │
│    ├── X-Frame-Options (clickjacking)                   │
│    ├── X-Content-Type-Options (MIME sniffing)           │
│    ├── X-XSS-Protection (XSS attacks)                   │
│    └── Content-Security-Policy (injection)              │
└─────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────┐
│ 3. CORS - Origin Validation                             │
│    └── Only allow configured CORS_ORIGIN               │
└─────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────┐
│ 4. Rate Limiting - DoS Protection                       │
│    ├── Global: 100 req/15min per IP                     │
│    └── Auth: 50 req/15min per IP                        │
└─────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────┐
│ 5. Input Validation - Zod                               │
│    ├── Type validation                                  │
│    ├── Format validation (email)                        │
│    └── Length constraints                               │
└─────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────┐
│ 6. Parameterized Queries - SQL Injection Prevention     │
│    └── pg library with $1, $2, etc.                     │
└─────────────────────────────────────────────────────────┘
```

## 1. HTTPS/TLS

**Status**: Implementation required at deployment

**Requirements**:
- Enable HTTPS on production
- Obtain SSL/TLS certificate (Let's Encrypt recommended)
- Redirect HTTP → HTTPS
- Set HSTS header (done by Helmet)

**Implementation**: Set at reverse proxy/load balancer level (nginx, CloudFront, etc.)

---

## 2. Helmet.js - HTTP Security Headers

**What It Does**: Adds HTTP headers to prevent common web vulnerabilities

**Enabled Headers**:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Content-Security-Policy: ...` - Prevents injection attacks
- `Strict-Transport-Security: ...` - Forces HTTPS

**Implementation**: [src/app.ts](../src/app.ts)
```typescript
app.use(securityHeaders);
```

**More Info**: https://github.com/helmetjs/helmet

---

## 3. CORS - Origin Validation

**What It Does**: Only allows requests from specific frontend origin

**Configuration**:
```env
CORS_ORIGIN=https://gonagri.com  # Production
CORS_ORIGIN=http://localhost:3000 # Development
```

**Implementation**: [src/middlewares/cors.middleware.ts](../src/middlewares/cors.middleware.ts)

**How It Works**:
1. Check `Origin` header in request
2. Compare to `CORS_ORIGIN` env var
3. Only include CORS headers if match
4. Preflight requests (OPTIONS) cached for 3600s

**Example**:
```
Request from http://localhost:3000:
  ✓ Allowed (origin matches CORS_ORIGIN)
  
Request from http://evil.com:
  ✗ Blocked (origin doesn't match)
```

**Never Do This**:
- ❌ Allow `*` as CORS_ORIGIN in production
- ❌ Disable CORS validation
- ❌ Trust the Origin header without validation

---

## 4. Rate Limiting - DoS Protection

**What It Does**: Limits requests per IP to prevent abuse

**Limits**:
- Global: 100 requests per 15 minutes per IP
- Auth endpoints (`/v1/waitlist`, `/v1/contact`): 50 per 15 minutes per IP

**Implementation**: [src/middlewares/security.middleware.ts](../src/middlewares/security.middleware.ts)

**How It Works**:
1. Track requests by IP address
2. Count requests in 15-minute window
3. Return 429 if limit exceeded
4. Include rate limit info in response headers

**Response When Limited**:
```
HTTP/1.1 429 Too Many Requests

{
  "message": "Too many requests from this IP, please try again later."
}
```

**Rate Limit Headers**:
```
RateLimit-Limit: 50
RateLimit-Remaining: 49
RateLimit-Reset: 1705250400
```

**Customization**: Adjust limits in `security.middleware.ts`
```typescript
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // Time window
  max: 50,                    // Max requests
});
```

---

## 5. Input Validation - Zod

**What It Does**: Validates and sanitizes all incoming data

**Validation Strategy**:
- Type checking (string, number, etc.)
- Format validation (email RFC 5322)
- Length constraints
- Required field checks

**Examples**:

**Waitlist Schema**:
```typescript
const subscribeSchema = z.object({
  email: z.string().email('Invalid email format'),
});
```

**Contact Schema**:
```typescript
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  message: z.string().min(1, 'Message is required'),
});
```

**Implementation**: [src/middlewares/validate.middleware.ts](../src/middlewares/validate.middleware.ts)

**Flow**:
```
Request → Zod Validates → Valid? 
  ├── YES → Continue to controller
  └── NO → Return 400 VALIDATION_ERROR
```

**Never Do This**:
- ❌ Validate in controllers (do it in middleware)
- ❌ Skip validation for "trusted" fields
- ❌ Trust client-side validation alone

---

## 6. Parameterized Queries - SQL Injection Prevention

**What It Does**: Prevents SQL injection attacks

**Implementation**: Using pg library with placeholders

**Safe** ✓:
```typescript
const query = `
  INSERT INTO subscribers (email)
  VALUES ($1)
  RETURNING id, email, created_at
`;
const result = await pool.query(query, [email]);
```

**Unsafe** ✗:
```typescript
const query = `
  INSERT INTO subscribers (email)
  VALUES ('${email}')
`;
```

**Why It Works**:
- `$1`, `$2`, etc. are placeholders
- Values passed separately as array `[email]`
- Database driver treats values as data, not SQL code
- Prevents malicious SQL injection

**Never Do This**:
- ❌ String concatenation in SQL: `'${value}'`
- ❌ Template literals in queries: `` `...${value}...` ``
- ❌ Escape user input manually (let driver handle it)

---

## 7. Error Handling Security

**What It Does**: Prevents information leakage through error messages

**Development vs Production**:

**Development** (NODE_ENV=development):
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

**Production** (NODE_ENV=production):
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal Server Error"
  }
}
```

**Implementation**: [src/middlewares/error.middleware.ts](../src/middlewares/error.middleware.ts)

**Never Do This**:
- ❌ Return database error messages to client
- ❌ Expose stack traces in production
- ❌ Include sensitive data in error responses

---

## 8. Database Connection Security

**Connection String Security**:
```env
# ✓ Good - credentials in .env, not committed
DATABASE_URL=postgresql://user:password@localhost:5432/gonagri

# ✗ Bad - hardcoded in code
const url = 'postgresql://user:password@localhost:5432/gonagri';
```

**Connection Pool**:
- Max connections limited (dev: 10, prod: 20)
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds
- Automatic reconnection on error

**Startup Check**:
- Fails immediately if DB unavailable
- 3 retry attempts with exponential backoff
- Prevents silent failures

---

## 9. Environment Variables Security

**Critical Variables** (must be set):
- `DATABASE_URL` - Database connection string
- `CORS_ORIGIN` - Allowed frontend origin

**Optional Variables**:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

**Fail-Fast Validation**:
```typescript
const requiredEnvVars = ['DATABASE_URL', 'CORS_ORIGIN'];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

**Never Do This**:
- ❌ Commit `.env` file
- ❌ Log environment variables
- ❌ Use default values for DATABASE_URL or CORS_ORIGIN
- ❌ Include sensitive data in git history

---

## 10. Request Size Limiting

**Body Size Limits**:
```typescript
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
```

**Why**: Prevents memory exhaustion attacks

**Limits**:
- JSON bodies: max 10KB
- URL-encoded bodies: max 10KB

**Adjust if needed**: Update in [src/app.ts](../src/app.ts)

---

## Deployment Security Checklist

- [ ] HTTPS/TLS enabled
- [ ] NODE_ENV=production
- [ ] All required env vars set (DATABASE_URL, CORS_ORIGIN)
- [ ] CORS_ORIGIN set to production frontend URL
- [ ] DATABASE_URL uses strong password
- [ ] Database credentials rotated
- [ ] Error logging (not exposing stack traces)
- [ ] Monitor rate limit abuse
- [ ] Regular security updates for dependencies
- [ ] Enable database connection encryption
- [ ] Set up request logging
- [ ] Enable database query logging (for debugging)

---

## Common Security Vulnerabilities & Prevention

| Vulnerability | Prevention |
|---------------|-----------|
| SQL Injection | Parameterized queries (pg $1, $2...) |
| XSS | Helmet + Content-Security-Policy |
| CSRF | CORS origin validation |
| Clickjacking | Helmet X-Frame-Options |
| DoS | Rate limiting |
| Information Disclosure | Controlled error messages |
| Unvalidated Input | Zod validation |
| Weak Crypto | TLS at transport layer |

---

## Security Review Process

Before deploying:

1. ✓ Review all environment variables
2. ✓ Check CORS_ORIGIN is production URL
3. ✓ Verify DATABASE_URL credentials
4. ✓ Test rate limiting
5. ✓ Run security audit: `npm audit`
6. ✓ Enable HTTPS
7. ✓ Set NODE_ENV=production
8. ✓ CTO approval before deployment
