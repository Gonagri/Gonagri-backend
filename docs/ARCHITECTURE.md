# Architecture & Design

## Project Structure

```
gonagri-backend/
├── src/
│   ├── app.ts                    # Express app setup & middlewares
│   ├── server.ts                 # Server entry point
│   │
│   ├── config/
│   │   ├── db.ts                # PostgreSQL connection pool
│   │   └── env.ts               # Environment variables (fail-fast)
│   │
│   ├── routes/
│   │   ├── health.routes.ts
│   │   ├── waitlist.routes.ts
│   │   └── contact.routes.ts
│   │
│   ├── controllers/
│   │   ├── waitlist.controller.ts
│   │   └── contact.controller.ts
│   │
│   ├── models/
│   │   ├── subscriber.model.ts
│   │   └── contact.model.ts
│   │
│   ├── middlewares/
│   │   ├── error.middleware.ts      # Global error handler
│   │   ├── validate.middleware.ts   # Zod validation
│   │   ├── cors.middleware.ts       # CORS + origin check
│   │   └── security.middleware.ts   # Helmet + Rate limiting
│   │
│   └── utils/
│       └── ApiError.ts              # Custom error classes
│
├── package.json
├── tsconfig.json
├── .env                    # Environment variables (local, not committed)
├── .env.example            # Template for env vars
├── .gitignore
└── README.md
```

## Folder Responsibilities

| Folder | Responsibility | What Goes Here | What Doesn't |
|--------|-----------------|----------------|-------------|
| `config/` | Bootstrap & setup | DB connection, env vars | Business logic, routes |
| `routes/` | Route definitions | Route paths, Zod schemas | Controllers, models |
| `controllers/` | Business logic | Logic, response formatting | Database queries, validation |
| `models/` | Database access | SQL queries, DB error handling | Controllers, routes |
| `middlewares/` | Request processing | Error handler, validation, auth | Routes, controllers |
| `utils/` | Shared code | Error classes, helpers | Route-specific logic |

## Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Incoming Request                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │ Security Headers (Helmet)      │
        │ CORS Validation                │
        │ Rate Limiting                  │
        └────────────────┬───────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │ Route Matching                 │
        │ (health.routes, etc)           │
        └────────────────┬───────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │ Input Validation (Zod)         │
        │ validateRequest middleware     │
        └────────────────┬───────────────┘
                         │
        ┌────────────────┴───────────────┐
        │ Validation Failed?             │
        │ YES ──────────────────┐        │ NO
        │                       │        │
        │                       ▼        ▼
        │              ValidationError  Controller
        │                  (400)        (Business Logic)
        │                       │        │
        │                       │        ▼
        │                       │      Model Layer
        │                       │      (Database Query)
        │                       │        │
        │                       │   ┌────┴───────┐
        │                       │   │ Error?     │
        │                       │   │ YES  NO    │
        │                       │   │  │    │    │
        │                       │   ▼  ▼    ▼    ▼
        │                       │ ApiError Result
        │                       │   │        │
        │                       └───┤────────┘
        │                           │
        │                           ▼
        │                ┌──────────────────────┐
        │                │ Format Response      │
        │                │ {success, data}      │
        │                │ or {success, error}  │
        │                └──────────────────────┘
        │                           │
        │                           ▼
        │                ┌──────────────────────┐
        │                │ Send JSON Response   │
        │                └──────────────────────┘
        │
        └──────────────────► Error Middleware ──► Error Response
                               (if error occurs)
```

## Key Design Decisions

### 1. TypeScript First
- Full type safety across codebase
- No `any` types without explicit justification
- Interfaces for all data models

### 2. Centralized Error Handling
- **Single error handler** catches all errors
- Controllers never directly return errors to response
- Pass errors to `next(error)` in Express
- Error middleware formats consistently

### 3. Validation at Entry Point
- Zod validates request body before controller
- No validation logic in controllers
- Validation errors are standardized (400 with VALIDATION_ERROR code)

### 4. Database Connection Pooling
- Connection retry logic (3 retries with exponential backoff)
- Health check on startup (fails fast if DB unavailable)
- Proper connection cleanup
- Per-environment pool sizing (dev: 10, prod: 20)

### 5. Security by Default
- Helmet.js adds HTTP security headers
- CORS only allows configured origin
- Rate limiting on all endpoints (stricter on auth endpoints)
- Parameterized queries prevent SQL injection
- No sensitive data in error messages (except in dev)

### 6. Environment Variables - Fail Fast
- Missing DATABASE_URL or CORS_ORIGIN crashes at startup
- No silent failures or defaults for critical vars
- Type-safe exports from env.ts

### 7. Unified Response Format
Every endpoint returns one of:
```json
{
  "success": true,
  "data": {}
}
```
or
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

## Data Flow Examples

### Successful Request
```
POST /v1/waitlist/
├── CORS check ✓
├── Rate limit check ✓
├── Zod validation (email) ✓
├── Controller: addSubscriber(email)
│   ├── Model: INSERT INTO subscribers
│   └── Returns Subscriber object
└── Response: { success: true, data: { id, email, created_at } }
```

### Validation Error
```
POST /v1/waitlist/
├── CORS check ✓
├── Rate limit check ✓
├── Zod validation (email) ✗ Invalid format
└── Response: { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid email format" } }
```

### Duplicate Error
```
POST /v1/waitlist/
├── CORS check ✓
├── Rate limit check ✓
├── Zod validation ✓
├── Controller: addSubscriber(email)
│   ├── Model: INSERT (unique constraint violation)
│   └── Throws ConflictError
└── Error Middleware catches
└── Response: { success: false, error: { code: "CONFLICT", message: "Email is already subscribed..." } }
```

## Error Propagation

```
Model
  ├── Throw ApiError (known error)
  └── Throw Error (unexpected error)
    │
    ▼
Controller (in catch block)
  ├── next(error)
    │
    ▼
Error Middleware
  ├── Check if ApiError instance
  ├── Extract: statusCode, code, message
  └── Return formatted JSON
```

## Why This Architecture?

| Aspect | Benefit |
|--------|---------|
| Layered structure | Clear responsibility, easy to test, maintainable |
| Centralized error handling | Consistent error format, reduced bugs, easier debugging |
| Validation at entry | Invalid data never reaches business logic |
| Connection pooling | Better performance, automatic retry on transient failures |
| Security middleware | Prevents common attacks, easy to audit |
| Fail-fast startup | Catch config issues immediately, not at runtime |
| Typed responses | Frontend knows exact response structure |
