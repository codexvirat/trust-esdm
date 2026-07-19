"use client";

import { useState } from "react";
import { Modal } from "./Modal";

export function CertificateSection() {
  const [open, setOpen] = useState(false);

  return (
    <section className="section-tight">
      <div className="wrap" style={{ maxWidth: 900 }}>
        <div className="eyebrow">What you&apos;ll receive</div>
        <h2 style={{ fontSize: "2rem" }}>A certificate that means something.</h2>
        <p className="lead" style={{ maxWidth: "none" }}>Every participant who completes their track receives a joint certificate of completion from DRIIV and OPPO India, verifiable online via QR code.</p>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>View sample certificate</button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} wide ariaLabel="sample certificate">
        <div className="cert-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/certificate.jpeg" alt="Sample DRIIV & OPPO India certificate of completion" className="cert-img" />
        </div>
      </Modal>
    </section>
  );
}
