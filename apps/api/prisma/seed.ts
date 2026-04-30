/**
 * Jethro Academy — Prisma Seed Script
 * Run: npm run db:seed (from apps/api)
 *
 * Seeds:
 *  - 1 Super Admin user
 *  - 1 Content Admin user
 *  - 1 sample Instructor user
 *  - 4 Expertise Areas (matching the current prototype)
 *  - 2 sample Courses with Modules and Lessons (draft)
 */

import { PrismaClient, UserRole, UserStatus, ContentStatus, LessonType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('\n🌱 Seeding Jethro Academy database...\n');

  // ── 1. Users ──────────────────────────────────────────────────────────────

  const superAdminHash  = await bcrypt.hash('SuperAdmin@2026!', SALT_ROUNDS);
  const contentAdminHash = await bcrypt.hash('ContentAdmin@2026!', SALT_ROUNDS);
  const instructorHash  = await bcrypt.hash('Instructor@2026!', SALT_ROUNDS);
  const learnerHash     = await bcrypt.hash('Learner@2026!', SALT_ROUNDS);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@jethro.academy' },
    update: {},
    create: {
      email:        'superadmin@jethro.academy',
      passwordHash: superAdminHash,
      firstName:    'Jean',
      lastName:     'Dumontel',
      role:         UserRole.SUPER_ADMIN,
      status:       UserStatus.ACTIVE,
    },
  });
  console.log(`✅ Super Admin: ${superAdmin.email}`);

  const contentAdmin = await prisma.user.upsert({
    where: { email: 'admin@jethro.academy' },
    update: {},
    create: {
      email:        'admin@jethro.academy',
      passwordHash: contentAdminHash,
      firstName:    'Content',
      lastName:     'Admin',
      role:         UserRole.CONTENT_ADMIN,
      status:       UserStatus.ACTIVE,
    },
  });
  console.log(`✅ Content Admin: ${contentAdmin.email}`);

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@jethro.academy' },
    update: {},
    create: {
      email:        'instructor@jethro.academy',
      passwordHash: instructorHash,
      firstName:    'Dr. Samuel',
      lastName:     'Instructor',
      role:         UserRole.INSTRUCTOR,
      status:       UserStatus.ACTIVE,
      bio:          'Experienced pastor and theological educator with 20+ years in church leadership.',
    },
  });
  console.log(`✅ Instructor: ${instructor.email}`);

  const learner = await prisma.user.upsert({
    where: { email: 'learner@jethro.academy' },
    update: {},
    create: {
      email:        'learner@jethro.academy',
      passwordHash: learnerHash,
      firstName:    'Test',
      lastName:     'Learner',
      role:         UserRole.LEARNER,
      status:       UserStatus.ACTIVE,
    },
  });
  console.log(`✅ Test Learner: ${learner.email}`);

  // ── 2. Expertise Areas ────────────────────────────────────────────────────

  const leadershipArea = await prisma.expertiseArea.upsert({
    where: { slug: 'church-leadership' },
    update: {},
    create: {
      name:        'Church Leadership',
      slug:        'church-leadership',
      description: 'Develop servant-leader qualities grounded in biblical principles.',
      sortOrder:   1,
    },
  });

  const governanceArea = await prisma.expertiseArea.upsert({
    where: { slug: 'church-governance' },
    update: {},
    create: {
      name:        'Church Governance',
      slug:        'church-governance',
      description: 'Understand constitutional frameworks, board structures, and legal accountability.',
      sortOrder:   2,
    },
  });

  const pastoralArea = await prisma.expertiseArea.upsert({
    where: { slug: 'pastoral-care' },
    update: {},
    create: {
      name:        'Pastoral Care',
      slug:        'pastoral-care',
      description: 'Equip yourself to shepherd, counsel, and care for your congregation.',
      sortOrder:   3,
    },
  });

  const theologicalArea = await prisma.expertiseArea.upsert({
    where: { slug: 'theological-formation' },
    update: {},
    create: {
      name:        'Theological Formation',
      slug:        'theological-formation',
      description: 'Ground your ministry in core doctrines of grace, Scripture, and Reformed theology.',
      sortOrder:   4,
    },
  });

  console.log(`\n✅ Expertise Areas: Leadership, Governance, Pastoral, Theological`);

  // ── 3. Sample Courses ─────────────────────────────────────────────────────

  // Course 1: The Cross-Shaped Leader
  const course1 = await prisma.course.upsert({
    where: { slug: 'the-cross-shaped-leader' },
    update: {},
    create: {
      expertiseAreaId: leadershipArea.id,
      title:           'The Cross-Shaped Leader',
      slug:            'the-cross-shaped-leader',
      description:     'Discover how servant leadership flows from the cross. Explore humility, sacrifice, and grace-driven leadership through Scripture.',
      price:           4999, // $49.99
      currency:        'usd',
      status:          ContentStatus.APPROVED,
      sortOrder:       1,
    },
  });

  // Module 1 of Course 1
  const course1Module1 = await prisma.module.upsert({
    where: { id: 'seed-module-c1-m1' },
    update: { title: 'The Foundation of Servant Leadership' },
    create: {
      id:          'seed-module-c1-m1',
      courseId:    course1.id,
      title:       'The Foundation of Servant Leadership',
      description: 'Understanding how the cross reshapes our entire concept of leadership.',
      sortOrder:   1,
    },
  });

  // Lessons for Module 1
  const lessonData = [
    {
      id:            'seed-lesson-c1-m1-l1',
      title:         'Reading — The Cross and the Church',
      slug:          'reading-the-cross-and-the-church',
      type:          LessonType.READING,
      estimatedMins: 20,
      sortOrder:     1,
    },
    {
      id:            'seed-lesson-c1-m1-l2',
      title:         'Video — Servant Leadership in Scripture',
      slug:          'video-servant-leadership-in-scripture',
      type:          LessonType.VIDEO,
      estimatedMins: 35,
      sortOrder:     2,
    },
    {
      id:            'seed-lesson-c1-m1-l3',
      title:         'Quiz — Foundation Comprehension',
      slug:          'quiz-foundation-comprehension',
      type:          LessonType.QUIZ,
      estimatedMins: 15,
      sortOrder:     3,
    },
    {
      id:            'seed-lesson-c1-m1-l4',
      title:         'Assignment — Personal Leadership Reflection',
      slug:          'assignment-personal-leadership-reflection',
      type:          LessonType.ASSIGNMENT,
      estimatedMins: 60,
      sortOrder:     4,
    },
  ];

  for (const ld of lessonData) {
    await prisma.lesson.upsert({
      where: { id: ld.id },
      update: { title: ld.title },
      create: {
        ...ld,
        moduleId:     course1Module1.id,
        instructorId: instructor.id,
        status:       ContentStatus.APPROVED,
      },
    });
  }

  console.log(`✅ Course 1: "${course1.title}" — 1 module, ${lessonData.length} lessons`);

  // Course 2: Theology of Sanctification
  const course2 = await prisma.course.upsert({
    where: { slug: 'theology-of-sanctification' },
    update: {},
    create: {
      expertiseAreaId: theologicalArea.id,
      title:           'Theology of Sanctification',
      slug:            'theology-of-sanctification',
      description:     'A deep dive into the doctrine of sanctification — what it means to be set apart, renewed by the Spirit, and conformed to Christ.',
      price:           4999,
      currency:        'usd',
      status:          ContentStatus.APPROVED,
      sortOrder:       2,
    },
  });

  const course2Module1 = await prisma.module.upsert({
    where: { id: 'seed-module-c2-m1' },
    update: { title: 'Foundations of Sanctification' },
    create: {
      id:          'seed-module-c2-m1',
      courseId:    course2.id,
      title:       'Foundations of Sanctification',
      description: 'Defining sanctification and distinguishing it from justification.',
      sortOrder:   1,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'seed-lesson-c2-m1-l1' },
    update: {},
    create: {
      id:            'seed-lesson-c2-m1-l1',
      moduleId:      course2Module1.id,
      instructorId:  instructor.id,
      title:         'Reading — What is Sanctification?',
      slug:          'reading-what-is-sanctification',
      type:          LessonType.READING,
      estimatedMins: 25,
      sortOrder:     1,
      status:        ContentStatus.APPROVED,
    },
  });

  console.log(`✅ Course 2: "${course2.title}" — 1 module, 1 lesson`);

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n');
  console.log('Default credentials:');
  console.log('  Super Admin  — superadmin@jethro.academy / SuperAdmin@2026!');
  console.log('  Content Admin — admin@jethro.academy / ContentAdmin@2026!');
  console.log('  Instructor   — instructor@jethro.academy / Instructor@2026!');
  console.log('  Learner      — learner@jethro.academy / Learner@2026!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
