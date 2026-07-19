"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { startAttemptAction, submitAttemptAction } from "@/app/actions/assessments";
import type { AssessmentAttempt, CandidateAssessment } from "@/lib/types";

type Answers = Record<number, number[]>;

function attemptsRemaining(assessment: CandidateAssessment, attempts: AssessmentAttempt[]): number {
  const used = attempts.filter((a) => a.status !== "in_progress").length;
  return Math.max(0, assessment.maxAttempts - used);
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function AttemptRunner({
  workshopId,
  assessmentId,
  enrollmentId,
  assessment,
  initialAttempts,
}: {
  workshopId: string;
  assessmentId: string;
  enrollmentId: string;
  assessment: CandidateAssessment;
  initialAttempts: AssessmentAttempt[];
}) {
  const [attempts, setAttempts] = useState(initialAttempts);
  const inProgress = attempts.find((a) => a.status === "in_progress") ?? null;
  const lastFinished = [...attempts].reverse().find((a) => a.status !== "in_progress") ?? null;

  const [activeAttempt, setActiveAttempt] = useState<AssessmentAttempt | null>(inProgress);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<AssessmentAttempt | null>(null);
  const [pending, startTransition] = useTransition();
  const submittedRef = useRef(false);

  const deadline = useMemo(() => {
    if (!activeAttempt) return null;
    return new Date(activeAttempt.startedAt).getTime() + assessment.durationMinutes * 60_000;
  }, [activeAttempt, assessment.durationMinutes]);

  const [remainingMs, setRemainingMs] = useState<number | null>(deadline ? deadline - Date.now() : null);

  useEffect(() => {
    if (!deadline) return;
    submittedRef.current = false;
    const tick = () => setRemainingMs(deadline - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  useEffect(() => {
    if (remainingMs !== null && remainingMs <= 0 && activeAttempt && !submittedRef.current && !pending) {
      submittedRef.current = true;
      doSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs]);

  function selectOption(questionIndex: number, optionIndex: number, type: string) {
    setAnswers((prev) => {
      if (type === "multiple_choice") {
        const current = prev[questionIndex] ?? [];
        const next = current.includes(optionIndex) ? current.filter((i) => i !== optionIndex) : [...current, optionIndex];
        return { ...prev, [questionIndex]: next };
      }
      return { ...prev, [questionIndex]: [optionIndex] };
    });
  }

  function start() {
    setError(undefined);
    startTransition(async () => {
      const res = await startAttemptAction(workshopId, assessmentId);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.attempt) {
        setActiveAttempt(res.attempt);
        setAttempts((prev) => [...prev.filter((a) => a._id !== res.attempt!._id), res.attempt!]);
      }
    });
  }

  function doSubmit() {
    if (!activeAttempt) return;
    setError(undefined);
    const payload = Object.entries(answers).map(([questionIndex, selectedOptions]) => ({
      questionIndex: Number(questionIndex),
      selectedOptions,
    }));
    startTransition(async () => {
      const res = await submitAttemptAction(workshopId, assessmentId, activeAttempt._id, payload, enrollmentId);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.attempt) {
        setResult(res.attempt);
        setActiveAttempt(null);
      }
    });
  }

  if (result) {
    return <ResultCard attempt={result} assessment={assessment} enrollmentId={enrollmentId} />;
  }

  if (activeAttempt) {
    const answeredCount = Object.keys(answers).length;
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <p className="text-sm font-medium text-slate-900">{assessment.title}</p>
            <p className="text-xs text-slate-500">
              {answeredCount}/{assessment.questions.length} answered
            </p>
          </div>
          <div
            className={`rounded-md px-3 py-1.5 text-sm font-semibold tabular-nums ${
              remainingMs !== null && remainingMs < 60_000 ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-800"
            }`}
          >
            {remainingMs !== null ? formatRemaining(remainingMs) : "--:--"}
          </div>
        </div>

        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex flex-col gap-4">
          {assessment.questions.map((q, qi) => (
            <div key={qi} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-900">
                {qi + 1}. {q.questionText}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{q.marks} mark{q.marks !== 1 ? "s" : ""}</p>
              <div className="mt-3 flex flex-col gap-2">
                {q.options.map((opt, oi) => {
                  const checked = (answers[qi] ?? []).includes(oi);
                  const inputType = q.type === "multiple_choice" ? "checkbox" : "radio";
                  return (
                    <label key={oi} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type={inputType}
                        name={`q-${qi}`}
                        checked={checked}
                        onChange={() => selectOption(qi, oi, q.type)}
                        className="h-4 w-4 accent-teal-700"
                      />
                      {opt.text}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              submittedRef.current = true;
              doSubmit();
            }}
            className="rounded-md bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Submitting…" : "Submit assessment"}
          </button>
        </div>
      </div>
    );
  }

  const remaining = attemptsRemaining(assessment, attempts);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900">{assessment.title}</h1>
        {assessment.description && <p className="mt-1 text-sm text-slate-500">{assessment.description}</p>}
        <p className="mt-3 text-xs text-slate-500">
          {assessment.questions.length} questions · {assessment.totalMarks} marks · {assessment.durationMinutes} minutes · pass at{" "}
          {assessment.passingPercent}%
        </p>

        {lastFinished && (
          <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm">
            Last attempt: <span className="font-medium">{lastFinished.percentage}%</span>{" "}
            <span className={lastFinished.result === "pass" ? "text-emerald-700" : "text-red-600"}>
              ({lastFinished.result === "pass" ? "Passed" : "Failed"})
            </span>
          </div>
        )}

        {error && <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            disabled={pending || remaining === 0}
            onClick={start}
            className="rounded-md bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Starting…" : lastFinished ? "Start new attempt" : "Start assessment"}
          </button>
          <span className="text-xs text-slate-500">{remaining} attempt{remaining !== 1 ? "s" : ""} remaining</span>
        </div>
      </div>
      <Link href={`/dashboard/trainings/${enrollmentId}/assessments`} className="text-xs font-medium text-teal-700 hover:text-teal-900">
        ← Back to assessments
      </Link>
    </div>
  );
}

function ResultCard({
  attempt,
  assessment,
  enrollmentId,
}: {
  attempt: AssessmentAttempt;
  assessment: CandidateAssessment;
  enrollmentId: string;
}) {
  const passed = attempt.result === "pass";
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-8 text-center">
      <p className={`text-3xl font-semibold ${passed ? "text-emerald-700" : "text-red-600"}`}>{passed ? "Passed" : "Not passed"}</p>
      <p className="text-sm text-slate-600">
        You scored <b>{attempt.score}</b> / {assessment.totalMarks} ({attempt.percentage}%)
      </p>
      {attempt.status === "auto_submitted" && <p className="text-xs text-amber-700">Time ran out — this attempt was auto-submitted.</p>}
      <Link
        href={`/dashboard/trainings/${enrollmentId}/assessments`}
        className="mt-2 rounded-md bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
      >
        Back to assessments
      </Link>
    </div>
  );
}
