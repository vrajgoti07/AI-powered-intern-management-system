/**
 * Neon Write Verification Script
 * 
 * Tests that data actually persists when written to Neon PostgreSQL.
 * Writes a temporary audit log entry, reads it back, then cleans up.
 * 
 * Usage:
 *   npx ts-node scripts/verify-neon-write.ts
 * 
 * What it checks:
 *   1. Connection to the database (pooled URL)
 *   2. SSL/sslmode is working
 *   3. Writes actually persist (not silently dropped)
 *   4. Reads return the written data
 *   5. Reports the current Neon endpoint and database name
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyNeonWrite(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL || '';
  const dbName = dbUrl.split('/').pop()?.split('?')[0] || 'unknown';
  const isNeon = dbUrl.includes('neon.tech');
  const isPooled = dbUrl.includes('-pooler');
  const endpoint = isNeon ? (dbUrl.match(/ep-[\w-]+/)?.[0] || 'unknown') : 'local';

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  Neon PostgreSQL Write Verification');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Database:  ${dbName}`);
  console.log(`  Endpoint:  ${endpoint}`);
  console.log(`  Neon:      ${isNeon}`);
  console.log(`  Pooled:    ${isPooled}`);
  console.log(`  SSL:       ${dbUrl.includes('sslmode=require') ? '✅ required' : '⚠️ NOT SET'}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  try {
    // Step 1: Connect
    console.log('1️⃣  Connecting to database...');
    await prisma.$connect();
    console.log('   ✅ Connected');

    // Step 2: Table counts
    console.log('');
    console.log('2️⃣  Checking table row counts...');
    const tables = [
      { name: 'users', query: prisma.user.count() },
      { name: 'departments', query: prisma.department.count() },
      { name: 'interns', query: prisma.intern.count() },
      { name: 'mentors', query: prisma.mentor.count() },
      { name: 'tasks', query: prisma.task.count() },
      { name: 'feedbacks', query: prisma.feedback.count() },
      { name: 'attendances', query: prisma.attendance.count() },
      { name: 'notifications', query: prisma.notification.count() },
    ];

    for (const table of tables) {
      try {
        const count = await table.query;
        const status = count > 0 ? '✅' : '⚠️';
        console.log(`   ${status} ${table.name}: ${count} rows`);
      } catch {
        console.log(`   ❌ ${table.name}: table may not exist`);
      }
    }

    // Step 3: Write test
    console.log('');
    console.log('3️⃣  Testing write persistence...');
    const testId = `neon-verify-${Date.now()}`;

    const written = await prisma.auditLog.create({
      data: {
        action: 'NEON_WRITE_TEST',
        entity: 'system',
        entityId: testId,
        metadata: {
          timestamp: new Date().toISOString(),
          purpose: 'Automated write verification',
          endpoint,
          dbName,
        },
      },
    });
    console.log(`   ✅ Write succeeded (id: ${written.id})`);

    // Step 4: Read back
    console.log('');
    console.log('4️⃣  Reading back written data...');
    const readBack = await prisma.auditLog.findUnique({ where: { id: written.id } });

    if (readBack && readBack.entityId === testId) {
      console.log('   ✅ Read-back matches — data is persisting correctly!');
    } else {
      console.error('   ❌ READ-BACK FAILED — data did not persist!');
      console.error('   This could mean:');
      console.error('     - Connection pooling is dropping writes');
      console.error('     - SSL/sslmode is misconfigured');
      console.error('     - You are connected to a different branch than expected');
      process.exit(1);
    }

    // Step 5: Cleanup
    await prisma.auditLog.delete({ where: { id: written.id } });
    console.log('   🧹 Test row cleaned up');

    // Step 6: Raw SQL verification
    console.log('');
    console.log('5️⃣  Raw SQL database info...');
    const dbInfo = await prisma.$queryRaw<[{ current_database: string; current_user: string; version: string }]>`
      SELECT current_database(), current_user, version()
    `;
    console.log(`   Database: ${dbInfo[0]?.current_database}`);
    console.log(`   User:     ${dbInfo[0]?.current_user}`);
    console.log(`   Version:  ${dbInfo[0]?.version?.split(',')[0]}`);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  ✅ ALL CHECKS PASSED — Neon is working correctly');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
  } catch (error: any) {
    console.error('');
    console.error('❌ VERIFICATION FAILED:', error.message);

    if (error.message?.includes('ssl') || error.message?.includes('SSL')) {
      console.error('');
      console.error('💡 Fix: Add ?sslmode=require to your DATABASE_URL');
    }
    if (error.code === 'P1001') {
      console.error('');
      console.error('💡 Fix: Database is unreachable — check your connection string');
      console.error('   and ensure the Neon project is not paused.');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNeonWrite();
