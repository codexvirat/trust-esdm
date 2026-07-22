import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { VerifyForm } from "@/components/VerifyForm";

export const metadata: Metadata = { title: "Certificate Verification — TRUST-ESDM" };

export default function VerifyLandingPage() {
  return (
    <>
      <Header marqueeItems={[]} />
      <main>
        <section className="section-tight">
          <div className="wrap" style={{ maxWidth: 640 }}>
            <div className="eyebrow">Certificate Verification</div>
            <h1 style={{ fontSize: "2rem" }}>Verify a certificate</h1>
            <p style={{ color: "var(--ink-soft)", marginTop: 8 }}>
              Enter the full certificate number printed on the certificate (including the company code, e.g. MAMH0001) to check its
              authenticity.
            </p>
            <VerifyForm />
          </div>
        </section>
      </main>
      <footer>
        <div className="wrap">
          <small>© 2026 DRIIV.</small>
        </div>
      </footer>
    </>
  );
}
