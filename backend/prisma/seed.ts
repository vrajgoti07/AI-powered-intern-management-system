import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database cleanup and seeding...');

  // Delete all existing data in correct dependency order
  console.log('Cleaning up database tables...');
  await prisma.leave.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.taskComment.deleteMany({});
  await prisma.taskFile.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.intern.deleteMany({});
  await prisma.mentor.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
  console.log('✅ All tables cleaned');

  // Create Departments
  console.log('Creating departments...');
  await prisma.department.create({
    data: {
      name: 'Engineering',
      head: 'Dr. Vikram Seth',
      color: 'indigo',
      description: 'Software development and engineering team',
    },
  });

  await prisma.department.create({
    data: {
      name: 'Design',
      head: 'Rohan Bakshi',
      color: 'purple',
      description: 'UI/UX and product design team',
    },
  });

  await prisma.department.create({
    data: {
      name: 'Marketing',
      head: 'Meera Oberoi',
      color: 'pink',
      description: 'Marketing and growth team',
    },
  });

  await prisma.department.create({
    data: {
      name: 'HR',
      head: 'Neha Kapoor',
      color: 'emerald',
      description: 'Human resources and talent management',
    },
  });

  console.log('✅ Departments created');

  // Create HR User
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

  // Create Mentor User
  console.log('Creating Mentor...');
  const mentorUser = await prisma.user.create({
    data: {
      email: 'mentor@internmanagement.com',
      password: await hashPassword('mentor123'),
      name: 'Default Mentor',
      role: UserRole.MENTOR,
      isActive: true,
      isEmailVerified: true,
    },
  });

  const mentor = await prisma.mentor.create({
    data: {
      userId: mentorUser.id,
      departmentId: (await prisma.department.findFirst({ where: { name: 'Engineering' } }))!.id,
      expertise: ['React', 'Node.js'],
    },
  });

  // Create Intern User
  console.log('Creating Interns...');
  const internUser = await prisma.user.create({
    data: {
      email: 'intern@internmanagement.com',
      password: await hashPassword('intern123'),
      name: 'Default Intern',
      role: UserRole.INTERN,
      isActive: true,
      isEmailVerified: true,
    },
  });

  const seededIntern = await prisma.intern.create({
    data: {
      userId: internUser.id,
      mentorId: mentor.id,
      departmentId: (await prisma.department.findFirst({ where: { name: 'Engineering' } }))!.id,
      college: 'Test University',
      joinedDate: new Date(),
      status: 'ACTIVE',
      score: 85,
      attendance: 95,
    },
  });

  // User 1: vrajg072@gmail.com
  const userVraj072 = await prisma.user.create({
    data: {
      email: 'vrajg072@gmail.com',
      password: await hashPassword('intern123'),
      name: 'Vraj Goti',
      role: UserRole.INTERN,
      isActive: true,
      isEmailVerified: true,
    },
  });

  await prisma.intern.create({
    data: {
      userId: userVraj072.id,
      mentorId: mentor.id,
      departmentId: (await prisma.department.findFirst({ where: { name: 'Engineering' } }))!.id,
      college: 'Test University',
      joinedDate: new Date(),
      status: 'ACTIVE',
      score: 90,
      attendance: 98,
    },
  });

  // User 2: vrajgoti07@gmail.com
  const userVrajgoti07 = await prisma.user.create({
    data: {
      email: 'vrajgoti07@gmail.com',
      password: await hashPassword('intern123'),
      name: 'Vraj Goti (Alternative)',
      role: UserRole.INTERN,
      isActive: true,
      isEmailVerified: true,
    },
  });

  await prisma.intern.create({
    data: {
      userId: userVrajgoti07.id,
      mentorId: mentor.id,
      departmentId: (await prisma.department.findFirst({ where: { name: 'Engineering' } }))!.id,
      college: 'Test University',
      joinedDate: new Date(),
      status: 'ACTIVE',
      score: 92,
      attendance: 99,
    },
  });

  // Tasks are now created through the application workflow (HR/Mentor assigns tasks to interns)

  console.log('✅ Default users created');
  console.log('\n🎉 Clean database seeding completed successfully!');
  console.log('\n📝 New Clean Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('HR Admin Default Account:');
  console.log('  Email: hr@internmanagement.com');
  console.log('  Password: HRPass123!');
  console.log('Frictionless Demo HR Account:');
  console.log('  Email: hr.internflow@gmail.com');
  console.log('  Password: hr@123456789');
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
