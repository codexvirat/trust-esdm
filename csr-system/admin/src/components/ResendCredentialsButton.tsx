"use client";

import { useTransition } from "react";
import { resendCredentialsAction } from "@/app/actions/users";

export function ResendCredentialsButton({ userId, projectId, email }: { userId: string; projectId: string; email: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await resendCredentialsAction(userId, projectId);
          if (result.error) {
            window.alert(result.error);
          } else if (result.delivered) {
            window.alert(`New login credentials sent to ${email}.`);
          } else {
            window.alert("Email sending isn't configured on the server — check server logs for the temporary password.");
          }
        });
      }}
      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
    >
      {pending ? "Sending…" : "Resend login"}
    </button>
  );
}
