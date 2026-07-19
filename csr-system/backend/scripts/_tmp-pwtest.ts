/* eslint-disable no-console */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27117/csr_dev?replicaSet=testset", { serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db!;
  const user = await db.collection("users").findOne({ email: "admin@trust-esdm.com" });
  console.log("status:", user?.status, "lockedUntil:", user?.lockedUntil, "failedLoginAttempts:", user?.failedLoginAttempts);
  const match = await bcrypt.compare("ChangeMe123!", user!.passwordHash);
  console.log("bcrypt match:", match);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
