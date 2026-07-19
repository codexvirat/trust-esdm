/* eslint-disable no-console */
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { writeFileSync } from "node:fs";
import path from "node:path";

async function main() {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 }, instanceOpts: [{ port: 27117 }] });
  const uri = replSet.getUri("csr_dev");
  const outFile = path.join(__dirname, ".dev-db-uri.txt");
  writeFileSync(outFile, uri, "utf8");
  console.log(`[dev-db] MongoDB replica set running at ${uri}`);
  console.log(`[dev-db] URI written to ${outFile}`);
  console.log("[dev-db] Press Ctrl+C to stop.");

  process.on("SIGINT", async () => {
    await replSet.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[dev-db] failed to start", err);
  process.exit(1);
});
