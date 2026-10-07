import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { PROJECT_SLUG } from "@/lib/constants";
import type { MarqueeItem, PublicOrganisation, PublicWorkshop } from "@/lib/types";
import { Header } from "@/components/Header";
import { BrandMark } from "@/components/BrandMark";
import { BatchStatusModal } from "@/components/BatchStatusModal";
import { CertificateSection } from "@/components/CertificateSection";
import { EnrollForm } from "@/components/EnrollForm";

async function safeMarquee(): Promise<MarqueeItem[]> {
  try {
    return await apiFetch<MarqueeItem[]>(`/public/${PROJECT_SLUG}/marquee`);
  } catch {
    return [];
  }
}

async function safeOrganisations(): Promise<PublicOrganisation[]> {
  try {
    return await apiFetch<PublicOrganisation[]>(`/public/${PROJECT_SLUG}/organisations`);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [marqueeItems, organisations, enableWorkshop] = await Promise.all([
    safeMarquee(),
    safeOrganisations(),
    apiFetch<PublicWorkshop>(`/public/${PROJECT_SLUG}/workshops/enable`),
  ]);

  return (
    <>
      <Header marqueeItems={marqueeItems} />

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <div className="wrap">
            <div className="hero-grid">
              <div>
                <div className="eyebrow">A DRIIV initiative · Supported by OPPO India</div>
                <h1>A national capacity building program for MSMEs.</h1>
                <p className="lead" style={{ marginTop: 18 }}>Most Indian MSMEs can build products that work. Far fewer can prove — with certification, process discipline and consistent quality — that they belong in a global supply chain. TRUST-ESDM closes that gap.</p>
                <p className="lead">We are now taking the program to every state capital, delivered with PHD Chamber of Commerce, Industry Association &amp; Industry and state MSME associations.</p>
                <div className="hero-cta">
                  <a href="#enroll" className="btn btn-copper">Enroll your business</a>
                  <a href="#partners" className="btn btn-ghost">Partner with us</a>
                </div>
              </div>
              <div className="board" aria-hidden="true">
                <BrandMark />
              </div>
            </div>

            <div className="stats">
              <div className="stat"><b>3000+</b><span>MSME leaders trained over 2 years</span></div>
              <div className="stat"><b>28+</b><span>State capitals in the rollout plan</span></div>
              <div className="stat"><b>One day</b><span>Per cohort of 80–100 participants</span></div>
              <div className="stat"><b>Zero fee</b><span>CSR-funded for eligible MSMEs</span></div>
            </div>
          </div>
        </section>

        {/* ABOUT THE INITIATIVE */}
        <section className="section" id="initiative">
          <div className="wrap">
            <div className="eyebrow">About the initiative</div>
            <h2 className="title" style={{ maxWidth: "24ch" }}>The gap we are closing.</h2>
            <p className="lead">Working products and trusted products are not the same thing. Global buyers look for reliability, certification and consistent quality they can verify. TRUST-ESDM gives MSME leaders the knowledge, access and connections to get there — through five focused areas of support.</p>

            <div className="challenge-table">
              <div className="challenge-row challenge-head"><div>The gap</div><div>What the program does</div></div>
              <div className="challenge-row"><div>Capacity building</div><div>Leadership-focused programs aimed at heads and senior management.</div></div>
              <div className="challenge-row"><div>Weak reliability and standards practice</div><div>Expert-led compliance sessions.</div></div>
              <div className="challenge-row"><div>Testing infrastructure</div><div>Expert session on the availability of testing infrastructure and how to access it.</div></div>
              <div className="challenge-row"><div>Alignment with government schemes</div><div>Sector-specific guidance on the opportunities available to you.</div></div>
              <div className="challenge-row"><div>Growth capital hard to reach</div><div>Expert session from NBFCs and banks.</div></div>
            </div>
          </div>
        </section>

        {/* BAND */}
        <section className="section-tight">
          <div className="band">
            <div className="wrap">
              <div className="eyebrow">Trusted &amp; Reliable Upgradation for MSMEs</div>
              <h2>Backed by science, industry and government.</h2>
              <p className="lead">TRUST-ESDM is a DRIIV initiative, delivered in partnership with OPPO India as part of its CSR program, under the strategic guidance of the Office of the Principal Scientific Adviser to the Government of India.</p>
              <div className="trio">
                <div><b>DRIIV</b><span>Program design and delivery, trainers, lab and CoE access, certification, program office.</span></div>
                <div><b>Office of the PSA</b><span>Strategic guidance from the Government of India.</span></div>
                <div><b>OPPO India</b><span>CSR funding that keeps the program free for eligible MSMEs.</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* THE DAY */}
        <section className="section" id="day">
          <div className="wrap">
            <div className="eyebrow">THE PROGRAM</div>
            <h2 className="title">One day.</h2>
            <p className="lead">Each cohort of 80–100 participants spends one full day together — covering leadership, quality and compliance, and infrastructure, schemes and finance.</p>

            <div className="day-grid">
              <div className="slot">
                <h3>Leadership &amp; business enablement</h3>
                <ul>
                  <li>Scaling mindset and growth planning</li>
                  <li>New product thinking</li>
                  <li>Market access and bigger customers</li>
                </ul>
              </div>
              <div className="slot">
                <h3>Compliance, quality &amp; reliability</h3>
                <ul>
                  <li>Standards and certification pathways</li>
                  <li>Manufacturing discipline that buyers can verify</li>
                  <li>Common failure points, seen up close</li>
                </ul>
              </div>
              <div className="slot">
                <h3>Infrastructure, schemes &amp; finance</h3>
                <ul>
                  <li>Testing infrastructure</li>
                  <li>Which schemes apply to you, and how to use them</li>
                  <li>Bank and NBFC linkage, plus the cohort network</li>
                </ul>
              </div>
            </div>

            <CertificateSection />

            <div style={{ marginTop: 56 }}>
              <div className="eyebrow">Who should be in the room</div>
              <p className="lead" style={{ marginBottom: 0 }}>Heads and key decision-makers at MSMEs in electronics manufacturing, sub-assembly, components, EMS and the wider supply chain — including these sectors:</p>
              <div className="tags">
                <span className="tag">Electronics manufacturing</span><span className="tag">Sub-assembly</span><span className="tag">Components</span><span className="tag">EMS</span>
                <span className="tag">Auto electronics</span><span className="tag">Automobile</span><span className="tag">Industrial systems</span><span className="tag">Solar</span>
                <span className="tag">Semiconductor-linked units</span><span className="tag">Wider supply chain</span>
              </div>
            </div>
          </div>
        </section>

        {/* ROLLOUT */}
        <section className="section" id="rollout" style={{ background: "var(--paper-2)" }}>
          <div className="wrap">
            <div className="eyebrow">Rollout</div>
            <h2 className="title">How a state capital launch runs.</h2>
            <p className="lead">Six simple steps take the program from planning to certified participants. Indicatively, each capital hosts two to three cohorts, phased across the two-year rollout.</p>

            <div className="steps">
              <div className="step"><div className="dot">1</div><b>Plan the event</b><span>Name one nodal person from the chamber and each association.</span></div>
              <div className="step"><div className="dot">2</div><b>Map the state</b><span>Clusters, member base, available labs, CoEs and host factories.</span></div>
              <div className="step"><div className="dot">3</div><b>Map the event</b><span>In the capital, with state government, chamber leadership and industry.</span></div>
              <div className="step"><div className="dot">4</div><b>Nominate</b><span>Associations nominate members; the team confirms each cohort.</span></div>
              <div className="step"><div className="dot">5</div><b>Run the cohorts</b><span>A full day of sessions plus a lab or cleanroom walkthrough.</span></div>
              <div className="step"><div className="dot">6</div><b>Certify &amp; connect</b><span>Certification and networking.</span></div>
            </div>
          </div>
        </section>

        {/* PARTNERS */}
        <section className="section" id="partners">
          <div className="wrap">
            <div className="eyebrow">For chambers &amp; associations</div>
            <h2 className="title">Bring TRUST-ESDM to your state.</h2>

            <div className="split" style={{ marginTop: 32 }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", marginBottom: 18 }}>What partner associations gain</h3>
                <ul className="outcome-list">
                  <li><span className="check">✓</span><span>A funded, ready-to-run capability program for your member base — no cost to the chamber or to members.</span></li>
                  <li><span className="check">✓</span><span>A visible state-capital platform with senior government and industry participation.</span></li>
                  <li><span className="check">✓</span><span>Co-branding on certificates, launch events and program communication.</span></li>
                  <li><span className="check">✓</span><span>A pipeline of members moving into higher-value, sector-specific work.</span></li>
                </ul>
              </div>
              <div>
                <h3 style={{ fontSize: "1.25rem", marginBottom: 18 }}>Who does what</h3>
                <div className="challenge-table" style={{ marginTop: 0 }}>
                  <div className="challenge-row who-row"><div>DRIIV</div><div>Program design and delivery, trainers, lab and CoE access, certification, program office.</div></div>
                  <div className="challenge-row who-row"><div>PHD Chamber of Commerce, Industry Association &amp; Industry</div><div>State chapter convening, launch event, government and institutional access, industry speakers.</div></div>
                  <div className="challenge-row who-row"><div>State MSME associations</div><div>Member mobilisation, cohort nomination (80 to 100 members), local venue, follow-through with participants.</div></div>
                  <div className="challenge-row who-row"><div>Host infrastructure</div><div>Will be decided mutually.</div></div>
                  <div className="challenge-row who-row"><div>OPPO India</div><div>CSR funding.</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <BatchStatusModal />

        {/* ENROLL */}
        <section className="section" id="enroll" style={{ background: "var(--paper-2)" }}>
          <div className="wrap" style={{ textAlign: "center" }}>
            <div className="eyebrow" style={{ justifyContent: "center" }}>Next step</div>
            <h2 className="title">Tell us where to start.</h2>
            <p className="lead" style={{ margin: "0 auto" }}>We are ready to start with a state-wise schedule and open the first capitals. Tell us which state you are in, and we will bring the program and the trainers.</p>
          </div>
          <div className="enroll">
            <EnrollForm workshopId={enableWorkshop._id} organisations={organisations} />
          </div>
          <div className="wrap" style={{ textAlign: "center", marginTop: 28 }}>
            <p style={{ color: "var(--ink-soft)", margin: 0 }}>
              Prefer to talk? Call <a href="tel:+916388408804" style={{ fontWeight: 600, color: "var(--trace-deep)" }}>+91 63884 08804</a>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="section" id="faq">
          <div className="wrap" style={{ maxWidth: 820 }}>
            <div className="eyebrow">Questions, answered simply</div>
            <h2 className="title">Common questions</h2>

            <div className="faq-list">
              <details className="faq-item">
                <summary className="faq-q">Is there a fee to attend? <span className="plus">+</span></summary>
                <div className="faq-a"><p>No. TRUST-ESDM is CSR-funded by OPPO India, so there is zero fee for eligible MSMEs, and no cost to the chamber or associations that host a cohort.</p></div>
              </details>
              <details className="faq-item">
                <summary className="faq-q">How long is the program? <span className="plus">+</span></summary>
                <div className="faq-a"><p>Each cohort is one full day, plus a lab or cleanroom walkthrough. Around 80–100 participants join each cohort.</p></div>
              </details>
              <details className="faq-item">
                <summary className="faq-q">Where will it happen? <span className="plus">+</span></summary>
                <div className="faq-a"><p>In state capitals — 28+ are in the rollout plan, opened state by state over two years. Host infrastructure is decided mutually with the local chamber and associations.</p></div>
              </details>
              <details className="faq-item">
                <summary className="faq-q">Do I get a certificate? <span className="plus">+</span></summary>
                <div className="faq-a"><p>Yes. Every participant receives a joint certificate from DRIIV and OPPO India, verifiable online by QR code.</p></div>
              </details>
              <details className="faq-item">
                <summary className="faq-q">Who should attend? <span className="plus">+</span></summary>
                <div className="faq-a"><p>Heads and key decision-makers at MSMEs in electronics manufacturing, sub-assembly, components, EMS and the wider supply chain, including auto electronics, automobile, industrial systems, solar and semiconductor-linked units.</p></div>
              </details>
              <details className="faq-item">
                <summary className="faq-q">How can our association bring it to our state? <span className="plus">+</span></summary>
                <div className="faq-a"><p>Call us on <a href="tel:+916388408804">+91 63884 08804</a> and tell us your state. We will map the state with you, name a nodal person, and plan the launch event together.</p></div>
              </details>
              <details className="faq-item">
                <summary className="faq-q">Who runs the program? <span className="plus">+</span></summary>
                <div className="faq-a"><p>DRIIV — the Delhi Science &amp; Technology Cluster — runs the program office, under the strategic guidance of the Office of the Principal Scientific Adviser to the Government of India.</p></div>
              </details>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap foot-grid">
          <div>
            <div className="fbrand">TRUST-ESDM</div>
            <p style={{ maxWidth: "38ch", color: "rgba(255,255,255,.72)", marginTop: 10 }}>Trusted &amp; Reliable Upgradation for MSMEs.</p>
            <div className="footer-logos">
              <BrandMark className="footer-logo-esdm" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="footer-logo-driiv" src="/assets/driiv.png" alt="DRIIV" />
              <div className="footer-logo-oppo-box">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/oppo-logo.png" alt="OPPO India" />
              </div>
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ color: "#E4B94C" }}>Quick links</div>
            <div className="footer-links">
              <a href="#initiative">About</a>
              <a href="#day">The day</a>
              <a href="#rollout">Rollout</a>
              <a href="#partners">Partners</a>
              <a href="#faq">Questions</a>
              <Link href="/verify">Verify Certificate</Link>
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ color: "#E4B94C" }}>Contact</div>
            <div className="footer-links">
              <a href="https://trust-esdm.com">trust-esdm.com</a>
              <a href="tel:+916388408804">+91 63884 08804</a>
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ color: "#E4B94C" }}>Program office</div>
            <p style={{ margin: "10px 0 0", color: "rgba(255,255,255,.75)", fontSize: ".92rem" }}>DRIIV — Delhi Science &amp; Technology Cluster</p>
          </div>
        </div>
        <div className="wrap">
          <small>TRUST-ESDM — a DRIIV initiative, delivered in partnership with OPPO India as part of its CSR program, under the strategic guidance of the Office of the Principal Scientific Adviser to the Government of India. © 2026 DRIIV.</small>
        </div>
      </footer>
    </>
  );
}
