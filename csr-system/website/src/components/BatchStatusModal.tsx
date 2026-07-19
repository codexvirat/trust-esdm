"use client";

import { useState } from "react";
import { Modal } from "./Modal";

export function BatchStatusModal() {
  const [open, setOpen] = useState(true);

  return (
    <Modal open={open} onClose={() => setOpen(false)} wide ariaLabel="batch status">
      <div className="eyebrow" style={{ justifyContent: "center" }}>Batch Status</div>
      <h3 style={{ textAlign: "center", fontSize: "1.5rem", marginBottom: 6 }}>Where TRUST-ESDM batches stand today</h3>
      <p className="lead" style={{ textAlign: "center", maxWidth: "none", margin: "0 auto" }}>A quick look at completed, ongoing, and upcoming batches.</p>
      <div className="batch-grid">
        <a href="/batches?status=completed" className="batch-card batch-completed">
          <span className="batch-tag">Completed</span>
          <h4>Completed Batch</h4>
        </a>
        <a href="/batches?status=ongoing" className="batch-card batch-ongoing">
          <span className="batch-tag">Ongoing</span>
          <h4>Ongoing Batch</h4>
        </a>
        <a href="/batches?status=upcoming" className="batch-card batch-upcoming">
          <span className="batch-tag">Upcoming</span>
          <h4>Upcoming Batch</h4>
        </a>
      </div>
    </Modal>
  );
}
