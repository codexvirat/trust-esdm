"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { useEnrollTrack } from "./EnrollTrackContext";

type TrackKey = "enable" | "lead";

function scrollToEnroll() {
  document.getElementById("enroll")?.scrollIntoView({ behavior: "smooth" });
}

export function TracksSection() {
  const [modalTrack, setModalTrack] = useState<TrackKey | null>(null);
  const { setSelectedTrack } = useEnrollTrack();

  function enrollForTrack(track: TrackKey) {
    setModalTrack(null);
    setSelectedTrack(track);
    scrollToEnroll();
  }

  return (
    <>
      <section className="section" id="tracks">
        <div className="wrap">
          <div className="eyebrow">Choose your track</div>
          <h2 style={{ fontSize: "2rem" }}>Two tracks. One direction: forward.</h2>
          <p className="lead">ENABLE and LEAD are built for different stages of your journey. They&apos;re mutually exclusive, so you&apos;ll choose the one that matches where your business is today.</p>

          <div className="track-grid">
            <div className="chip" onClick={() => setModalTrack("enable")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setModalTrack("enable")}>
              <div className="chip-head">
                <h3>ENABLE <span className="days">4 days</span></h3>
                <button type="button" className="btn btn-primary chip-enroll-btn" onClick={(e) => { e.stopPropagation(); enrollForTrack("enable"); }}>Enroll now</button>
              </div>
              <p>A foundational program for leaders getting ready to move up the electronics value chain — reliability, compliance, and infrastructure access.</p>
              <ul className="modlist">
                <li><span className="num">01</span><span><b>Leadership &amp; Business Enablement</b> — scaling mindset, growth planning, new product thinking. (1 day)</span></li>
                <li><span className="num">02</span><span><b>Compliance, Quality &amp; Manufacturing Excellence</b> — classroom sessions plus hands-on access to labs, cleanrooms and Centres of Excellence. (2 days)</span></li>
                <li><span className="num">03</span><span><b>Exposure Visit</b> — live industrial immersion. (1 day)</span></li>
              </ul>
              <div className="chip-foot">
                <div className="chip-for">Best for: <b>Owners, Decision-makers and Senior Managers</b> starting to formalise reliability and quality practices. Cohorts of 25–30.</div>
              </div>
            </div>

            <div className="chip" onClick={() => setModalTrack("lead")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setModalTrack("lead")}>
              <div className="chip-head">
                <h3>LEAD <span className="days">3 days</span></h3>
                <button type="button" className="btn btn-primary chip-enroll-btn" onClick={(e) => { e.stopPropagation(); enrollForTrack("lead"); }}>Enroll now</button>
              </div>
              <p>An advanced program for leaders ready to scale, diversify, and enter higher-value domestic and global markets.</p>
              <ul className="modlist">
                <li><span className="num">01</span><span><b>Market Access &amp; Customer Engagement</b> — finding and winning bigger customers.</span></li>
                <li><span className="num">02</span><span><b>Finance, Policy &amp; Ecosystem Engagement</b> — structured links to banks, NBFCs, and government bodies.</span></li>
                <li><span className="num">03</span><span><b>Advanced Leadership &amp; Business Strategy</b> — supplier qualification for global OEMs and Tier-1 vendors.</span></li>
              </ul>
              <div className="chip-foot">
                <div className="chip-for">Best for: <b>Owners and Decision-makers ready to scale</b> who want direct networking with financial institutions and government leaders.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Modal open={modalTrack !== null} onClose={() => setModalTrack(null)} ariaLabel="track details">
        {modalTrack === "enable" && (
          <div>
            <h3>ENABLE <span className="days">4 days</span></h3>
            <p>A foundational program for leaders getting ready to move up the electronics value chain — reliability, compliance, and infrastructure access.</p>
            <ul className="modlist">
              <li><span className="num">01</span><span><b>Leadership &amp; Business Enablement</b> — scaling mindset, growth planning, new product thinking. (1 day)</span></li>
              <li><span className="num">02</span><span><b>Compliance, Quality &amp; Manufacturing Excellence</b> — classroom sessions plus hands-on access to labs, cleanrooms and Centres of Excellence. (2 days)</span></li>
              <li><span className="num">03</span><span><b>Exposure Visit</b> — live industrial immersion. (1 day)</span></li>
            </ul>
            <div className="chip-for" style={{ marginTop: 22, paddingTop: 18, borderTop: "1px dashed var(--line)" }}>Best for: <b>Owners, Decision-makers and Senior Managers</b> starting to formalise reliability and quality practices. Cohorts of 25–30.</div>
            <button type="button" className="btn btn-primary" style={{ marginTop: 22 }} onClick={() => enrollForTrack("enable")}>Enroll now</button>
          </div>
        )}
        {modalTrack === "lead" && (
          <div>
            <h3>LEAD <span className="days">3 days</span></h3>
            <p>An advanced program for leaders ready to scale, diversify, and enter higher-value domestic and global markets.</p>
            <ul className="modlist">
              <li><span className="num">01</span><span><b>Market Access &amp; Customer Engagement</b> — finding and winning bigger customers.</span></li>
              <li><span className="num">02</span><span><b>Finance, Policy &amp; Ecosystem Engagement</b> — structured links to banks, NBFCs, and government bodies.</span></li>
              <li><span className="num">03</span><span><b>Advanced Leadership &amp; Business Strategy</b> — supplier qualification for global OEMs and Tier-1 vendors.</span></li>
            </ul>
            <div className="chip-for" style={{ marginTop: 22, paddingTop: 18, borderTop: "1px dashed var(--line)" }}>Best for: <b>Owners and Decision-makers ready to scale</b> who want direct networking with financial institutions and government leaders.</div>
            <button type="button" className="btn btn-primary" style={{ marginTop: 22 }} onClick={() => enrollForTrack("lead")}>Enroll now</button>
          </div>
        )}
      </Modal>
    </>
  );
}
