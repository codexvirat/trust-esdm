"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

function PasswordChangedNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("passwordChanged") !== "1") return null;
  return (
    <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Password changed. Sign in with your new password.</p>
  );
}

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Platform Admin</h1>
        <p className="mt-1 text-sm text-slate-400">Sign in to manage projects, users, and platform-wide settings.</p>

        <Suspense fallback={null}>
          <PasswordChangedNotice />
        </Suspense>

        <form action={action} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="projectSlug" className="text-sm font-medium text-slate-300">
              Project slug <span className="font-normal text-slate-500">(only if asked)</span>
            </label>
            <input
              id="projectSlug"
              name="projectSlug"
              type="text"
              placeholder="platform"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </div>

          {state.error && (
            <p role="alert" className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
