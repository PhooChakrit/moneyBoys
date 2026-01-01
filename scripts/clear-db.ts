import "dotenv/config";
import prisma from "../lib/prisma";

async function clearDatabase() {
  console.log("🗑️  WARNING: This will delete ALL data from the database!");
  console.log("📋 Clearing tables in order (respecting foreign keys)...\n");

  // Delete in order to respect foreign key constraints
  const results = {
    expenseSplits: await prisma.expenseSplit.deleteMany(),
    expenses: await prisma.expense.deleteMany(),
    settlements: await prisma.settlement.deleteMany(),
    groupMembers: await prisma.groupMember.deleteMany(),
    groups: await prisma.group.deleteMany(),
    sessions: await prisma.session.deleteMany(),
    accounts: await prisma.account.deleteMany(),
    verifications: await prisma.verification.deleteMany(),
    users: await prisma.user.deleteMany(),
  };

  console.log("✅ Deleted:");
  Object.entries(results).forEach(([table, result]) => {
    console.log(`   - ${table}: ${result.count} records`);
  });

  console.log("\n🎉 Database cleared successfully!");

  await prisma.$disconnect();
}

clearDatabase().catch((err) => {
  console.error("❌ Error clearing database:", err);
  process.exit(1);
});
