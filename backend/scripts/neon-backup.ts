/**
 * Neon Backup Branch Creator
 * 
 * Creates a timestamped Neon branch from the main production branch
 * before running risky operations like schema migrations.
 * 
 * Neon branches are instant copy-on-write snapshots — they take zero time
 * and zero storage until data diverges. This makes them ideal as pre-migration
 * rollback points.
 * 
 * Prerequisites:
 *   - Install Neon CLI: npm install -g neonctl
 *   - Authenticate: neonctl auth
 *   - Or set NEON_API_KEY environment variable
 * 
 * Usage:
 *   npx ts-node scripts/neon-backup.ts
 *   npx ts-node scripts/neon-backup.ts --label pre-migration-v42
 * 
 * In package.json (runs before prisma migrate deploy):
 *   "premigrate:deploy": "ts-node scripts/neon-backup.ts"
 */

import { execSync } from 'child_process';

function createNeonBackupBranch(): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const labelArg = process.argv.find(arg => arg.startsWith('--label='));
  const label = labelArg ? labelArg.split('=')[1] : 'backup';
  const branchName = `${label}-${timestamp}`;

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  Neon Branch Backup');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Branch name: ${branchName}`);
  console.log(`  Parent:      main`);
  console.log(`  Timestamp:   ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Check if neonctl is installed
  try {
    execSync('neonctl --version', { stdio: 'pipe' });
  } catch {
    console.error('❌ neonctl is not installed or not in PATH.');
    console.error('');
    console.error('   Install it with:');
    console.error('     npm install -g neonctl');
    console.error('');
    console.error('   Then authenticate:');
    console.error('     neonctl auth');
    console.error('');
    console.error('   Or set NEON_API_KEY environment variable.');
    console.error('');
    console.error('   Skipping backup branch creation (non-fatal).');
    console.log('');
    // Non-fatal — don't block deployments if neonctl isn't available
    return;
  }

  try {
    console.log(`Creating backup branch "${branchName}"...`);
    
    const result = execSync(
      `neonctl branches create --name "${branchName}" --parent main`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    console.log('');
    console.log(`✅ Backup branch created: ${branchName}`);
    console.log('');
    console.log('   To restore from this branch:');
    console.log('   1. Go to Neon Dashboard → Branches');
    console.log(`   2. Find "${branchName}"`);
    console.log('   3. Copy its connection string');
    console.log('   4. Point your app to the backup branch temporarily');
    console.log('   5. Or use PITR from the Neon dashboard');
    console.log('');
    
    if (result.trim()) {
      console.log('   Neon CLI output:');
      console.log(`   ${result.trim()}`);
    }
  } catch (error: any) {
    console.error('');
    console.error(`⚠️  Failed to create backup branch: ${error.message}`);
    console.error('   This is non-fatal — deployment will continue.');
    console.error('   You can manually create a branch from the Neon dashboard.');
    console.error('');
    // Non-fatal — allow the migration to proceed
  }
}

createNeonBackupBranch();
