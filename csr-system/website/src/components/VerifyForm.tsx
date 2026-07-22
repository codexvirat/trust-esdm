"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function VerifyForm() {
  const [value, setValue] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/verify/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap", alignItems: "flex-end" }}>
      <div className="field" style={{ flex: "1 1 240px" }}>
        <label htmlFor="certificateId">Certificate ID</label>
        <input
          id="certificateId"
          name="certificateId"
          required
          placeholder="e.g. MAMH0001"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Verify
      </button>
    </form>
  );
}
