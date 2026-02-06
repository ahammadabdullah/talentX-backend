import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testConnection() {
  console.log("Testing database connection...");
  console.log(
    "DATABASE_URL:",
    process.env.DATABASE_URL?.replace(/:[^:]*@/, ":****@")
  ); // Hide password

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log("✅ Database connection successful!");

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT current_database(), version()`;
    console.log("✅ Database query test successful:", result);
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error("Error code:", (error as any).code);
    console.error("Error message:", (error as any).message);
    console.error("Full error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
