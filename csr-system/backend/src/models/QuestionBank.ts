import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { QUESTION_TYPES, QUESTION_DIFFICULTIES } from "../types/enums";

const optionSchema = new Schema({ text: { type: String, required: true }, isCorrect: { type: Boolean, default: false } }, { _id: false });

const questionBankSchema = new Schema({
  questionText: { type: String, required: true },
  type: { type: String, enum: QUESTION_TYPES, required: true },
  options: { type: [optionSchema], required: true, validate: (v: unknown[]) => v.length >= 2 },
  marks: { type: Number, required: true, min: 0 },
  difficulty: { type: String, enum: QUESTION_DIFFICULTIES, default: "medium" },
  tags: { type: [String], default: [] },
  createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

applyBasePlugin(questionBankSchema, { tenant: true });
questionBankSchema.index({ projectId: 1, tags: 1 });

export type QuestionBankDoc = InferSchemaType<typeof questionBankSchema>;
export const QuestionBank = model("QuestionBank", questionBankSchema, "question_bank");
