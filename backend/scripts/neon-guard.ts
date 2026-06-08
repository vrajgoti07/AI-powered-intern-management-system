/**
 * Neon Database Guard
 * 
 * Prevents destructive Prisma CLI commands from running against production
 * or Neon cloud databases. Import this as a pre-script or run it directly.
 * 
 * Blocked commands (when pointed at production/Neon):
 *   - prisma migrate reset
 *   - prisma db push --force-reset
 *   - prisma migrate dev (in production only — allowed in development)
 * 
 * Usage in package.json:
 *   "prisma:migrate:safe": "ts-node scripts/neon-guard.ts && prisma migrate deploy"
 */

const args = process.argv.slice(2).join(' ');
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL || '';
const isProduction = NODE_ENV === 'production';
const isNeon = DATABASE_URL.includes('neon.tech');
const dbName = DATABASE_URL.split('/').pop()?.split('?')[0] || 'unknown';

// Commands that are ALWAYS dangerous against live databases
const ALWAYS_DANGEROUS = [
  'migrate reset',
  'db push --force-reset',
];

// Commands that are dangerous only in production
const PROD_DANGEROUS = [
  'migrate dev',
];

function checkGuard(): void {
  const target = isNeon ? `Neon (${dbName})` : `production database`;

  // Block always-dangerous commands on production or Neon
  if (isProduction || isNeon) {
    for (const cmd of ALWAYS_DANGEROUS) {
      if (args.includes(cmd)) {
        console.error('');
        console.error(`🚫 BLOCKED: "prisma ${cmd}" is forbidden against ${target}!`);
        console.error('');
        console.error('   This command would DESTROY ALL DATA in the database.');
        console.error('   Use "prisma migrate deploy" for production migrations.');
        console.error('');
        console.error('   If you need to reset a DEV branch, point DATABASE_URL');
        console.error('   to your Neon dev branch and set NODE_ENV=development.');
        console.error('');
        process.exit(1);
      }
    }
  }

  // Block dev-only commands in production
  if (isProduction) {
    for (const cmd of PROD_DANGEROUS) {
      if (args.includes(cmd)) {
        console.error('');
        console.error(`🚫 BLOCKED: "prisma ${cmd}" is forbidden in production!`);
        console.error('');
        console.error('   "migrate dev" is interactive and creates new migrations.');
        console.error('   Use "prisma migrate deploy" to apply existing migrations.');
        console.error('');
        process.exit(1);
      }
    }
  }

  // If we reach here, the command is allowed
  if (args) {
    console.log(`✅ Neon guard passed: "${args}" is allowed (ENV: ${NODE_ENV}, Neon: ${isNeon})`);
  }
}

checkGuard();

export { checkGuard };
