import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { PROJECT_SLUG } from "@/lib/constants";
import type { MarqueeItem, PublicOrganisation, PublicWorkshop } from "@/lib/types";
import { Header } from "@/components/Header";
import { BrandMark } from "@/components/BrandMark";
import { TracksSection } from "@/components/TracksSection";
import { BatchStatusModal } from "@/components/BatchStatusModal";
import { CertificateSection } from "@/components/CertificateSection";
import { EnrollForm } from "@/components/EnrollForm";
import { EnrollTrackProvider } from "@/components/EnrollTrackContext";

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
  const [marqueeItems, organisations, enableWorkshop, leadWorkshop] = await Promise.all([
    safeMarquee(),
    safeOrganisations(),
    apiFetch<PublicWorkshop>(`/public/${PROJECT_SLUG}/workshops/enable`),
    apiFetch<PublicWorkshop>(`/public/${PROJECT_SLUG}/workshops/lead`),
  ]);

  const tracks = [
    { key: "enable", id: enableWorkshop._id, label: "ENABLE — foundational program" },
    { key: "lead", id: leadWorkshop._id, label: "LEAD — advanced program" },
  ];

  return (
    <EnrollTrackProvider>
      <Header marqueeItems={marqueeItems} />

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <div className="eyebrow">TRUST-ESDM · A CSR Initiative of OPPO India</div>
              <h1>Build Products your customers can trust.</h1>
              <p className="lead">A two-year, hands-on program helping India&apos;s electronics and manufacturing MSMEs move from making products that work to making products the world trusts — reliable, certified, and ready to scale.</p>
              <div className="hero-cta">
                <a href="#enroll" className="btn btn-copper">Enroll your business</a>
                <a href="#tracks" className="btn btn-ghost">Certification Tracks</a>
              </div>
              <div className="stat-row">
                <div className="stat"><b>2,200+</b><span>MSME leaders to be trained, PAN-India</span></div>
                <div className="stat"><b>2 tracks</b><span>ENABLE and LEAD — pick what fits you</span></div>
                <div className="stat"><b>2 years</b><span>Nationwide rollout, cohort by cohort</span></div>
              </div>
            </div>
            <div className="board" aria-hidden="true">
              <BrandMark />
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="section-tight" id="about">
          <div className="wrap" style={{ maxWidth: 820 }}>
            <div className="eyebrow">About the initiative</div>
            <h2 style={{ fontSize: "2rem" }}>Helping India&apos;s MSMEs earn a place in global electronics supply chains.</h2>
            <p className="lead" style={{ maxWidth: "none" }}>As India works to integrate more deeply into global electronics and semiconductor value chains, a structural gap keeps showing up: many MSMEs can produce functional electronic products, but far fewer are equipped to deliver reliable, certified, globally trusted products at scale. Moving from &quot;functional&quot; to &quot;production-grade&quot; takes more than good design and assembly — it takes reliability practices, compliance know-how, and consistent quality that global buyers can verify.</p>
            <p className="lead" style={{ maxWidth: "none", marginTop: 18 }}>Without that, MSMEs stay confined to low-value work — contract manufacturing, sub-assembly, localised supply — while higher-value opportunities in automotive electronics, industrial systems, and semiconductor-linked manufacturing stay out of reach. TRUST-ESDM was built to close exactly this gap, acting as a single execution platform that brings industry, government, academia, and infrastructure providers together around one goal: moving MSMEs from functional capability to globally reliable, trusted production.</p>
          </div>
        </section>

        {/* GAP TABLE */}
        <section className="section-tight">
          <div className="wrap" style={{ maxWidth: 960 }}>
            <div className="eyebrow">The gap, and how we close it</div>
            <div className="gap-table-wrap">
              <table className="gap-table">
                <thead>
                  <tr><th>Key challenge</th><th>How TRUST-ESDM helps</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="challenge">Inadequate skilling &amp; training</td>
                    <td className="solution">DRIIV designs and runs leadership-focused programs aimed squarely at decision-makers, not just staff.</td>
                  </tr>
                  <tr>
                    <td className="challenge">Gaps in reliability &amp; standards</td>
                    <td className="solution">Live factory immersion, expert-led sessions, and structured exposure build real standards awareness.</td>
                  </tr>
                  <tr>
                    <td className="challenge">Weak links to testing infrastructure</td>
                    <td className="solution">DRIIV acts as a single-window connector, onboarding MSMEs to STPI labs, cleanrooms, and Centres of Excellence.</td>
                  </tr>
                  <tr>
                    <td className="challenge">Fragmented awareness of schemes</td>
                    <td className="solution">Simplified, sector-specific guidance on government schemes, backed by direct access to officials and experts.</td>
                  </tr>
                  <tr>
                    <td className="challenge">Limited access to finance</td>
                    <td className="solution">Structured linkages with banks and NBFCs, paired with support to get finance-ready.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* BACKERS */}
        <section className="section-tight">
          <div className="wrap split">
            <div>
              <div className="eyebrow">Who&apos;s behind this</div>
              <div className="backer-logo backer-logo-driiv">
                <span className="backer-name">DRIIV</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/driiv.png" alt="DRIIV — Office of the Principal Scientific Adviser to the Government of India" />
              </div>
              <p className="lead" style={{ maxWidth: "none" }}>DRIIV is one of eight Science &amp; Technology clusters set up across India to turn scientific research into socio-economic impact, in line with the country&apos;s Atmanirbhar Bharat vision. It brings together academic institutions, national and state research labs, industry partners, start-ups, MSMEs, ministries, and state governments — all working toward problems of national relevance, under the strategic guidance of the Office of the Principal Scientific Adviser (PSA) to the Government of India.</p>
            </div>
            <div>
              <div className="eyebrow">Supported by</div>
              <div className="backer-logo backer-logo-oppo">
                <span className="backer-name">OPPO</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/oppo-logo.png" alt="OPPO India" />
              </div>
              <p className="lead" style={{ maxWidth: "none" }}>OPPO India, a manufacturer and distributor of mobile phones, IoT products and wearables, supports TRUST-ESDM as part of its corporate social responsibility program under Section 135 of the Companies Act, 2013. DRIIV designs and delivers the program end-to-end, ensuring it is implemented for the benefit of participating MSMEs and the wider community.</p>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="section" id="program">
          <div className="wrap problem-grid">
            <div>
              <div className="eyebrow">Why this program exists</div>
              <h2 style={{ fontSize: "2rem" }}>Functionality is essential, but trust is what sets product apart</h2>
              <p className="lead">Most Indian MSMEs can build products that function. Far fewer can prove — with certification, process discipline, and consistent quality — that they belong in a global supply chain. That gap keeps good businesses stuck in low-value work.</p>
            </div>
            <ul className="pin-list">
              <li><span className="pin-dot" /><div><b>Skilling gaps</b><span>Leadership and teams lack structured training on reliability and scale.</span></div></li>
              <li><span className="pin-dot" /><div><b>Weak lab access</b><span>Limited links to testing facilities, cleanrooms, and Centres of Excellence.</span></div></li>
              <li><span className="pin-dot" /><div><b>Confusing schemes</b><span>Government support exists, but it&apos;s scattered and hard to navigate alone.</span></div></li>
              <li><span className="pin-dot" /><div><b>Hard-to-reach finance</b><span>Growth capital is out there, but the path to it isn&apos;t always clear.</span></div></li>
            </ul>
          </div>
        </section>

        {/* ACRONYM BAND */}
        <section className="section-tight">
          <div className="band">
            <div className="wrap">
              <div className="eyebrow" style={{ color: "#E4B94C" }}>What TRUST-ESDM stands for</div>
              <h2>One program, built to move MSMEs from functional to globally trusted.</h2>
              <p className="lead">TRUST-ESDM brings together industry, government, academia and infrastructure providers in a single execution platform — led by DRIIV (Delhi Science &amp; Technology Cluster - A Flagship Programme of the O/o Principal Scientific Adviser to the GoI), under the strategic guidance of the Office of the Principal Scientific Adviser to the Government of India.</p>
              <div className="acronym">
                <div><div className="letter">T·R</div><div className="word">Trusted &amp; Reliable</div></div>
                <div><div className="letter">U</div><div className="word">Upgradation</div></div>
                <div><div className="letter">F·S</div><div className="word">for Semiconductor</div></div>
                <div><div className="letter">E·T</div><div className="word">&amp; elecTronics</div></div>
                <div><div className="letter">M</div><div className="word">MSMEs</div></div>
              </div>
            </div>
          </div>
        </section>

        <TracksSection />
        <BatchStatusModal />
        <CertificateSection />

        {/* JOURNEY */}
        <section className="section" id="journey">
          <div className="wrap">
            <div className="eyebrow">How it works</div>
            <h2 style={{ fontSize: "2rem" }}>Seven simple steps, start to finish.</h2>
            <div className="journey">
              <div className="journey-track">
                <div className="node"><div className="dot">1</div><b>Apply</b><span>Fill the short form below — it takes two minutes.</span></div>
                <div className="node"><div className="dot">2</div><b>Get matched</b><span>We place you in ENABLE or LEAD based on your stage.</span></div>
                <div className="node"><div className="dot">3</div><b>Registration</b><span>Register yourself on the TRUST-ESDM portal.</span></div>
                <div className="node"><div className="dot">4</div><b>Attend sessions</b><span>Join your cohort for classroom and strategy sessions.</span></div>
                <div className="node"><div className="dot">5</div><b>Get hands-on</b><span>Visit labs, cleanrooms, and live factory floors.</span></div>
                <div className="node"><div className="dot">6</div><b>Certification</b><span>A joint certificate by DRIIV (Delhi Science &amp; Technology Cluster) and OPPO India.</span></div>
                <div className="node"><div className="dot">7</div><b>Grow</b><span>Leave with a network, a plan, and a path to scale.</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* PROGRAM AT A GLANCE */}
        <section className="section-tight">
          <div className="band">
            <div className="wrap">
              <div className="eyebrow" style={{ color: "#E4B94C" }}>Program at a glance</div>
              <h2>Rolling out nationwide, in phases.</h2>
              <div className="glance-label">Participants trained, by year</div>
              <table className="glance-table">
                <thead>
                  <tr><th>Track</th><th>Year 1</th><th>Year 2</th></tr>
                </thead>
                <tbody>
                  <tr><td>ENABLE</td><td>750</td><td>950</td></tr>
                  <tr><td>LEAD</td><td>200</td><td>300</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* GOALS */}
        <section className="section-tight" id="goals">
          <div className="wrap">
            <div className="eyebrow">What we&apos;re aiming for</div>
            <h2 style={{ fontSize: "2rem" }}>Cumulative goals of the program.</h2>
            <ul className="pin-list two-col">
              <li><span className="pin-dot" /><div><b>2,200 MSME leaders enabled</b><span>Trained PAN-India across electronics and manufacturing domains.</span></div></li>
              <li><span className="pin-dot" /><div><b>A stronger MSME pipeline</b><span>Improved reliability, compliance, and manufacturing discipline.</span></div></li>
              <li><span className="pin-dot" /><div><b>Better use of national infrastructure</b><span>Higher utilisation of testing labs and Centres of Excellence.</span></div></li>
              <li><span className="pin-dot" /><div><b>Stronger, more competitive MSMEs</b><span>Entrepreneurship skills that support jobs and livelihoods in the community.</span></div></li>
            </ul>
          </div>
        </section>

        {/* WHO + OUTCOMES */}
        <section className="section" style={{ background: "var(--paper-2)", borderRadius: 28, margin: "0 24px", width: "auto" }}>
          <div className="wrap split">
            <div>
              <div className="eyebrow">Who it&apos;s for</div>
              <h2 style={{ fontSize: "1.8rem" }}>Electronics and manufacturing MSMEs, anywhere in India.</h2>
              <p className="lead">Owners, founders, and key decision-makers at MSMEs working in electronics manufacturing, sub-assembly, or the wider supply chain — anywhere in the country.</p>
            </div>
            <div>
              <div className="eyebrow">What you&apos;ll gain</div>
              <ul className="outcome-list">
                <li><span className="check">✓</span><span>Real-world learning through experienced trainers and Centres of Excellence.</span></li>
                <li><span className="check">✓</span><span>A clear, simplified view of government schemes and compliance pathways.</span></li>
                <li><span className="check">✓</span><span>Structured introductions to banks and NBFCs for growth capital.</span></li>
                <li><span className="check">✓</span><span>A peer network of leaders solving the same problems as you.</span></li>
                <li><span className="check">✓</span><span>A practical path toward qualifying as a trusted supplier to global OEMs.</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* ENROLL */}
        <section className="section" id="enroll">
          <div className="wrap" style={{ textAlign: "center" }}>
            <div className="eyebrow" style={{ justifyContent: "center" }}>Enroll</div>
            <h2 style={{ fontSize: "2rem" }}>Ready to move your business forward?</h2>
            <p className="lead" style={{ margin: "0 auto" }}>Tell us a little about your business. Someone from the DRIIV team will reach out to guide you to the right track.</p>
          </div>
          <div className="enroll">
            <EnrollForm tracks={tracks} organisations={organisations} />
          </div>
        </section>

        {/* FAQ */}
        <section className="section" id="faq">
          <div className="wrap" style={{ maxWidth: 820 }}>
            <div className="eyebrow">Questions, answered simply</div>
            <h2 style={{ fontSize: "2rem" }}>Common questions</h2>

            <div className="faq-list">
              <details className="faq-item">
                <summary className="faq-q">Is there a cost to join? <span className="plus">+</span></summary>
                <div className="faq-a"><p>No. TRUST-ESDM is delivered as a CSR-backed initiative in partnership with OPPO India, so there is no participation fee for eligible MSMEs.</p></div>
              </details>
              <details className="faq-item">
                <summary className="faq-q">Where do the sessions happen? <span className="plus">+</span></summary>
                <div className="faq-a"><p>Across host cities nationwide, with hands-on access to STPI labs, cleanrooms, and Centres of Excellence near you.</p></div>
              </details>
              <details className="faq-item">
                <summary className="faq-q">How long does the program run? <span className="plus">+</span></summary>
                <div className="faq-a"><p>TRUST-ESDM rolls out nationally over two years. Your own track — ENABLE or LEAD — takes just 3 to 4 days.</p></div>
              </details>
              <details className="faq-item">
                <summary className="faq-q">Who runs the program? <span className="plus">+</span></summary>
                <div className="faq-a"><p>DRIIV, one of India&apos;s Science &amp; Technology clusters, delivers the program under the strategic guidance of the Office of the Principal Scientific Adviser to the Government of India.</p></div>
              </details>
              <details className="faq-item">
                <summary className="faq-q">Can I switch tracks later? <span className="plus">+</span></summary>
                <div className="faq-a"><p>Yes — if you&apos;re not sure, choose &quot;Not sure yet&quot; on the form and our team will help you pick the right fit before you commit.</p></div>
              </details>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap foot-grid">
          <div>
            <div className="fbrand">TRUST-ESDM</div>
            <p style={{ maxWidth: "36ch", color: "rgba(255,255,255,.7)", marginTop: 10 }}>A DRIIV initiative, delivered in partnership with OPPO India as part of its CSR program.</p>
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
              <a href="#about">About</a>
              <a href="#program">The program</a>
              <a href="#tracks">Certification Tracks</a>
              <a href="#journey">How it works</a>
              <a href="#faq">Questions</a>
              <Link href="/verify">Verify Certificate</Link>
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ color: "#E4B94C" }}>Contact</div>
            <div className="footer-links">
              <a href="tel:+916388408804">+91-6388408804</a>
              <a href="mailto:trustesdm@gmail.com">trustesdm@gmail.com</a>
            </div>
          </div>
        </div>
        <div className="wrap">
          <small>© 2026 DRIIV.</small>
        </div>
      </footer>
    </EnrollTrackProvider>
  );
}
