# Database Schema & Setup

## Database Setup

### Prerequisites
- PostgreSQL 12+
- psql client

### Connection String Format
```
postgresql://username:password@host:port/database_name

Example:
postgresql://postgres:mypassword@localhost:5432/gonagri
```

### Initial Setup

1. **Create Database**:
```sql
CREATE DATABASE gonagri;
```

2. **Connect to Database**:
```bash
psql postgresql://postgres:password@localhost:5432/gonagri
```

3. **Run Schema Migrations** (see below)

---

## Schema

### Table 1: subscribers

Stores email addresses of users who want to be notified when the product launches.

```sql
CREATE TABLE subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Subscription timestamp |

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_subscribers_email ON subscribers(email);
```

**Example Data**:
```sql
INSERT INTO subscribers (email) VALUES ('user1@example.com');
INSERT INTO subscribers (email) VALUES ('user2@example.com');

SELECT * FROM subscribers;
 id |      email       |         created_at         
----+------------------+----------------------------
  1 | user1@example.com | 2024-01-14 10:30:00
  2 | user2@example.com | 2024-01-14 10:31:00
```

---

### Table 2: contact_messages

Stores contact messages submitted through the Coming Soon page.

```sql
CREATE TABLE contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| name | VARCHAR(100) | NOT NULL | Sender's name |
| email | VARCHAR(255) | NOT NULL | Sender's email |
| message | TEXT | NOT NULL | Message content |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Submission timestamp |

**Indexes**:
```sql
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);
```

**Example Data**:
```sql
INSERT INTO contact_messages (name, email, message) 
VALUES ('John Doe', 'john@example.com', 'Great product!');

SELECT * FROM contact_messages;
 id |   name   |      email       |     message      |         created_at         
----+----------+------------------+------------------+----------------------------
  1 | John Doe | john@example.com | Great product!   | 2024-01-14 10:32:00
```

---

## Migration Scripts

### Full Setup (Run Once)

**File**: `database/init.sql`

```sql
-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email 
  ON subscribers(email);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at 
  ON contact_messages(created_at DESC);
```

**Run**:
```bash
psql postgresql://postgres:password@localhost:5432/gonagri < database/init.sql
```

---

## Database Operations

### Connect to Database

```bash
psql postgresql://postgres:password@localhost:5432/gonagri
```

### View Subscribers

```sql
SELECT * FROM subscribers ORDER BY created_at DESC;
```

### View Contact Messages

```sql
SELECT * FROM contact_messages ORDER BY created_at DESC;
```

### Count Subscribers

```sql
SELECT COUNT(*) FROM subscribers;
```

### Delete Subscriber (if needed)

```sql
DELETE FROM subscribers WHERE email = 'user@example.com';
```

### Clear All Data (⚠️ Destructive)

```sql
-- Disable foreign key checks (if any)
DELETE FROM contact_messages;
DELETE FROM subscribers;

-- Reset auto-increment counters
ALTER SEQUENCE subscribers_id_seq RESTART WITH 1;
ALTER SEQUENCE contact_messages_id_seq RESTART WITH 1;
```

---

## Performance & Optimization

### Current Indexes

```sql
-- Unique index on email (unique constraint)
CREATE UNIQUE INDEX idx_subscribers_email ON subscribers(email);

-- Index on created_at for ordering
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);
```

### Query Performance

**Fast Queries** ✓:
```sql
-- Uses unique index
SELECT * FROM subscribers WHERE email = 'user@example.com';

-- Uses created_at index
SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 10;

-- Auto-increment lookup
SELECT * FROM subscribers WHERE id = 5;
```

**Slow Queries** ✗:
```sql
-- No index on name column (avoid if possible)
SELECT * FROM contact_messages WHERE name LIKE 'John%';

-- Full table scan if no matching index
SELECT * FROM contact_messages WHERE message LIKE '%keyword%';
```

### Adding Indexes (Future)

If queries become slow:

```sql
-- Index on contact_messages email (for filtering by email)
CREATE INDEX idx_contact_messages_email ON contact_messages(email);

-- Composite index if frequently filtering by multiple columns
CREATE INDEX idx_contact_messages_email_name 
  ON contact_messages(email, name);
```

---

## Backup & Restore

### Backup Database

```bash
pg_dump postgresql://postgres:password@localhost:5432/gonagri > backup.sql
```

### Restore Database

```bash
# Drop existing database (if needed)
psql -c "DROP DATABASE gonagri;"

# Create fresh database
psql -c "CREATE DATABASE gonagri;"

# Restore data
psql postgresql://postgres:password@localhost:5432/gonagri < backup.sql
```

### Backup to File (Compressed)

```bash
pg_dump --compress=9 \
  postgresql://postgres:password@localhost:5432/gonagri > backup.sql.gz
```

### Restore from Compressed

```bash
gunzip -c backup.sql.gz | \
  psql postgresql://postgres:password@localhost:5432/gonagri
```

---

## Connection Pooling

### Configuration

**File**: [src/config/db.ts](../src/config/db.ts)

```typescript
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: NODE_ENV === 'production' ? 20 : 10,      // Max connections
  idleTimeoutMillis: 30000,                       // Idle timeout
  connectionTimeoutMillis: 2000,                  // Connect timeout
});
```

**Settings**:
| Setting | Dev | Prod | Purpose |
|---------|-----|------|---------|
| max | 10 | 20 | Max concurrent connections |
| idleTimeoutMillis | 30s | 30s | Close idle connections |
| connectionTimeoutMillis | 2s | 2s | Timeout on new connection |

### Connection Health Check

On startup, the app:
1. Attempts to connect (3 retries)
2. Runs `SELECT 1` test query
3. Fails if unable to connect
4. Logs connection status

**Log Output**:
```
[DB] Connection attempt 1/3 failed: connect ECONNREFUSED
[DB] Connection attempt 2/3 failed: connect ECONNREFUSED
[DB] Connection attempt 3/3 failed: connect ECONNREFUSED
[Startup Error] Failed to connect to database after retries
```

---

## Error Handling

### Duplicate Email Error

When inserting a duplicate email (violates UNIQUE constraint):

**Error Code**: `23505` (Unique violation)

**Handled In**: [src/models/subscriber.model.ts](../src/models/subscriber.model.ts)

```typescript
catch (error: any) {
  if (error.code === '23505') {
    throw new ConflictError('Email is already subscribed to the waitlist');
  }
  throw error;
}
```

**Response to Client**:
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Email is already subscribed to the waitlist"
  }
}
```

### Connection Error

When database is unavailable:

**Error**: Connection refused, timeout, etc.

**Handled In**: [src/config/db.ts](../src/config/db.ts)

```typescript
testConnection().catch((err) => {
  console.error('[Startup Error]', err.message);
  process.exit(1);
});
```

**Behavior**: App exits immediately, signals to deployment system to restart

---

## Monitoring

### Connection Pool Status

To check active connections:

```sql
SELECT count(*) FROM pg_stat_activity;
```

To see connections by application:

```sql
SELECT datname, usename, application_name, state, count(*) 
FROM pg_stat_activity 
GROUP BY datname, usename, application_name, state;
```

### Query Performance

To enable query logging (warning: verbose):

```sql
-- Enable logging for slow queries (>1000ms)
SET log_min_duration_statement = 1000;
```

### Database Size

```sql
SELECT 
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) 
FROM pg_database 
WHERE pg_database.datname = 'gonagri';
```

### Table Sizes

```sql
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Disaster Recovery

### Common Issues

**Issue**: "Connection refused"
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Start PostgreSQL (varies by OS)
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: net start postgresql-x64-13
```

**Issue**: "Authentication failed"
```bash
# Verify DATABASE_URL format
# postgresql://user:password@host:port/dbname

# Check PostgreSQL user exists
psql -h localhost -U postgres -c "\du"

# Reset password
psql -h localhost -U postgres -c "ALTER USER postgres WITH PASSWORD 'newpassword';"
```

**Issue**: "Database doesn't exist"
```bash
# Create database
psql -U postgres -c "CREATE DATABASE gonagri;"

# Run migrations
psql -U postgres -d gonagri -f database/init.sql
```

**Issue**: "Tables don't exist"
```bash
# Run migrations
psql postgresql://user:password@localhost:5432/gonagri < database/init.sql
```

---

## Data Privacy

**Data Collected**:
- Emails (subscribers table)
- Names, emails, messages (contact_messages table)

**Data Retention**: Indefinite (unless policy changes)

**Backup Schedule**: Manual (implement automated backups in production)

**Encryption**: 
- At rest: Use PostgreSQL encryption or filesystem encryption
- In transit: Use HTTPS/TLS for all API calls
- Connection: DATABASE_URL uses encrypted connection in production
