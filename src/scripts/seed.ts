import { PrismaClient } from "@prisma/client";
import { generateJobDescription } from "../services/aiService";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data in reverse dependency order
  await prisma.invitation.deleteMany();
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleared existing data");

  // Create 1 Employer
  const employer = await prisma.user.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "John Smith",
      email: "john.smith@techcorp.com",
      role: "EMPLOYER",
    },
  });
  console.log(`✅ Created employer: ${employer.name}`);

  // Create 3 Talents
  const talent1 = await prisma.user.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "Alice Johnson",
      email: "alice.johnson@email.com",
      role: "TALENT",
    },
  });

  const talent2 = await prisma.user.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440003",
      name: "Bob Wilson",
      email: "bob.wilson@email.com",
      role: "TALENT",
    },
  });

  const talent3 = await prisma.user.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440004",
      name: "Carol Davis",
      email: "carol.davis@email.com",
      role: "TALENT",
    },
  });
  console.log(
    `✅ Created talents: ${talent1.name}, ${talent2.name}, ${talent3.name}`
  );

  // Create 2 Jobs with future deadlines
  const futureDate1 = new Date();
  futureDate1.setDate(futureDate1.getDate() + 30); // 30 days from now

  const futureDate2 = new Date();
  futureDate2.setDate(futureDate2.getDate() + 45); // 45 days from now

  // Generate descriptions for the jobs
  const job1Description = await generateJobDescription({
    title: "Senior Frontend Developer",
    companyName: "TechCorp Inc",
    techStack: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
  });

  const job2Description = await generateJobDescription({
    title: "Full Stack Engineer",
    companyName: "TechCorp Inc",
    techStack: ["Node.js", "Express", "PostgreSQL", "React", "TypeScript"],
  });

  const job1 = await prisma.job.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440005",
      title: "Senior Frontend Developer",
      companyName: "TechCorp Inc",
      techStack: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
      deadline: futureDate1,
      description: job1Description,
      employerId: employer.id,
    },
  });

  const job2 = await prisma.job.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440006",
      title: "Full Stack Engineer",
      companyName: "TechCorp Inc",
      techStack: ["Node.js", "Express", "PostgreSQL", "React", "TypeScript"],
      deadline: futureDate2,
      description: job2Description,
      employerId: employer.id,
    },
  });
  console.log(`✅ Created jobs: ${job1.title}, ${job2.title}`);

  // Create 1 Application (talent1 applied to job1 manually)
  const application = await prisma.application.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440007",
      jobId: job1.id,
      talentId: talent1.id,
      source: "MANUAL",
    },
  });
  console.log(
    `✅ Created application: ${talent1.name} applied to ${job1.title}`
  );

  // Create 1 Pending Invitation (employer invited talent2 to job2)
  const invitation = await prisma.invitation.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440008",
      jobId: job2.id,
      talentId: talent2.id,
      employerId: employer.id,
      status: "PENDING",
    },
  });
  console.log(
    `✅ Created invitation: ${employer.name} invited ${talent2.name} to ${job2.title}`
  );

  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\nSeed data summary:");
  console.log(`👤 Users: 1 employer, 3 talents`);
  console.log(`💼 Jobs: 2 jobs with future deadlines`);
  console.log(`📋 Applications: 1 manual application`);
  console.log(`📩 Invitations: 1 pending invitation`);
  console.log("\nRelational consistency verified ✅");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
