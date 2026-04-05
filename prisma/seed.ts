import { PrismaClient, UserRole, CandidateStatus, SourceChannel, DocumentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Users
  const password = await bcrypt.hash('password123', 10);

  console.log('Upserting admin user...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@oricruit.com' },
    update: {
      password,
      role: UserRole.ADMIN,
      name: 'Admin User',
    },
    create: {
      email: 'admin@oricruit.com',
      password,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });

  console.log('Upserting recruiter user...');
  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@oricruit.com' },
    update: {
      password,
      role: UserRole.RECRUITER,
      name: 'John Recruiter',
    },
    create: {
      email: 'recruiter@oricruit.com',
      password,
      name: 'John Recruiter',
      role: UserRole.RECRUITER,
    },
  });

  console.log('Core users stabilized');

  // 2. Create Offers
  const offer1 = await prisma.offer.create({
    data: {
      title: 'Construction Worker - Warsaw',
      description: 'General construction work in Warsaw area.',
      location: 'Warsaw',
      salary: '5000 - 6000 PLN',
    },
  });

  const offer2 = await prisma.offer.create({
    data: {
      title: 'Warehouse Specialist - Krakow',
      description: 'Sorting and packing in a modern warehouse.',
      location: 'Krakow',
      salary: '4500 - 5500 PLN',
    },
  });

  console.log('Offers created');

  // 3. Create Candidates
  const candidates = [
    {
      firstName: 'Berenice',
      lastName: 'Hernandez',
      phone: '48796240947',
      email: 'berenice@example.com',
      nationality: 'Mexican',
      status: CandidateStatus.INTERESTED,
      source: SourceChannel.WHATSAPP,
      recruiterId: recruiter.id,
    },
    {
      firstName: 'Igor',
      lastName: 'Ivanov',
      phone: '48500100200',
      email: 'igor@example.com',
      nationality: 'Ukrainian',
      status: CandidateStatus.READY_FOR_LEGAL_REVIEW, // This will populate Legal Reviews
      source: SourceChannel.WHATSAPP,
      recruiterId: recruiter.id,
    },
    {
      firstName: 'Carlos',
      lastName: 'Gomez',
      phone: '34611223344',
      email: 'carlos@example.com',
      nationality: 'Spanish',
      status: CandidateStatus.COORDINATOR_HANDOVER_PENDING, // This will populate Handovers
      source: SourceChannel.WEBSITE,
      recruiterId: recruiter.id,
    },
    {
      firstName: 'Maria',
      lastName: 'Santos',
      phone: '34600112233',
      email: 'maria@example.com',
      nationality: 'Spanish',
      status: CandidateStatus.NEW_LEAD,
      source: SourceChannel.WEBSITE,
      recruiterId: recruiter.id,
    },
  ];

  for (const c of candidates) {
    const candidate = await prisma.candidate.upsert({
      where: { phone: c.phone },
      update: c,
      create: {
        ...c,
        activities: {
          create: {
            actorId: admin.id,
            type: 'INITIAL_SEED',
            description: 'Candidate created via seeding',
          },
        },
      },
    });

    // Create a LegalReview for the candidate in legal status
    if (c.status === CandidateStatus.READY_FOR_LEGAL_REVIEW) {
      const existing = await prisma.legalReview.findFirst({ where: { candidateId: candidate.id } });
      if (!existing) {
        await prisma.legalReview.create({
          data: {
            candidateId: candidate.id,
            status: 'PENDING',
            requiredDocsList: 'Passport, Work Permit, Medical Exam',
            notes: 'Standard Polish Work Visa review required.',
          }
        });
      }
    }

    // Create a CoordinatorHandover for the candidate in handover status
    if (c.status === CandidateStatus.COORDINATOR_HANDOVER_PENDING) {
      await prisma.coordinatorHandover.upsert({
        where: { candidateId: candidate.id },
        update: {},
        create: {
          candidateId: candidate.id,
          status: 'PENDING',
          location: 'Warsaw HQ',
          accommodationName: 'Employee Hostel A',
        }
      });
    }
  }

  console.log('Candidates processed');
  console.log('Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
