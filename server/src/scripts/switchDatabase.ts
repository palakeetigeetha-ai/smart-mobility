import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const PRISMA_DIR = path.join(__dirname, '../../prisma');
const ACTIVE_SCHEMA = path.join(PRISMA_DIR, 'schema.prisma');
const POSTGRES_SCHEMA = path.join(PRISMA_DIR, 'schema.postgresql.prisma');
const SQLITE_SCHEMA = path.join(PRISMA_DIR, 'schema.sqlite.prisma');

export function detectProvider(): 'postgresql' | 'sqlite' {
  const targetArg = process.argv[2]?.toLowerCase();
  if (targetArg === 'postgresql' || targetArg === 'postgres' || targetArg === 'supabase') {
    return 'postgresql';
  }
  if (targetArg === 'sqlite') {
    return 'sqlite';
  }

  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    return 'postgresql';
  }
  return 'sqlite';
}

export function syncSchema() {
  const provider = detectProvider();
  console.log(`🔍 Detected database target: ${provider.toUpperCase()}`);

  const sourceSchema = provider === 'postgresql' ? POSTGRES_SCHEMA : SQLITE_SCHEMA;

  if (!fs.existsSync(sourceSchema)) {
    console.error(`❌ Source schema not found: ${sourceSchema}`);
    process.exit(1);
  }

  const content = fs.readFileSync(sourceSchema, 'utf-8');
  fs.writeFileSync(ACTIVE_SCHEMA, content, 'utf-8');
  console.log(`✅ Synced active prisma/schema.prisma to provider: ${provider}`);

  try {
    console.log('🔄 Running prisma generate...');
    execSync('npx prisma generate', {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit'
    });
    console.log('✨ Prisma Client successfully regenerated for ' + provider);
  } catch (err) {
    console.warn('⚠️ Warning: Prisma generate encountered an issue:', err);
  }
}

if (require.main === module) {
  syncSchema();
}
