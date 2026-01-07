import "dotenv/config";
import prisma from "../lib/prisma";

async function clearAllSessions() {
  console.log("🧹 Clearing ALL sessions...");

  try {
    const result = await prisma.session.deleteMany({});
    console.log(`✅ Deleted ${result.count} sessions.`);
    console.log("All users have been logged out.");
  } catch (error) {
    console.error("Failed to clear sessions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllSessions();
