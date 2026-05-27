import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma';
import { beforeAll, afterAll } from 'vitest';

// Force environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';

beforeAll(async () => {
  try {
    const prismaSchemaPath = path.join(__dirname, '../../prisma/schema.prisma');
    // Initialize/reset test database
    execSync(`npx.cmd prisma db push --schema="${prismaSchemaPath}" --accept-data-loss --force-reset`, {
      env: {
        ...process.env,
        DATABASE_URL: 'file:./test.db',
      },
      stdio: 'pipe',
    });
  } catch (error) {
    console.error('Failed to run Prisma db push for testing:', error);
    throw error;
  }
});

afterAll(async () => {
  // Disconnect prisma client
  await prisma.$disconnect();

  // Cleanup SQLite files
  const dbPath = path.join(__dirname, '../../prisma/test.db');
  const journalPath = `${dbPath}-journal`;

  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {
      // Ignore if currently locked
    }
  }

  if (fs.existsSync(journalPath)) {
    try {
      fs.unlinkSync(journalPath);
    } catch (e) {
      // Ignore
    }
  }
});
