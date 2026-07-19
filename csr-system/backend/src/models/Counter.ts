import { Schema, model, type InferSchemaType } from "mongoose";

// Utility collection implementing atomic sequence generation — Mongo has no
// native auto-increment. `_id` is the sequence name (e.g. `certificate_seq_<projectId>`).
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export type CounterDoc = InferSchemaType<typeof counterSchema>;
export const Counter = model("Counter", counterSchema, "counters");

export async function getNextSequence(name: string): Promise<number> {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return doc!.seq;
}
