# Development Guidelines

## Coding Standards

### TypeScript
- Use strict mode (already configured)
- Explicit types for all function parameters and returns
- No `any` type without documented justification
- Use interfaces for all data models

**Example**:
```typescript
// ✓ Good
export const addSubscriber = async (email: string): Promise<Subscriber> => {
  // ...
};

// ✗ Bad
export const addSubscriber = async (email) => {
  // ...
};
```

### Naming Conventions
- **Files**: kebab-case (`subscriber.model.ts`, `health.routes.ts`)
- **Functions**: camelCase (`subscribeToWaitlist()`, `addContactMessage()`)
- **Constants**: UPPER_SNAKE_CASE (`DATABASE_URL`, `PORT`)
- **Interfaces**: PascalCase (`Subscriber`, `ContactMessage`)
- **Error Classes**: PascalCase + `Error` suffix (`ValidationError`, `ConflictError`)

### Imports
- Organize by: external packages, local configs, routes/controllers/models, utilities
- Use absolute imports (configured in tsconfig)

**Example**:
```typescript
import express from 'express';           // External
import { DATABASE_URL } from '../config/env'; // Config
import { addSubscriber } from '../models/subscriber.model'; // Models
import { ApiError } from '../utils/ApiError'; // Utilities
```

---

## Adding a New Endpoint

### Step 1: Define the Route

**File**: `src/routes/newfeature.routes.ts`

```typescript
import { Router } from 'express';
import { validateRequest } from '../middlewares/validate.middleware';
import { yourController } from '../controllers/newfeature.controller';
import { z } from 'zod';

const router = Router();

// Define Zod schema
const yourSchema = z.object({
  field1: z.string().min(1, 'Field1 is required'),
  field2: z.string().email('Invalid email'),
});

// Define route
router.post('/', validateRequest(yourSchema), yourController);

export default router;
```

**Schema Best Practices**:
- Use descriptive error messages
- Add length constraints where applicable
- Use email validation for emails
- Export schema for testing (optional)

### Step 2: Create the Controller

**File**: `src/controllers/newfeature.controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { yourModel } from '../models/newfeature.model';

export const yourController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { field1, field2 } = req.body;
    const result = await yourModel(field1, field2);
    
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);  // Pass to error middleware
  }
};
```

**Controller Rules**:
- Single responsibility (one endpoint per function)
- Extract data from `req.body` (already validated)
- Call model function
- Format response as `{ success, data }`
- Always pass errors to `next(error)`

### Step 3: Create the Model

**File**: `src/models/newfeature.model.ts`

```typescript
import pool from '../config/db';
import { YourError } from '../utils/ApiError';

export interface YourResult {
  id: number;
  field1: string;
  created_at: string;
}

export const yourModel = async (
  field1: string,
  field2: string
): Promise<YourResult> => {
  try {
    const query = `
      INSERT INTO your_table (field1, field2)
      VALUES ($1, $2)
      RETURNING id, field1, created_at
    `;
    const result = await pool.query(query, [field1, field2]);
    return result.rows[0];
  } catch (error: any) {
    // Handle specific errors
    if (error.code === '23505') {  // Unique constraint
      throw new ConflictError('This value already exists');
    }
    throw error;  // Re-throw unknown errors
  }
};
```

**Model Rules**:
- Only database operations
- Parameterized queries ($1, $2, etc.)
- Handle domain-specific errors (unique constraint, etc.)
- Return typed data
- Re-throw unexpected errors

### Step 4: Register the Route

**File**: `src/app.ts`

```typescript
import newfeatureRoutes from './routes/newfeature.routes';

// In middleware section
app.use('/v1/newfeature', authLimiter, newfeatureRoutes);
```

**Route Rules**:
- Use versioning: `/v1/...`
- Apply stricter rate limiter to auth endpoints
- Use consistent naming

### Step 5: Update Documentation

**File**: `docs/API.md`

Add new endpoint section with:
- HTTP method and path
- Description
- Rate limit (if applicable)
- Request body example
- Response examples (success and errors)
- Error codes possible

---

## Working with Database

### Query Best Practices

**✓ Good - Parameterized**:
```typescript
const query = 'SELECT * FROM subscribers WHERE email = $1';
const result = await pool.query(query, [email]);
```

**✗ Bad - String Concatenation**:
```typescript
const query = `SELECT * FROM subscribers WHERE email = '${email}'`;
const result = await pool.query(query);
```

**✗ Bad - Manual Escaping**:
```typescript
const email = email.replace(/'/g, "''");  // Don't do this!
```

### Common Query Patterns

**Insert with Return**:
```typescript
const query = `
  INSERT INTO subscribers (email)
  VALUES ($1)
  RETURNING id, email, created_at
`;
const result = await pool.query(query, [email]);
return result.rows[0];
```

**Select with Filter**:
```typescript
const query = 'SELECT * FROM subscribers WHERE email = $1';
const result = await pool.query(query, [email]);
return result.rows[0] || null;
```

**Select All Ordered**:
```typescript
const query = 'SELECT * FROM subscribers ORDER BY created_at DESC';
const result = await pool.query(query);
return result.rows;
```

**Update**:
```typescript
const query = `
  UPDATE subscribers
  SET status = $1
  WHERE id = $2
  RETURNING *
`;
const result = await pool.query(query, [status, id]);
return result.rows[0];
```

### Error Handling in Models

```typescript
export const yourModel = async (email: string): Promise<Subscriber> => {
  try {
    const query = '...';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  } catch (error: any) {
    // Handle known errors
    if (error.code === '23505') {
      throw new ConflictError('Email already exists');
    }
    if (error.code === '42P01') {
      throw new Error('Database table not found');
    }
    // Re-throw unexpected errors
    throw error;
  }
};
```

---

## Error Handling

### Error Hierarchy

```
Error (JavaScript built-in)
├── ApiError (Custom base error)
│   ├── ValidationError (400)
│   ├── ConflictError (409)
│   ├── NotFoundError (404)
│   └── UnauthorizedError (401)
└── Other errors (catch-all, becomes 500)
```

### Throwing Errors

**In Models**:
```typescript
if (error.code === '23505') {
  throw new ConflictError('Email already subscribed');
}
throw error;
```

**In Controllers**:
```typescript
try {
  const result = await addSubscriber(email);
  res.json({ success: true, data: result });
} catch (error) {
  next(error);  // Always pass to middleware
}
```

### Never Do This

- ❌ Catch error and return response directly
  ```typescript
  catch (error) {
    res.status(400).json({ error: error.message });  // Don't!
  }
  ```

- ❌ Swallow errors
  ```typescript
  catch (error) {
    // Don't log and ignore
  }
  ```

- ❌ Return generic message without code
  ```typescript
  throw new Error('Something went wrong');  // Use ApiError!
  ```

---

## Validation

### Using Zod

**Define Schema**:
```typescript
const emailSchema = z.object({
  email: z.string().email('Invalid email format'),
});
```

**Common Validations**:
```typescript
// String validations
z.string().min(1, 'Required')
z.string().max(100, 'Too long')
z.string().email('Invalid email')
z.string().url('Invalid URL')
z.string().regex(/pattern/, 'Invalid format')

// Number validations
z.number().int('Must be integer')
z.number().positive('Must be positive')
z.number().min(0, 'Min value')
z.number().max(100, 'Max value')

// Optional fields
z.string().optional()
z.string().nullable()

// Array validation
z.array(z.string())
z.array(z.object({ ... }))
```

**Always Validate**:
- ✓ Email format
- ✓ Required fields
- ✓ String length
- ✓ Type correctness

**Never Skip**:
- ❌ "This is already validated on frontend"
- ❌ "This endpoint is internal only"
- ❌ "No one would send invalid data"

---

## Testing

### Unit Testing Pattern

```typescript
// example.test.ts
import { yourController } from '../controllers/yourfeature.controller';
import { yourModel } from '../models/yourfeature.model';

jest.mock('../models/yourfeature.model');

describe('yourController', () => {
  it('should handle valid input', async () => {
    const req = { body: { email: 'test@example.com' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await yourController(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.any(Object),
    });
  });
});
```

### Manual Testing with cURL

```bash
# Test endpoint
curl -X POST http://localhost:3000/v1/yourfeature/ \
  -H "Content-Type: application/json" \
  -d '{"field1":"value1","field2":"value2"}'

# Test with invalid data
curl -X POST http://localhost:3000/v1/yourfeature/ \
  -H "Content-Type: application/json" \
  -d '{"field1":""}'  # Should return validation error
```

---

## Debugging

### Enable Debug Logging

```bash
# Enable debug output
DEBUG=* npm run dev

# Enable only database logs
DEBUG=db:* npm run dev
```

### Common Issues

**"Cannot find module"**:
- Check import path
- Verify file exists
- Check tsconfig baseUrl

**"Type is not assignable"**:
- Check function signature
- Verify interface matches
- Use `as any` only as last resort (with comment)

**"Database query returns undefined"**:
- Check query syntax
- Verify table/column names
- Check if row exists in database

**"Request hangs"**:
- Check for infinite loops
- Verify database connection
- Check for unhandled promises

---

## Performance Tips

1. **Use database indexes** on frequently queried columns
2. **Limit query results** with LIMIT clause
3. **Use connection pooling** (already configured)
4. **Avoid N+1 queries** - fetch all data in one query
5. **Cache static data** if needed (future optimization)
6. **Monitor slow queries** in production logs

---

## Security Reminders

- ❌ Never trust user input
- ❌ Never concatenate SQL queries
- ❌ Never expose database errors to frontend
- ❌ Never log sensitive data
- ✓ Always validate input
- ✓ Always use parameterized queries
- ✓ Always handle errors properly
- ✓ Always require CTO approval before deploying

---

## Making a Pull Request

1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Make changes** following guidelines above
3. **Test locally**: `npm run dev`
4. **Commit with clear message**: `git commit -m "feat: add new endpoint"`
5. **Push**: `git push origin feature/your-feature`
6. **Create PR** with description of changes
7. **Wait for CTO review** and approval
8. **Merge after approval**

---

## Project Commands

```bash
# Install dependencies
npm install

# Development server (watch mode)
npm run dev

# Start production server
npm start

# Build TypeScript (if needed)
npx tsc

# Format code
npx prettier --write .

# Lint (if eslint is configured)
npm run lint
```
