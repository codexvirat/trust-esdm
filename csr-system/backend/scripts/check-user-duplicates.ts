/* eslint-disable no-console */
import "../src/models";
import { connectDB, disconnectDB } from "../src/config/db";
import { User } from "../src/models/User";

async function main() {
  await connectDB();

  const dupeEmails = await User.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: { projectId: "$projectId", email: "$email" }, count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  const dupePhones = await User.aggregate([
    { $match: { isDeleted: false, phone: { $exists: true, $nin: [null, ""] } } },
    { $group: { _id: "$phone", count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  console.log(`[check] duplicate active emails: ${dupeEmails.length}`);
  dupeEmails.forEach((d) => console.log("  ", JSON.stringify(d)));

  console.log(`[check] duplicate active phones: ${dupePhones.length}`);
  dupePhones.forEach((d) => console.log("  ", JSON.stringify(d)));

  if (dupeEmails.length === 0 && dupePhones.length === 0) {
    console.log("[check] no duplicates — safe to run fix-user-indexes.ts");
  } else {
    console.log("[check] duplicates found — resolve these before running fix-user-indexes.ts");
  }

  await disconnectDB();
}

main().catch((err) => {
  console.error("[check] failed", err);
  process.exit(1);
});
