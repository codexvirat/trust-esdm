/* eslint-disable no-console */
import "../src/models";
import { connectDB, disconnectDB } from "../src/config/db";
import { User } from "../src/models/User";

async function main() {
  await connectDB();

  const existing = await User.collection.indexes();
  for (const idx of existing) {
    const keys = Object.keys(idx.key);
    const isEmailIdx = keys.length === 2 && "projectId" in idx.key && "email" in idx.key;
    const isPhoneIdx = keys.length === 1 && "phone" in idx.key;
    if ((isEmailIdx || isPhoneIdx) && !idx.partialFilterExpression) {
      console.log(`[migrate] dropping old index: ${idx.name}`);
      await User.collection.dropIndex(idx.name!);
    }
  }

  await User.syncIndexes();
  console.log("[migrate] indexes now:", (await User.collection.indexes()).map((i) => i.name));

  await disconnectDB();
  console.log("[migrate] done");
}

main().catch((err) => {
  console.error("[migrate] failed", err);
  process.exit(1);
});
