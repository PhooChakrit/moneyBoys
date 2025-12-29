import "dotenv/config";
import prisma from "../lib/prisma";

async function cleanupExpiredSessions() {
  console.log("🧹 Cleaning up expired sessions...");

  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  console.log(`✅ Deleted ${result.count} expired sessions`);

  // Show remaining sessions
  const remaining = await prisma.session.count();
  console.log(`📊 Remaining active sessions: ${remaining}`);

  await prisma.$disconnect();
}

cleanupExpiredSessions().catch(console.error);
