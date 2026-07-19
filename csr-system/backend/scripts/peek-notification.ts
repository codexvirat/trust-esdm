import mongoose from "mongoose";
import { Notification } from "../src/models/Notification";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const userId = process.argv[2];
  const notifs = await Notification.find({ recipientUserId: userId }).sort({ createdAt: -1 });
  for (const n of notifs) console.log(n.body);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
