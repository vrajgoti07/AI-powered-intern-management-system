import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database cleanup and seeding...');

  // Delete all existing data in correct dependency order
  console.log('Cleaning up database tables...');
  await prisma.departmentActivity.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.leave.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.taskComment.deleteMany({});
  await prisma.taskFile.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.onboardingProgress.deleteMany({});
  await prisma.intern.deleteMany({});
  await prisma.mentor.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
  console.log('✅ All tables cleaned');

  // 1. Create Department Head Users first
  console.log('Creating Department Head users...');
  
  const engHeadUser = await prisma.user.create({
    data: {
      email: 'vikram@internmanagement.com',
      password: await hashPassword('head123'),
      name: 'Dr. Vikram Seth',
      role: UserRole.DEPARTMENT_HEAD,
      isActive: true,
      isEmailVerified: true,
    },
  });

  const dsnHeadUser = await prisma.user.create({
    data: {
      email: 'rohan@internmanagement.com',
      password: await hashPassword('head123'),
      name: 'Rohan Bakshi',
      role: UserRole.DEPARTMENT_HEAD,
      isActive: true,
      isEmailVerified: true,
    },
  });

  const mktHeadUser = await prisma.user.create({
    data: {
      email: 'meera@internmanagement.com',
      password: await hashPassword('head123'),
      name: 'Meera Oberoi',
      role: UserRole.DEPARTMENT_HEAD,
      isActive: true,
      isEmailVerified: true,
    },
  });

  const hrHeadUser = await prisma.user.create({
    data: {
      email: 'neha@internmanagement.com',
      password: await hashPassword('head123'),
      name: 'Neha Kapoor',
      role: UserRole.DEPARTMENT_HEAD,
      isActive: true,
      isEmailVerified: true,
    },
  });

  console.log('✅ Department Head users created');

  // 2. Create Departments linked to Head Users
  console.log('Creating departments...');
  
  const engDept = await prisma.department.create({
    data: {
      name: 'Engineering',
      code: 'ENG',
      headId: engHeadUser.id,
      colorTheme: 'indigo',
      description: 'Software development, architecture, QA, and AI engineering team',
      isActive: true,
    },
  });

  const dsnDept = await prisma.department.create({
    data: {
      name: 'Design',
      code: 'DSN',
      headId: dsnHeadUser.id,
      colorTheme: 'purple',
      description: 'UI/UX interface design, branding, and product experience team',
      isActive: true,
    },
  });

  const mktDept = await prisma.department.create({
    data: {
      name: 'Marketing',
      code: 'MKT',
      headId: mktHeadUser.id,
      colorTheme: 'pink',
      description: 'Digital marketing, growth hacking, and communications team',
      isActive: true,
    },
  });

  const hrDept = await prisma.department.create({
    data: {
      name: 'HR',
      code: 'HRD',
      headId: hrHeadUser.id,
      colorTheme: 'emerald',
      description: 'Human resources, talent onboarding, and culture management',
      isActive: true,
    },
  });

  console.log('✅ Departments created');

  // 3. Create Projects for Departments
  console.log('Creating projects...');
  await prisma.project.create({
    data: { title: 'InternFlow Portal Redesign', description: 'Rebuilding the core frontend client system', departmentId: engDept.id },
  });
  await prisma.project.create({
    data: { title: 'AI Copilot Engine v2', description: 'Upgrading the LLM service layer capabilities', departmentId: engDept.id },
  });
  await prisma.project.create({
    data: { title: 'UI Component Library', description: 'Building custom reusable shadcn assets', departmentId: dsnDept.id },
  });
  await prisma.project.create({
    data: { title: 'Q2 Internship Outreach', description: 'Promoting recruitment cycles across campuses', departmentId: mktDept.id },
  });
  await prisma.project.create({
    data: { title: 'Onboarding Automation v1', description: 'Automating marksheets and document verification', departmentId: hrDept.id },
  });
  console.log('✅ Projects seeded');

  // 4. Create Department Head Assignment Logs
  console.log('Logging head assignments...');
  await prisma.departmentActivity.create({
    data: { departmentId: engDept.id, activityType: 'HEAD_ASSIGNED', description: 'Dr. Vikram Seth assigned as Head of Engineering', performedBy: 'System Admin' },
  });
  await prisma.departmentActivity.create({
    data: { departmentId: dsnDept.id, activityType: 'HEAD_ASSIGNED', description: 'Rohan Bakshi assigned as Head of Design', performedBy: 'System Admin' },
  });
  await prisma.departmentActivity.create({
    data: { departmentId: mktDept.id, activityType: 'HEAD_ASSIGNED', description: 'Meera Oberoi assigned as Head of Marketing', performedBy: 'System Admin' },
  });
  await prisma.departmentActivity.create({
    data: { departmentId: hrDept.id, activityType: 'HEAD_ASSIGNED', description: 'Neha Kapoor assigned as Head of HR', performedBy: 'System Admin' },
  });
  console.log('✅ Activities logged');

  // 5. Create HR User
  console.log('Creating HR users...');
  
  // Standard system admin
  await prisma.user.create({
    data: {
      email: 'hr@internmanagement.com',
      password: await hashPassword('HRPass123!'),
      name: 'Admin User',
      role: UserRole.HR,
      isActive: true,
      isEmailVerified: true,
    },
  });

  // Frictionless login admin
  await prisma.user.create({
    data: {
      email: 'hr.internflow@gmail.com',
      password: await hashPassword('hr@123456789'),
      name: 'HR Admin',
      role: UserRole.HR,
      isActive: true,
      isEmailVerified: true,
    },
  });

  // 6. Create Mentor User
  console.log('Creating Mentor...');
  const mentorUser = await prisma.user.create({
    data: {
      email: 'mentor@internmanagement.com',
      password: await hashPassword('mentor123'),
      name: 'Default Mentor',
      role: UserRole.MENTOR,
      mentorDepartmentId: engDept.id,
      isActive: true,
      isEmailVerified: true,
    },
  });

  const mentor = await prisma.mentor.create({
    data: {
      userId: mentorUser.id,
      departmentId: engDept.id,
      expertise: ['React', 'Node.js', 'PostgreSQL'],
    },
  });

  await prisma.departmentActivity.create({
    data: { departmentId: engDept.id, activityType: 'MENTOR_ASSIGNED', description: 'Default Mentor assigned to Engineering', performedBy: 'HR Admin' },
  });

  // 7. Create Intern Users & Profiles
  console.log('Creating Interns...');
  
  // Intern 1: Default Intern
  const internUser = await prisma.user.create({
    data: {
      email: 'intern@internmanagement.com',
      password: await hashPassword('intern123'),
      name: 'Default Intern',
      role: UserRole.INTERN,
      departmentId: engDept.id,
      isActive: true,
      isEmailVerified: true,
    },
  });

  const defaultIntern = await prisma.intern.create({
    data: {
      userId: internUser.id,
      mentorId: mentor.id,
      departmentId: engDept.id,
      college: 'Test University',
      joinedDate: new Date(),
      status: 'ACTIVE',
      score: 85,
      attendance: 95,
    },
  });

  await prisma.onboardingProgress.create({
    data: {
      internId: defaultIntern.id,
      currentStep: 6,
      offerAccepted: true,
      personalInfoCompleted: true,
      educationCompleted: true,
      emergencyCompleted: true,
      documentsCompleted: true,
      agreementAccepted: true,
      finalSubmitted: true,
      verificationStatus: 'APPROVED',
    },
  });

  // Intern 2: vrajg072
  const userVraj072 = await prisma.user.create({
    data: {
      email: 'vrajg072@gmail.com',
      password: await hashPassword('intern123'),
      name: 'Vraj Goti',
      role: UserRole.INTERN,
      departmentId: engDept.id,
      isActive: true,
      isEmailVerified: true,
    },
  });

  const internVraj072 = await prisma.intern.create({
    data: {
      userId: userVraj072.id,
      mentorId: mentor.id,
      departmentId: engDept.id,
      college: 'Test University',
      joinedDate: new Date(),
      status: 'ACTIVE',
      score: 90,
      attendance: 98,
    },
  });

  await prisma.onboardingProgress.create({
    data: {
      internId: internVraj072.id,
      currentStep: 6,
      offerAccepted: true,
      personalInfoCompleted: true,
      educationCompleted: true,
      emergencyCompleted: true,
      documentsCompleted: true,
      agreementAccepted: true,
      finalSubmitted: true,
      verificationStatus: 'APPROVED',
    },
  });

  // Intern 3: vrajgoti07
  const userVrajgoti07 = await prisma.user.create({
    data: {
      email: 'vrajgoti07@gmail.com',
      password: await hashPassword('intern123'),
      name: 'Vraj Goti (Alternative)',
      role: UserRole.INTERN,
      departmentId: engDept.id,
      isActive: true,
      isEmailVerified: true,
    },
  });

  const internVrajgoti07 = await prisma.intern.create({
    data: {
      userId: userVrajgoti07.id,
      mentorId: mentor.id,
      departmentId: engDept.id,
      college: 'Test University',
      joinedDate: new Date(),
      status: 'ACTIVE',
      score: 92,
      attendance: 99,
    },
  });

  await prisma.onboardingProgress.create({
    data: {
      internId: internVrajgoti07.id,
      currentStep: 4,
      offerAccepted: true,
      personalInfoCompleted: true,
      educationCompleted: true,
      emergencyCompleted: true,
      documentsCompleted: false,
      agreementAccepted: false,
      finalSubmitted: false,
      verificationStatus: 'UNDER_REVIEW',
    },
  });

  await prisma.departmentActivity.create({
    data: { departmentId: engDept.id, activityType: 'INTERN_TRANSFERRED', description: 'Seeded default interns transferred to Engineering', performedBy: 'HR Admin' },
  });

  console.log('✅ Default users & onboarding progress successfully seeded');
  console.log('\n🎉 Clean database seeding completed successfully!');
  console.log('\n📝 New Clean Credentials:');
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
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
