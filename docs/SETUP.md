# Setup & Installation Guide

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 12+ ([Download](https://www.postgresql.org/download/))
- npm or yarn

## Step 1: Clone Repository

```bash
git clone https://github.com/Gonagri/gonagri-backend.git
cd gonagri-backend
```

## Step 2: Install Dependencies

```bash
npm install
```

This installs:
- Express.js (web framework)
- Zod (validation)
- pg (PostgreSQL driver)
- Helmet (security headers)
- express-rate-limit (rate limiting)
- TypeScript & dev tools

## Step 3: Configure Database

### Option A: Using psql (Recommended)

1. **Create database and tables**:
   ```bash
   psql postgresql://postgres@localhost:5432 < database/init.sql
   ```

2. **Verify tables were created**:
   ```bash
   psql -d gonagri -c "\dt"
   ```

### Option B: Using Node.js Setup Script

```bash
npm run db:setup
```

This script:
- Connects to PostgreSQL
- Reads `database/schema.sql`
- Creates tables and indexes
- Prints confirmation

## Step 4: Configure Environment Variables

1. **Copy template**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values**:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration (REQUIRED)
   DATABASE_URL=postgresql://postgres:password@localhost:5432/gonagri

   # CORS Configuration (REQUIRED)
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Get your DATABASE_URL**:
   ```
   postgresql://[username]:[password]@[host]:[port]/[database_name]
   
   Example:
   postgresql://postgres:mypassword@localhost:5432/gonagri
   ```

### Finding Your PostgreSQL Credentials

**macOS (Homebrew)**:
```bash
# Default user is usually 'postgres' with empty password
brew services info postgresql
```

**Linux**:
```bash
# Default user is 'postgres'
sudo -u postgres psql -c "SELECT version();"
```

**Windows**:
```bash
# Default user is 'postgres' with password set during installation
psql -U postgres -h localhost
```

## Step 5: Create PostgreSQL Database

If database doesn't exist, create it:

```bash
psql -U postgres -h localhost -c "CREATE DATABASE gonagri;"
```

Or using your DATABASE_URL:
```bash
psql postgresql://postgres:password@localhost:5432 -c "CREATE DATABASE gonagri;"
```

## Step 6: Start Development Server

```bash
npm run dev
```

Output should look like:
```
[DB] Connection established
[DB] Connection test successful
Server is running at http://localhost:3000
```

## Step 7: Test Endpoints

### Test Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-14T10:30:00.000Z"
  }
}
```

### Test Waitlist Subscribe
```bash
curl -X POST http://localhost:3000/v1/waitlist/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "test@example.com",
    "created_at": "2024-01-14T10:30:00.000Z"
  }
}
```

### Test Contact Form
```bash
curl -X POST http://localhost:3000/v1/contact/ \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Doe",
    "email":"john@example.com",
    "message":"Hello!"
  }'
```

## Troubleshooting

### "ECONNREFUSED" - Cannot Connect to Database

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions**:
1. Check if PostgreSQL is running:
   ```bash
   # macOS
   brew services list
   
   # Linux
   systemctl status postgresql
   
   # Windows
   Services → PostgreSQL
   ```

2. Start PostgreSQL if stopped:
   ```bash
   # macOS
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   
   # Windows
   net start postgresql-x64-13
   ```

3. Verify connection:
   ```bash
   psql postgresql://postgres@localhost:5432
   ```

### "Database does not exist"

**Problem**: `FATAL: database "gonagri" does not exist`

**Solution**: Create database
```bash
psql -U postgres -h localhost -c "CREATE DATABASE gonagri;"
```

### "Tables do not exist"

**Problem**: Queries fail with "relation does not exist"

**Solution**: Run migrations
```bash
npm run db:setup
# or
psql -d gonagri < database/init.sql
```

### "Authentication failed"

**Problem**: `FATAL: Ident authentication failed for user "postgres"`

**Solutions**:
1. Check `.env` DATABASE_URL has correct password
2. Reset PostgreSQL password:
   ```bash
   psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'newpassword';"
   ```
3. Update DATABASE_URL with new password

### "Port 3000 already in use"

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:
1. Change port in `.env`: `PORT=3001`
2. Kill process using port 3000:
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

## Database Structure

After setup, your database has 2 tables:

### subscribers
```
 id (serial)           - Auto-incrementing ID
 email (varchar 255)   - Unique email address
 created_at (timestamp)- When subscribed
```

### contact_messages
```
 id (serial)           - Auto-incrementing ID
 name (varchar 100)    - Sender's name
 email (varchar 255)   - Sender's email
 message (text)        - Message content
 created_at (timestamp)- When sent
```

## Next Steps

1. **Read API Documentation**: [docs/API.md](API.md)
2. **Understand Architecture**: [docs/ARCHITECTURE.md](ARCHITECTURE.md)
3. **Learn Development**: [docs/DEVELOPMENT.md](DEVELOPMENT.md)
4. **Review Security**: [docs/SECURITY.md](SECURITY.md)

## Production Deployment

Before deploying to production:

1. ✓ Set `NODE_ENV=production`
2. ✓ Use strong DATABASE_URL credentials
3. ✓ Set CORS_ORIGIN to production domain
4. ✓ Enable HTTPS/TLS
5. ✓ Set up proper logging
6. ✓ Configure database backups
7. ✓ Get CTO approval

See [SECURITY.md](SECURITY.md) for full deployment checklist.

## Useful Commands

```bash
# Development
npm run dev              # Start with watch mode

# Database
npm run db:setup        # Initialize database
npm run db:init         # Run init.sql directly

# Production
npm start               # Start production server

# Utilities
npm run lint           # Run linter (if configured)
```

## Database Tools

### Access Database via psql

```bash
psql postgresql://postgres:password@localhost:5432/gonagri
```

Common commands:
```sql
\dt                    -- List tables
\d subscribers         -- Describe table
SELECT * FROM subscribers;  -- View data
SELECT COUNT(*) FROM subscribers;  -- Count rows
```

### Backup Database

```bash
pg_dump postgresql://postgres:password@localhost:5432/gonagri > backup.sql
```

### Restore Database

```bash
psql postgresql://postgres:password@localhost:5432/gonagri < backup.sql
```

## Support

- **Setup issues?** Check "Troubleshooting" above
- **API questions?** See [docs/API.md](API.md)
- **Database help?** See [docs/DATABASE.md](DATABASE.md)
- **Security concerns?** See [docs/SECURITY.md](SECURITY.md)
