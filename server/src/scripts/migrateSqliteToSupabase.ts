import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  console.log('🚀 RescueRoute AI - SQLite to Supabase PostgreSQL Migration Tool');
  console.log('================================================================');

  const dbUrl = process.env.DATABASE_URL || '';
  const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');

  if (!isPostgres) {
    console.log('\n⚠️  Current DATABASE_URL is not configured for PostgreSQL/Supabase:');
    console.log(`   DATABASE_URL="${dbUrl}"\n`);
    console.log('📌 Instructions to connect Supabase:');
    console.log('   1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/jjcszxwhgbyyzvitcahd');
    console.log('   2. Navigate to: Project Settings -> Database');
    console.log('   3. Under "Connection string", select "URI" (or Connection Pooling "URI")');
    console.log('   4. Set DATABASE_URL in server/.env with your real database password:');
    console.log('      DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.jjcszxwhgbyyzvitcahd.supabase.co:5432/postgres?sslmode=require"');
    console.log('   5. Re-run: npm run db:migrate:supabase\n');
    console.log('ℹ️  Existing local SQLite database remains fully preserved at server/prisma/dev.db');
    return;
  }

  console.log('📡 Step 1: Exporting existing SQLite records...');
  const sqlitePrisma = new PrismaClient({
    datasources: {
      db: { url: 'file:./dev.db' }
    }
  });

  let users: any[] = [];
  let hospitals: any[] = [];
  let incidents: any[] = [];
  let routes: any[] = [];

  try {
    [users, hospitals, incidents, routes] = await Promise.all([
      sqlitePrisma.user.findMany(),
      sqlitePrisma.hospital.findMany(),
      sqlitePrisma.incident.findMany(),
      sqlitePrisma.routeHistory.findMany()
    ]);
    console.log(`   Found ${users.length} users, ${hospitals.length} hospitals, ${incidents.length} incidents, ${routes.length} route histories.`);
  } catch (err) {
    console.warn('   Could not read from local SQLite (file may be empty or newly created):', err);
  } finally {
    await sqlitePrisma.$disconnect();
  }

  console.log('\n📦 Step 2: Pushing Prisma schema to Supabase PostgreSQL...');
  try {
    execSync('npx prisma db push --schema=prisma/schema.postgresql.prisma', {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit'
    });
    console.log('   ✅ Schema successfully synchronized with Supabase PostgreSQL!');
  } catch (err) {
    console.error('   ❌ Failed to push schema to Supabase. Check database credentials and network access.');
    throw err;
  }

  console.log('\n📥 Step 3: Importing records into Supabase PostgreSQL...');
  const pgPrisma = new PrismaClient({
    datasources: {
      db: { url: dbUrl }
    }
  });

  try {
    for (const u of users) {
      await pgPrisma.user.upsert({
        where: { id: u.id },
        update: u,
        create: u
      });
    }

    for (const h of hospitals) {
      await pgPrisma.hospital.upsert({
        where: { id: h.id },
        update: h,
        create: h
      });
    }

    for (const inc of incidents) {
      await pgPrisma.incident.upsert({
        where: { id: inc.id },
        update: inc,
        create: inc
      });
    }

    for (const r of routes) {
      await pgPrisma.routeHistory.upsert({
        where: { id: r.id },
        update: r,
        create: r
      });
    }

    console.log('   ✅ All existing records preserved and migrated to Supabase successfully!');
  } catch (err) {
    console.error('   ❌ Error copying records to Supabase:', err);
    throw err;
  } finally {
    await pgPrisma.$disconnect();
  }

  console.log('\n🎉 Supabase PostgreSQL setup and migration complete!');
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
