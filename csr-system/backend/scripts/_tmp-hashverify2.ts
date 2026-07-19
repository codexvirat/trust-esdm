import bcrypt from "bcryptjs";
async function main() {
  const hash = "$2a$10$fqZNBX69sgGVaL9Jlbpo8.Al.ts2q4XjoOlPmJOBWgbC4hhGF33D2";
  console.log("compare ChangeMe123!:", await bcrypt.compare("ChangeMe123!", hash));
}
main();
