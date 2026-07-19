import mongoose, { type ClientSession } from "mongoose";

const NO_REPLICA_SET_ERROR = /Transaction numbers are only allowed on a replica set member or mongos/;

/**
 * Runs `fn` inside a MongoDB transaction. Falls back to running `fn` without
 * a session when the connection is a standalone server that doesn't support
 * multi-document transactions — e.g. mongodb-memory-server started without a
 * replica set, a common lightweight local-dev setup. Production always talks
 * to a real replica set (Atlas), so the transactional path is what runs there.
 * The fallback only fires on that specific topology error — any error thrown
 * by `fn` itself (business-logic rejections, validation, etc.) still propagates.
 */
export async function runInTransaction<T>(fn: (session: ClientSession | null) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result as T;
  } catch (err) {
    if (err instanceof Error && NO_REPLICA_SET_ERROR.test(err.message)) {
      return fn(null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}
