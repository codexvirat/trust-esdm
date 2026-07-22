import { Schema, model, type InferSchemaType } from "mongoose";

// Utility collection implementing atomic sequence generation — Mongo has no
// native auto-increment. `_id` is the sequence name (e.g. `certificate_seq_<projectId>`).
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
  // Numbers freed up by a discarded draft certificate (see certificate.service.ts#
  // discardDraftCertificatesForBatch) — handed out again before incrementing `seq`, so discarding
  // a batch of drafts and regenerating doesn't burn through the sequence with gaps.
  released: { type: [Number], default: [] },
});

export type CounterDoc = InferSchemaType<typeof counterSchema>;
export const Counter = model("Counter", counterSchema, "counters");

export async function getNextSequence(name: string): Promise<number> {
  const withReleased = await Counter.findOne({ _id: name, released: { $exists: true, $ne: [] } });
  if (withReleased && withReleased.released.length > 0) {
    const reused = Math.min(...withReleased.released);
    // $pull is itself atomic, but two callers could both read the same `reused` value before
    // either pulls — the pull re-checks membership, so at most one of them actually claims it; the
    // other falls through to the increment path below and gets a fresh number instead.
    const claimed = await Counter.findOneAndUpdate(
      { _id: name, released: reused },
      { $pull: { released: reused } },
      { new: true },
    );
    if (claimed) return reused;
  }

  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return doc!.seq;
}

/** Returns certificate numbers to the pool so the next getNextSequence call(s) hand them out again
 * instead of continuing to climb — only safe to call for numbers whose certificate was fully
 * deleted (a discarded draft), never for a revoked one, since a revoked certificate's number is
 * still printed on a PDF that was already handed out and must stay unique. */
export async function releaseSequenceNumbers(name: string, numbers: number[]): Promise<void> {
  if (numbers.length === 0) return;
  await Counter.findByIdAndUpdate(name, { $addToSet: { released: { $each: numbers } } }, { upsert: true });
}
