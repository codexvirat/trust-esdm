"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { CANDIDATE_PORTAL_URL } from "@/lib/constants";
import type { MarqueeItem } from "@/lib/types";

export function Header({ marqueeItems }: { marqueeItems: MarqueeItem[] }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <header>
      {marqueeItems.length > 0 && (
        <div className="marquee-bar">
          <div className="marquee-track">
            {[0, 1].map((rep) =>
              marqueeItems.map((m) => (
                <span key={`${rep}-${m._id}`}>
                  <a href={m.linkTarget || "/#enroll"}>{m.message}</a>
                  <span className="marquee-sep" aria-hidden="true">•</span>
                </span>
              )),
            )}
          </div>
        </div>
      )}

      <nav className="nav">
        <Link href="/#top" className="brand">
          <BrandMark className="brand-mark" />
          TRUST-ESDM
        </Link>
        <button
          type="button"
          className={`nav-toggle${navOpen ? " open" : ""}`}
          aria-label="Open menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}
        >
          <svg className="icon-open" viewBox="0 0 24 24" fill="none" stroke="#16211C" strokeWidth={2}>
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
          <svg className="icon-close" viewBox="0 0 24 24" fill="none" stroke="#16211C" strokeWidth={2}>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className={`navlinks${navOpen ? " open" : ""}`}>
          <Link href="/#about" onClick={() => setNavOpen(false)}>About</Link>
          <Link href="/#program" onClick={() => setNavOpen(false)}>The program</Link>
          <Link href="/#tracks" onClick={() => setNavOpen(false)}>Certification Tracks</Link>
          <Link href="/#journey" onClick={() => setNavOpen(false)}>How it works</Link>
          <Link href="/#goals" onClick={() => setNavOpen(false)}>Impact</Link>
          <Link href="/#faq" onClick={() => setNavOpen(false)}>Questions</Link>
          <a href={`${CANDIDATE_PORTAL_URL}/login`} className="btn btn-ghost" onClick={() => setNavOpen(false)}>Login</a>
          <Link href="/#enroll" className="btn btn-primary" onClick={() => setNavOpen(false)}>Enroll now</Link>
        </div>
      </nav>

      <div className="marquee-bar">
        <div className="marquee-track">
          {[0, 1].map((rep) => (
            <span key={rep}>
              <Link href="/batches?status=completed">Completed Batch</Link><span className="marquee-sep" aria-hidden="true">•</span>
              <Link href="/batches?status=ongoing">Ongoing Batch</Link><span className="marquee-sep" aria-hidden="true">•</span>
              <Link href="/batches?status=upcoming">Upcoming Batch</Link><span className="marquee-sep" aria-hidden="true">•</span>
              <Link href="/#enroll">Enroll now</Link><span className="marquee-sep" aria-hidden="true">•</span>
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
