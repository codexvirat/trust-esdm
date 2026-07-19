/* eslint-disable no-console */
import bcrypt from "bcryptjs";

async function main() {
  const h = await bcrypt.hash("ChangeMe123!", 10);
  console.log("fresh hash:", h);
  console.log("self-compare:", await bcrypt.compare("ChangeMe123!", h));
}

main();
