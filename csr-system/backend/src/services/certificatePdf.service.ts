import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export interface CertificateFieldPosition {
  xPct: number;
  yPct: number;
  fontSize?: number;
  color?: string;
  align?: "left" | "center" | "right";
}

export interface CertificateQrPosition {
  xPct: number;
  yPct: number;
  widthPct: number;
}

export interface CertificateLayoutConfig {
  certificateNumber: CertificateFieldPosition;
  participantName: CertificateFieldPosition;
  location: CertificateFieldPosition;
  issueDate: CertificateFieldPosition;
  qr: CertificateQrPosition;
}

/** Fallback layout, tuned to the reference certificate.jpeg (landscape, ~1536x1024): cert no. top-center,
 * large centered participant name mid-page, location/date along the bottom, QR box bottom-right. */
export const DEFAULT_CERTIFICATE_LAYOUT: CertificateLayoutConfig = {
  certificateNumber: { xPct: 63, yPct: 6.5, fontSize: 15, align: "left" },
  participantName: { xPct: 50, yPct: 54, fontSize: 32, align: "center" },
  location: { xPct: 40, yPct: 78.5, fontSize: 13, align: "left" },
  issueDate: { xPct: 66, yPct: 78.5, fontSize: 13, align: "left" },
  qr: { xPct: 82, yPct: 79, widthPct: 7 },
};

function mergeField(base: CertificateFieldPosition, override?: Partial<CertificateFieldPosition>): CertificateFieldPosition {
  return { ...base, ...override };
}

export function mergeWithDefaults(partial?: Partial<CertificateLayoutConfig> | null): CertificateLayoutConfig {
  return {
    certificateNumber: mergeField(DEFAULT_CERTIFICATE_LAYOUT.certificateNumber, partial?.certificateNumber),
    participantName: mergeField(DEFAULT_CERTIFICATE_LAYOUT.participantName, partial?.participantName),
    location: mergeField(DEFAULT_CERTIFICATE_LAYOUT.location, partial?.location),
    issueDate: mergeField(DEFAULT_CERTIFICATE_LAYOUT.issueDate, partial?.issueDate),
    qr: { ...DEFAULT_CERTIFICATE_LAYOUT.qr, ...partial?.qr },
  };
}

function hexToRgb(hex?: string) {
  if (!hex) return rgb(0.06, 0.09, 0.16); // slate-900-ish default
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function drawField(page: PDFPage, font: PDFFont, text: string, field: CertificateFieldPosition, pageWidth: number, pageHeight: number) {
  const fontSize = field.fontSize ?? 16;
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  let x = (field.xPct / 100) * pageWidth;
  if (field.align === "center") x -= textWidth / 2;
  else if (field.align === "right") x -= textWidth;
  const y = pageHeight - (field.yPct / 100) * pageHeight - fontSize / 2;
  page.drawText(text, { x, y, size: fontSize, font, color: hexToRgb(field.color) });
}

export interface RenderCertificatePdfInput {
  backgroundImageAbsolutePath: string;
  layoutConfig: CertificateLayoutConfig;
  certificateNumber: string;
  participantName: string;
  location: string;
  issueDate: Date;
  verificationUrl: string;
}

export async function renderCertificatePdf(input: RenderCertificatePdfInput): Promise<Buffer> {
  const backgroundBytes = await fs.readFile(input.backgroundImageAbsolutePath);
  const ext = path.extname(input.backgroundImageAbsolutePath).toLowerCase();

  const doc = await PDFDocument.create();
  const backgroundImage = ext === ".png" ? await doc.embedPng(backgroundBytes) : await doc.embedJpg(backgroundBytes);

  const pageWidth = backgroundImage.width;
  const pageHeight = backgroundImage.height;
  const page = doc.addPage([pageWidth, pageHeight]);
  page.drawImage(backgroundImage, { x: 0, y: 0, width: pageWidth, height: pageHeight });

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const nameFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const dateLabel = input.issueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  drawField(page, font, input.certificateNumber, input.layoutConfig.certificateNumber, pageWidth, pageHeight);
  drawField(page, nameFont, input.participantName, input.layoutConfig.participantName, pageWidth, pageHeight);
  if (input.location) drawField(page, font, input.location, input.layoutConfig.location, pageWidth, pageHeight);
  drawField(page, font, dateLabel, input.layoutConfig.issueDate, pageWidth, pageHeight);

  const qrBytes = await QRCode.toBuffer(input.verificationUrl, { width: 512, margin: 1 });
  const qrImage = await doc.embedPng(qrBytes);
  const qrWidth = (input.layoutConfig.qr.widthPct / 100) * pageWidth;
  const qrX = (input.layoutConfig.qr.xPct / 100) * pageWidth - qrWidth / 2;
  const qrY = pageHeight - (input.layoutConfig.qr.yPct / 100) * pageHeight - qrWidth / 2;
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrWidth, height: qrWidth });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
