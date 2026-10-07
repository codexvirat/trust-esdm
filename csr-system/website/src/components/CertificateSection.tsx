"use client";

import { useState } from "react";
import { Modal } from "./Modal";

export function CertificateSection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="cert">
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <rect x="3" y="3" width="38" height="38" rx="8" fill="none" stroke="#B8722F" strokeWidth="2.5" />
          <path d="M12 12h8v8h-8zM24 12h8v8h-8zM12 24h8v8h-8z" fill="none" stroke="#12332A" strokeWidth="2" />
          <rect x="26" y="26" width="4" height="4" fill="#B8722F" />
          <rect x="32" y="26" width="2" height="6" fill="#B8722F" />
        </svg>
        <p><b>Every participant receives a joint certificate</b> from DRIIV and OPPO India, verifiable online by QR code.</p>
        <button type="button" className="btn btn-ghost cert-btn" onClick={() => setOpen(true)}>View sample</button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} wide ariaLabel="sample certificate">
        <div className="cert-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/certificate.jpeg" alt="Sample DRIIV & OPPO India certificate of completion" className="cert-img" />
        </div>
      </Modal>
    </>
  );
}
