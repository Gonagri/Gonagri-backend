# Gonagri Backend API

A secure PostgreSQL backend for the "Coming Soon" page to collect email signups and contact messages.

## Overview

**What is this?**: Backend API for Phase 1 of Gonagri - the Coming Soon page integration  
**Tech Stack**: Node.js + Express.js + PostgreSQL + TypeScript  
**Current Status**: Phase 1 - MVP (health check + waitlist + contact form)

## Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v12+)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (copy template)
cp .env.example .env
# Edit .env with your DATABASE_URL and CORS_ORIGIN

# 3. Start development server
npm run dev
```

Server runs on `http://localhost:3000` by default.

## Core Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Check API status |
| POST | `/v1/waitlist/` | Subscribe to waitlist |
| POST | `/v1/contact/` | Submit contact message |

See [API Documentation](docs/API.md) for full details and examples.

## Documentation

This project includes comprehensive documentation:

- **[API.md](docs/API.md)** - Complete API reference, endpoints, request/response examples
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design, folder structure, request flow
- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Development guidelines, how to add endpoints
- **[DATABASE.md](docs/DATABASE.md)** - Database schema, setup, queries, backup/restore
- **[SECURITY.md](docs/SECURITY.md)** - Security practices, authentication, rate limiting
- **[ERROR_CODES.md](docs/ERROR_CODES.md)** - Error codes, handling, debugging

## Project Structure

```
src/
├── app.ts              # Express app & middlewares
├── server.ts           # Entry point
├── config/             # Database & env setup
├── routes/             # Endpoint definitions
├── controllers/        # Business logic
├── models/             # Database access
├── middlewares/        # Global middleware
└── utils/              # Shared utilities
```

## Key Features

✓ **Type-Safe**: Full TypeScript implementation  
✓ **Validated**: Zod input validation  
✓ **Secure**: Helmet + CORS + Rate limiting + SQL injection prevention  
✓ **Consistent**: Unified error handling & response format  
✓ **Reliable**: Connection pooling with retry logic  
✓ **Documented**: Architecture & development guidelines  

## Response Format

**Success**:
```json
{
  "success": true,
  "data": { /* endpoint-specific */ }
}
```

**Error**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description"
  }
}
```

## Important

⚠️ **Do NOT deploy without CTO approval**

Before production:
1. Contact CTO or Project Manager for code review
2. Get explicit deployment approval
3. Verify environment variables are correct
4. Ensure database is properly backed up

## Commands

```bash
npm run dev      # Development server (watch mode)
npm start        # Production server
npm run lint     # Run linter (if configured)
```

## Environment Variables

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | ✓ | postgresql://user:pass@localhost:5432/gonagri | PostgreSQL connection |
| CORS_ORIGIN | ✓ | http://localhost:3000 | Allowed frontend origin |
| PORT | | 3000 | Server port |
| NODE_ENV | | development | Environment mode |

## Support

- Questions about endpoints? → See [API.md](docs/API.md)
- Adding a new feature? → See [DEVELOPMENT.md](docs/DEVELOPMENT.md)
- Database setup issues? → See [DATABASE.md](docs/DATABASE.md)
- Error help? → See [ERROR_CODES.md](docs/ERROR_CODES.md)
- Security concerns? → See [SECURITY.md](docs/SECURITY.md)

## License

See LICENSE file for details.
