/* eslint-disable no-console */
import mongoose from "mongoose";

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27117/csr_dev?replicaSet=testset", { serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db!;
  const user = await db.collection("users").findOne({ email: "admin@trust-esdm.com" });
  console.log("hash:", JSON.stringify(user?.passwordHash), "len:", user?.passwordHash?.length);
  console.log("createdAt:", user?.createdAt);
  await mongoose.disconnect();
}
main();
