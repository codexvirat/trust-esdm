import mongoose from "mongoose";
import bcrypt from "bcryptjs";

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27117/csr_dev?replicaSet=testset", { serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db!;
  const del = await db.collection("users").deleteOne({ email: "admin@trust-esdm.com" });
  console.log("deleted:", del.deletedCount);
  await mongoose.disconnect();
}
main();
