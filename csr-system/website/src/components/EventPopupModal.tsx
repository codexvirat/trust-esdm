"use client";

import { useState } from "react";
import { Modal } from "./Modal";

export function EventPopupModal() {
  const [open, setOpen] = useState(true);

  return (
    <Modal open={open} onClose={() => setOpen(false)} flush ariaLabel="event announcement">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="event-popup-banner"
        src="/assets/capacity-building-banner.jpg"
        alt="One-Day Capacity Building Programme for MSMEs on Credit and Finance — 15th October 2026, 09:00 AM to 05:00 PM, PHD House, New Delhi. Supported by DRIIV and OPPO."
        width={1920}
        height={480}
      />
      <div className="event-popup-actions">
        <a href="#enroll" className="btn btn-copper" onClick={() => setOpen(false)}>
          Register Now
        </a>
      </div>
    </Modal>
  );
}
