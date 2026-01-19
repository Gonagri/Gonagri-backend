import app from './app';
import { PORT, NODE_ENV } from './config/env';

const server = app.listen(PORT, '0.0.0.0', () => {
  const url = `http://localhost:${PORT}`;
  console.log('\n' + '='.repeat(50));
  console.log(`✓ Server is running`);
  console.log(`  URL: ${url}`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Environment: ${NODE_ENV}`);
  console.log('='.repeat(50) + '\n');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
