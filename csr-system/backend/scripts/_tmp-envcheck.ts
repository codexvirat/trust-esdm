/* eslint-disable no-console */
import { env } from "../src/config/env";

console.log("password:", JSON.stringify(env.SEED_SUPER_ADMIN_PASSWORD));
console.log("length:", env.SEED_SUPER_ADMIN_PASSWORD?.length);
console.log("email:", JSON.stringify(env.SEED_SUPER_ADMIN_EMAIL));
