import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// SAFETY GUARDS — Prevent accidental data destruction in production
// ═══════════════════════════════════════════════════════════════

const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL || '';
const isNeon = DATABASE_URL.includes('neon.tech');
const FORCE_SEED = process.env.FORCE_SEED === 'true';

if (NODE_ENV === 'production') {
  console.error('🚫 BLOCKED: Database seeding is not allowed in production!');
  console.error('   Set NODE_ENV=development or NODE_ENV=test to run seeds.');
  process.exit(1);
}

if (isNeon && !FORCE_SEED) {
  console.error('🚫 BLOCKED: Refusing to seed against a Neon cloud database.');
  console.error('   Your DATABASE_URL points to neon.tech — this would modify live data.');
  console.error('   If you REALLY mean to do this, set FORCE_SEED=true');
  console.error(`   Current DB: ${DATABASE_URL.split('/').pop()?.split('?')[0] || 'unknown'}`);
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

let seedOrgId: string | undefined;

/**
 * Upsert a user by email — safe to run repeatedly without data loss.
 */
async function upsertUser(data: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  departmentId?: string;
  mentorDepartmentId?: string;
}) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      role: data.role,
      isActive: true,
      isEmailVerified: true,
      ...(data.departmentId && { departmentId: data.departmentId }),
      ...(data.mentorDepartmentId && { mentorDepartmentId: data.mentorDepartmentId }),
      ...(seedOrgId && { organizationId: seedOrgId }),
    },
    create: {
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role,
      isActive: true,
      isEmailVerified: true,
      ...(data.departmentId && { departmentId: data.departmentId }),
      ...(data.mentorDepartmentId && { mentorDepartmentId: data.mentorDepartmentId }),
      ...(seedOrgId && { organizationId: seedOrgId }),
    },
  });
}

async function main() {
  console.log('🌱 Starting safe (upsert-based) database seeding...');
  console.log(`   Environment: ${NODE_ENV}`);
  console.log(`   Neon: ${isNeon}`);
  console.log(`   Database: ${DATABASE_URL.split('/').pop()?.split('?')[0] || 'unknown'}`);

  // 0. Create Default Organization (Multi-Tenant Foundation)
  console.log('Creating default organization...');
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: process.env.DEFAULT_ORG_SLUG || 'default' },
    update: {
      name: process.env.DEFAULT_ORG_NAME || 'InternFlow',
      isActive: true,
    },
    create: {
      name: process.env.DEFAULT_ORG_NAME || 'InternFlow',
      slug: process.env.DEFAULT_ORG_SLUG || 'default',
      primaryColor: '#6366F1',
      plan: 'ENTERPRISE',
      maxInterns: 999,
      maxMentors: 99,
      isActive: true,
    },
  });
  console.log(`✅ Default organization upserted: ${defaultOrg.name} (${defaultOrg.slug})`);

  seedOrgId = defaultOrg.id;

  // 1. Create Department Head Users (upsert by email)
  console.log('Creating Department Head users...');

  const engHeadUser = await upsertUser({
    email: 'vikram@internmanagement.com',
    password: await hashPassword('head123'),
    name: 'Dr. Vikram Seth',
    role: UserRole.DEPARTMENT_HEAD,
  });

  const dsnHeadUser = await upsertUser({
    email: 'rohan@internmanagement.com',
    password: await hashPassword('head123'),
    name: 'Rohan Bakshi',
    role: UserRole.DEPARTMENT_HEAD,
  });

  const mktHeadUser = await upsertUser({
    email: 'meera@internmanagement.com',
    password: await hashPassword('head123'),
    name: 'Meera Oberoi',
    role: UserRole.DEPARTMENT_HEAD,
  });

  const hrHeadUser = await upsertUser({
    email: 'neha@internmanagement.com',
    password: await hashPassword('head123'),
    name: 'Neha Kapoor',
    role: UserRole.DEPARTMENT_HEAD,
  });

  console.log('✅ Department Head users upserted');

  // 2. Create Departments (upsert by unique code)
  console.log('Creating departments...');

  const engDept = await prisma.department.upsert({
    where: { code: 'ENG' },
    update: { name: 'Engineering', headId: engHeadUser.id, colorTheme: 'indigo', isActive: true },
    create: {
      name: 'Engineering',
      code: 'ENG',
      headId: engHeadUser.id,
      colorTheme: 'indigo',
      description: 'Software development, architecture, QA, and AI engineering team',
      isActive: true,
    },
  });

  const dsnDept = await prisma.department.upsert({
    where: { code: 'DSN' },
    update: { name: 'Design', headId: dsnHeadUser.id, colorTheme: 'purple', isActive: true },
    create: {
      name: 'Design',
      code: 'DSN',
      headId: dsnHeadUser.id,
      colorTheme: 'purple',
      description: 'UI/UX interface design, branding, and product experience team',
      isActive: true,
    },
  });

  const mktDept = await prisma.department.upsert({
    where: { code: 'MKT' },
    update: { name: 'Marketing', headId: mktHeadUser.id, colorTheme: 'pink', isActive: true },
    create: {
      name: 'Marketing',
      code: 'MKT',
      headId: mktHeadUser.id,
      colorTheme: 'pink',
      description: 'Digital marketing, growth hacking, and communications team',
      isActive: true,
    },
  });

  const hrDept = await prisma.department.upsert({
    where: { code: 'HRD' },
    update: { name: 'HR', headId: hrHeadUser.id, colorTheme: 'emerald', isActive: true },
    create: {
      name: 'HR',
      code: 'HRD',
      headId: hrHeadUser.id,
      colorTheme: 'emerald',
      description: 'Human resources, talent onboarding, and culture management',
      isActive: true,
    },
  });

  await prisma.department.upsert({
    where: { code: 'AIML' },
    update: { isActive: true },
    create: {
      name: 'AIML',
      code: 'AIML',
      colorTheme: 'blue',
      description: 'Artificial Intelligence and Machine Learning research and development',
      isActive: true,
    },
  });

  await prisma.department.upsert({
    where: { code: 'WDEV' },
    update: { isActive: true },
    create: {
      name: 'Web Development',
      code: 'WDEV',
      colorTheme: 'sky',
      description: 'Frontend, backend, and full-stack web applications development',
      isActive: true,
    },
  });

  await prisma.department.upsert({
    where: { code: 'DSCI' },
    update: { isActive: true },
    create: {
      name: 'Data Science',
      code: 'DSCI',
      colorTheme: 'teal',
      description: 'Data analytics, business intelligence, and statistical modeling',
      isActive: true,
    },
  });

  await prisma.department.upsert({
    where: { code: 'CYBR' },
    update: { isActive: true },
    create: {
      name: 'Cybersecurity',
      code: 'CYBR',
      colorTheme: 'rose',
      description: 'Security audits, penetration testing, and zero-trust engineering',
      isActive: true,
    },
  });

  console.log('✅ Departments upserted');

  // 3. Create Projects (upsert-safe: check if exists first)
  console.log('Creating projects...');
  const projectSeeds = [
    { title: 'InternFlow Portal Redesign', description: 'Rebuilding the core frontend client system', departmentId: engDept.id },
    { title: 'AI Copilot Engine v2', description: 'Upgrading the LLM service layer capabilities', departmentId: engDept.id },
    { title: 'UI Component Library', description: 'Building custom reusable shadcn assets', departmentId: dsnDept.id },
    { title: 'Q2 Internship Outreach', description: 'Promoting recruitment cycles across campuses', departmentId: mktDept.id },
    { title: 'Onboarding Automation v1', description: 'Automating marksheets and document verification', departmentId: hrDept.id },
  ];

  for (const proj of projectSeeds) {
    const existing = await prisma.project.findFirst({ where: { title: proj.title } });
    if (!existing) {
      await prisma.project.create({ data: proj });
    }
  }
  console.log('✅ Projects seeded (skip-if-exists)');

  // 4. Log department head assignment activities (skip-if-exists)
  console.log('Logging head assignments...');
  const activitySeeds = [
    { departmentId: engDept.id, activityType: 'HEAD_ASSIGNED', description: 'Dr. Vikram Seth assigned as Head of Engineering', performedBy: 'System Admin' },
    { departmentId: dsnDept.id, activityType: 'HEAD_ASSIGNED', description: 'Rohan Bakshi assigned as Head of Design', performedBy: 'System Admin' },
    { departmentId: mktDept.id, activityType: 'HEAD_ASSIGNED', description: 'Meera Oberoi assigned as Head of Marketing', performedBy: 'System Admin' },
    { departmentId: hrDept.id, activityType: 'HEAD_ASSIGNED', description: 'Neha Kapoor assigned as Head of HR', performedBy: 'System Admin' },
  ];

  for (const act of activitySeeds) {
    const existing = await prisma.departmentActivity.findFirst({
      where: { departmentId: act.departmentId, activityType: act.activityType },
    });
    if (!existing) {
      await prisma.departmentActivity.create({ data: act });
    }
  }
  console.log('✅ Activities logged (skip-if-exists)');

  // 5. Create HR & Admin Users
  console.log('Creating HR users...');

  await upsertUser({
    email: 'hr@internmanagement.com',
    password: await hashPassword('HRPass123!'),
    name: 'Admin User',
    role: UserRole.HR,
  });

  await upsertUser({
    email: 'hr.internflow@gmail.com',
    password: await hashPassword('hr@123456789'),
    name: 'HR Admin',
    role: UserRole.HR,
  });

  console.log('Creating Super Admin...');
  await upsertUser({
    email: 'superadmin@intern.com',
    password: await hashPassword('admin123'),
    name: 'Super Admin',
    role: UserRole.SUPER_ADMIN,
  });

  // 6. Create Mentor
  console.log('Creating Mentor...');
  const mentorUser = await upsertUser({
    email: 'mentor@internmanagement.com',
    password: await hashPassword('mentor123'),
    name: 'Default Mentor',
    role: UserRole.MENTOR,
    mentorDepartmentId: engDept.id,
  });

  let mentor = await prisma.mentor.findUnique({ where: { userId: mentorUser.id } });
  if (!mentor) {
    mentor = await prisma.mentor.create({
      data: {
        userId: mentorUser.id,
        departmentId: engDept.id,
        expertise: ['React', 'Node.js', 'PostgreSQL'],
      },
    });
  }

  // 7. Create Intern Users & Profiles (upsert-safe)
  console.log('Creating Interns...');

  const internSeeds = [
    {
      email: 'intern@internmanagement.com', name: 'Default Intern',
      score: 85, attendance: 95, onboardingStep: 6, verificationStatus: 'APPROVED',
      allCompleted: true,
    },
    {
      email: 'vrajg072@gmail.com', name: 'Vraj Goti',
      score: 90, attendance: 98, onboardingStep: 6, verificationStatus: 'APPROVED',
      allCompleted: true,
    },
    {
      email: 'vrajgoti07@gmail.com', name: 'Vraj Goti (Alternative)',
      score: 92, attendance: 99, onboardingStep: 4, verificationStatus: 'UNDER_REVIEW',
      allCompleted: false,
    },
  ];

  for (const seed of internSeeds) {
    const internUser = await upsertUser({
      email: seed.email,
      password: await hashPassword('intern123'),
      name: seed.name,
      role: UserRole.INTERN,
      departmentId: engDept.id,
    });

    let internProfile = await prisma.intern.findUnique({ where: { userId: internUser.id } });
    if (!internProfile) {
      internProfile = await prisma.intern.create({
        data: {
          userId: internUser.id,
          mentorId: mentor.id,
          departmentId: engDept.id,
          college: 'Test University',
          joinedDate: new Date(),
          status: 'ACTIVE',
          score: seed.score,
          attendance: seed.attendance,
        },
      });
    }

    // Upsert onboarding progress
    await prisma.onboardingProgress.upsert({
      where: { internId: internProfile.id },
      update: {
        currentStep: seed.onboardingStep,
        verificationStatus: seed.verificationStatus,
      },
      create: {
        internId: internProfile.id,
        currentStep: seed.onboardingStep,
        offerAccepted: true,
        personalInfoCompleted: true,
        educationCompleted: true,
        emergencyCompleted: true,
        documentsCompleted: seed.allCompleted,
        agreementAccepted: seed.allCompleted,
        finalSubmitted: seed.allCompleted,
        verificationStatus: seed.verificationStatus,
      },
    });
  }

  console.log('✅ Default users & onboarding progress successfully seeded (upsert-safe)');
  console.log('\n🎉 Database seeding completed — NO existing data was deleted!');
  console.log('\n📝 Seed Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('HR Admin Default Account:');
  console.log('  Email: hr@internmanagement.com');
  console.log('  Password: HRPass123!');
  console.log('Frictionless Demo HR Account:');
  console.log('  Email: hr.internflow@gmail.com');
  console.log('  Password: hr@123456789');
  console.log('Department Head (ENG):');
  console.log('  Email: vikram@internmanagement.com');
  console.log('  Password: head123');
  console.log('Seeded Intern Account (vrajg072):');
  console.log('  Email: vrajg072@gmail.com');
  console.log('  Password: intern123');
  console.log('Seeded Intern Account (vrajgoti07):');
  console.log('  Email: vrajgoti07@gmail.com');
  console.log('  Password: intern123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 8. Create Badges (Gamification)
  console.log('Seeding 12 Badge Templates...');
  const badgesData = [
    {
      name: 'Task Rookie',
      description: 'Awarded for completing your first project task deliverable.',
      iconEmoji: '🚀',
      category: 'TASKS',
      requirement: { type: 'task_count', threshold: 1 }
    },
    {
      name: 'Task Titan',
      description: 'Awarded for successfully completing 10 project task deliverables.',
      iconEmoji: '🏆',
      category: 'TASKS',
      requirement: { type: 'task_count', threshold: 10 }
    },
    {
      name: 'Speed Runner',
      description: 'Awarded for completing a task in less than 12 hours from assignment.',
      iconEmoji: '⚡',
      category: 'TASKS',
      requirement: { type: 'speed_completion', maxHours: 12 }
    },
    {
      name: 'Perfectionist',
      description: 'Awarded for receiving a perfect 10/10 rating score on any task review.',
      iconEmoji: '💯',
      category: 'TASKS',
      requirement: { type: 'perfect_task_score', score: 10 }
    },
    {
      name: 'Early Bird',
      description: 'Awarded for checking in before 9:00 AM on a workday.',
      iconEmoji: '🌅',
      category: 'ATTENDANCE',
      requirement: { type: 'early_checkin', beforeTime: '09:00' }
    },
    {
      name: 'Attendance Streak',
      description: 'Awarded for maintaining a 5-day consecutive attendance streak.',
      iconEmoji: '🔥',
      category: 'ATTENDANCE',
      requirement: { type: 'attendance_streak', threshold: 5 }
    },
    {
      name: 'Dedication',
      description: 'Awarded for maintaining a 20-day consecutive attendance streak.',
      iconEmoji: '🌟',
      category: 'ATTENDANCE',
      requirement: { type: 'attendance_streak', threshold: 20 }
    },
    {
      name: 'Standup Star',
      description: 'Awarded for submitting 5 daily standup reports.',
      iconEmoji: '📝',
      category: 'COMMUNITY',
      requirement: { type: 'standup_count', threshold: 5 }
    },
    {
      name: 'Chatterbox',
      description: 'Awarded for active collaboration with 50 chat messages sent.',
      iconEmoji: '💬',
      category: 'COMMUNITY',
      requirement: { type: 'chat_messages_count', threshold: 50 }
    },
    {
      name: 'Feedback Champion',
      description: 'Awarded for receiving a positive mentor feedback rating score >= 8.',
      iconEmoji: '⭐',
      category: 'COMMUNITY',
      requirement: { type: 'feedback_score', minScore: 8 }
    },
    {
      name: 'Onboarded',
      description: 'Awarded for completing all onboarding profile registrations and files.',
      iconEmoji: '🎓',
      category: 'MILESTONES',
      requirement: { type: 'onboarding_approved' }
    },
    {
      name: 'High Achiever',
      description: 'Awarded for reaching level 5 with over 2000 total XP earned.',
      iconEmoji: '👑',
      category: 'MILESTONES',
      requirement: { type: 'level_reached', level: 5 }
    }
  ];

  for (const badge of badgesData) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {
        description: badge.description,
        iconEmoji: badge.iconEmoji,
        category: badge.category,
        requirement: badge.requirement as any
      },
      create: {
        name: badge.name,
        description: badge.description,
        iconEmoji: badge.iconEmoji,
        category: badge.category,
        requirement: badge.requirement as any
      }
    });
  }
  console.log('✅ 12 Badges templates upserted successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
