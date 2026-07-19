"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  wide,
  ariaLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  wide?: boolean;
  ariaLabel: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={`modal-overlay${open ? " open" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal-box${wide ? " modal-box-wide" : ""}`}>
        <button type="button" className="modal-close" onClick={onClose} aria-label={`Close ${ariaLabel}`}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}
