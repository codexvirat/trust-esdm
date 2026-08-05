import fs from "node:fs/promises";
import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { resolveUploadsPath } from "../middleware/upload";
import type { BatchReportData, BatchReportCandidateRow, BatchReportSessionRow, BatchReportTrainerRow, SessionAttendanceStatus } from "./batchReport.service";

const PAGE_WIDTH = 595.28; // A4 portrait, points
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const INK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.4, 0.44, 0.51);
const RULE = rgb(0.85, 0.87, 0.9);
const HEADER_FILL = rgb(0.93, 0.94, 0.96);

class ReportLayout {
  doc!: PDFDocument;
  regularFont!: PDFFont;
  boldFont!: PDFFont;
  page!: PDFPage;
  cursorY = 0;

  static async create(): Promise<ReportLayout> {
    const layout = new ReportLayout();
    layout.doc = await PDFDocument.create();
    layout.regularFont = await layout.doc.embedFont(StandardFonts.Helvetica);
    layout.boldFont = await layout.doc.embedFont(StandardFonts.HelveticaBold);
    layout.addPage();
    return layout;
  }

  addPage(): void {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.cursorY = PAGE_HEIGHT - MARGIN;
  }

  /** Adds a new page if the next block of the given height would run past the bottom margin. */
  ensureSpace(height: number): void {
    if (this.cursorY - height < MARGIN) this.addPage();
  }

  private wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  }

  drawHeading(text: string): void {
    this.ensureSpace(28);
    this.page.drawText(text, { x: MARGIN, y: this.cursorY - 16, size: 15, font: this.boldFont, color: INK });
    this.cursorY -= 22;
    this.page.drawLine({ start: { x: MARGIN, y: this.cursorY }, end: { x: MARGIN + CONTENT_WIDTH, y: this.cursorY }, thickness: 1, color: RULE });
    this.cursorY -= 12;
  }

  drawText(text: string, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; maxWidth?: number } = {}): void {
    const size = opts.size ?? 10;
    const font = opts.bold ? this.boldFont : this.regularFont;
    const color = opts.color ?? INK;
    const lines = this.wrapText(text, font, size, opts.maxWidth ?? CONTENT_WIDTH);
    for (const line of lines) {
      this.ensureSpace(size + 4);
      this.page.drawText(line, { x: MARGIN, y: this.cursorY - size, size, font, color });
      this.cursorY -= size + 4;
    }
  }

  /** Two-column label/value rows, e.g. batch metadata or summary stats. */
  drawKeyValueGrid(entries: [string, string][]): void {
    const colWidth = CONTENT_WIDTH / 2;
    const rowHeight = 18;
    for (let i = 0; i < entries.length; i += 2) {
      this.ensureSpace(rowHeight);
      const pair = entries.slice(i, i + 2);
      pair.forEach(([label, value], col) => {
        const x = MARGIN + col * colWidth;
        this.page.drawText(label, { x, y: this.cursorY - 11, size: 9, font: this.boldFont, color: MUTED });
        this.page.drawText(value, { x, y: this.cursorY - 11 - 12, size: 10, font: this.regularFont, color: INK });
      });
      this.cursorY -= rowHeight + 16;
    }
  }

  drawTable(columns: { header: string; width: number }[], rows: string[][]): void {
    const rowHeight = 16;
    const headerHeight = 20;

    const drawHeader = () => {
      this.ensureSpace(headerHeight);
      this.page.drawRectangle({ x: MARGIN, y: this.cursorY - headerHeight, width: CONTENT_WIDTH, height: headerHeight, color: HEADER_FILL });
      let x = MARGIN;
      for (const col of columns) {
        this.page.drawText(col.header, { x: x + 4, y: this.cursorY - headerHeight + 6, size: 8.5, font: this.boldFont, color: INK });
        x += col.width;
      }
      this.cursorY -= headerHeight;
    };

    drawHeader();
    for (const row of rows) {
      if (this.cursorY - rowHeight < MARGIN) {
        this.addPage();
        drawHeader();
      }
      let x = MARGIN;
      for (let i = 0; i < columns.length; i++) {
        const cellWidth = columns[i]!.width;
        const maxChars = Math.max(4, Math.floor(cellWidth / 4.5));
        const raw = row[i] ?? "";
        const cellText = raw.length > maxChars ? `${raw.slice(0, maxChars - 1)}…` : raw;
        this.page.drawText(cellText, { x: x + 4, y: this.cursorY - rowHeight + 5, size: 8.5, font: this.regularFont, color: INK });
        x += cellWidth;
      }
      this.page.drawLine({
        start: { x: MARGIN, y: this.cursorY - rowHeight },
        end: { x: MARGIN + CONTENT_WIDTH, y: this.cursorY - rowHeight },
        thickness: 0.5,
        color: RULE,
      });
      this.cursorY -= rowHeight;
    }
    this.cursorY -= 10;
  }

  async drawPhotosGrid(photoUrls: string[]): Promise<void> {
    const columns = 2;
    const gap = 12;
    const cellWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
    const cellHeight = 150;

    let col = 0;
    for (const url of photoUrls) {
      let imageBytes: Buffer;
      try {
        imageBytes = await fs.readFile(resolveUploadsPath(url));
      } catch {
        continue;
      }

      // Normalize every upload (jpeg/webp/gif/tiff/avif/…) to PNG so it can always be embedded —
      // pdf-lib itself only understands raw JPEG and PNG bytes.
      let image;
      try {
        const pngBytes = await sharp(imageBytes).png().toBuffer();
        image = await this.doc.embedPng(pngBytes);
      } catch {
        continue;
      }

      if (col === 0) this.ensureSpace(cellHeight + gap);
      const x = MARGIN + col * (cellWidth + gap);

      const scale = Math.min(cellWidth / image.width, cellHeight / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const offsetX = (cellWidth - drawWidth) / 2;
      const offsetY = (cellHeight - drawHeight) / 2;

      this.page.drawImage(image, { x: x + offsetX, y: this.cursorY - cellHeight + offsetY, width: drawWidth, height: drawHeight });

      col += 1;
      if (col === columns) {
        col = 0;
        this.cursorY -= cellHeight + gap;
      }
    }
    if (col !== 0) this.cursorY -= cellHeight + gap;
  }

  async save(): Promise<Buffer> {
    return Buffer.from(await this.doc.save());
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatTrainerRole(row: BatchReportTrainerRow): string {
  return row.roleInBatch === "lead" ? "Lead trainer" : "Co-trainer";
}

function formatSessionCell(status: SessionAttendanceStatus): string {
  if (status === "present") return "P";
  if (status === "late") return "L";
  if (status === "absent") return "A";
  return "—";
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`;
}

function formatRating(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}/5`;
}

function formatAssessment(row: BatchReportCandidateRow): string {
  const label = row.assessmentStatus === "not_started" ? "Not started" : row.assessmentStatus[0]!.toUpperCase() + row.assessmentStatus.slice(1);
  return row.assessmentPercentage === null ? label : `${label} (${Math.round(row.assessmentPercentage)}%)`;
}

function formatSessionRate(row: BatchReportSessionRow): string {
  if (row.totalEnrolled === 0) return "—";
  return `${Math.round(((row.presentCount + row.lateCount) / row.totalEnrolled) * 100)}%`;
}

function formatCertificate(row: BatchReportCandidateRow): string {
  if (row.certificateStatus === "issued") return `Issued${row.certificateNumber ? ` — ${row.certificateNumber}` : ""}`;
  if (row.certificateStatus === "draft") return "Draft";
  return "—";
}

export async function renderBatchReportPdf(data: BatchReportData): Promise<Buffer> {
  const layout = await ReportLayout.create();

  layout.page.drawText(data.batch.name, { x: MARGIN, y: layout.cursorY - 20, size: 20, font: layout.boldFont, color: INK });
  layout.cursorY -= 28;
  layout.drawText(`${data.workshopTitle} · Batch code ${data.batch.code}`, { size: 11, color: MUTED });
  layout.cursorY -= 6;

  layout.drawHeading("Batch details");
  layout.drawKeyValueGrid([
    ["Start date", formatDate(data.batch.startDate)],
    ["End date", formatDate(data.batch.endDate)],
    ["Status", data.batch.status[0]!.toUpperCase() + data.batch.status.slice(1)],
    ["Venue", data.batch.venueLabel ?? "—"],
    ["Attendance sessions held", String(data.totalSessions)],
    ["Report generated", formatDate(data.generatedAt)],
  ]);

  layout.drawHeading("Summary");
  layout.drawKeyValueGrid([
    ["Total enrollment", String(data.summary.totalEnrolled)],
    ["Average attendance", formatPercent(data.summary.averageAttendancePercent)],
    ["Certificates issued", String(data.summary.certifiedCount)],
    ["Assessments passed", String(data.summary.passedCount)],
    ["Average course rating", formatRating(data.summary.averageCourseRating)],
    ["Average trainer rating", formatRating(data.summary.averageTrainerRating)],
  ]);

  layout.drawHeading(`Trainers (${data.trainers.length})`);
  if (data.trainers.length === 0) {
    layout.drawText("No trainers assigned to this batch.", { color: MUTED });
  } else {
    layout.drawTable(
      [
        { header: "Name", width: 160 },
        { header: "Role", width: 90 },
        { header: "Email", width: 165 },
        { header: "Phone", width: 100 },
      ],
      data.trainers.map((row) => [row.fullName, formatTrainerRole(row), row.email, row.phone ?? "—"]),
    );
  }

  layout.drawHeading(`Attendance by session (${data.sessions.length})`);
  if (data.sessions.length === 0) {
    layout.drawText("No attendance sessions held yet.", { color: MUTED });
  } else {
    layout.drawTable(
      [
        { header: "Date", width: 70 },
        { header: "Session", width: 165 },
        { header: "Present", width: 65 },
        { header: "Late", width: 55 },
        { header: "Absent", width: 65 },
        { header: "Rate", width: 55 },
      ],
      data.sessions.map((row) => [
        formatDate(row.sessionDate),
        row.sessionLabel,
        String(row.presentCount),
        String(row.lateCount),
        String(row.absentCount),
        formatSessionRate(row),
      ]),
    );
  }

  if (data.sessions.length > 0 && data.candidates.length > 0) {
    layout.drawHeading("Candidate attendance by session");
    // A row is Name + one column per session — too many sessions would run off the page width, so
    // sessions are split into as many side-by-side chunks as fit (min 44pt/column, wide enough for
    // a "20 Jun"-style header) and stacked as separate tables rather than truncating the date.
    const nameColWidth = 130;
    const minSessionColWidth = 44;
    const availableForSessions = CONTENT_WIDTH - nameColWidth;
    const sessionsPerChunk = Math.max(1, Math.floor(availableForSessions / minSessionColWidth));

    for (let start = 0; start < data.sessions.length; start += sessionsPerChunk) {
      const chunk = data.sessions.map((session, index) => ({ session, index })).slice(start, start + sessionsPerChunk);
      const sessionColWidth = Math.min(90, availableForSessions / chunk.length);

      if (data.sessions.length > sessionsPerChunk) {
        layout.drawText(`Sessions ${formatShortDate(chunk[0]!.session.sessionDate)} – ${formatShortDate(chunk[chunk.length - 1]!.session.sessionDate)}`, {
          bold: true,
          size: 9,
          color: MUTED,
        });
      }

      layout.drawTable(
        [{ header: "Name", width: nameColWidth }, ...chunk.map(({ session }) => ({ header: formatShortDate(session.sessionDate), width: sessionColWidth }))],
        data.candidates.map((candidate) => [
          candidate.fullName,
          ...chunk.map(({ index }) => formatSessionCell(candidate.sessionAttendance[index] ?? null)),
        ]),
      );
    }
    layout.drawText("P = Present · L = Late · A = Absent · — = Not marked", { size: 8, color: MUTED });
    layout.cursorY -= 6;
  }

  layout.drawHeading(`Candidates (${data.candidates.length})`);
  if (data.candidates.length === 0) {
    layout.drawText("No candidates enrolled in this batch.", { color: MUTED });
  } else {
    layout.drawTable(
      [
        { header: "Name", width: 115 },
        { header: "Attendance", width: 50 },
        { header: "Assessment", width: 85 },
        { header: "Course rating", width: 65 },
        { header: "Trainer rating", width: 65 },
        { header: "Certificate", width: 135 },
      ],
      data.candidates.map((row) => [
        row.fullName,
        formatPercent(row.attendancePercent),
        formatAssessment(row),
        formatRating(row.courseRating),
        formatRating(row.trainerRating),
        formatCertificate(row),
      ]),
    );
  }

  if (data.batch.photoUrls.length > 0) {
    layout.drawHeading(`Photos (${data.batch.photoUrls.length})`);
    await layout.drawPhotosGrid(data.batch.photoUrls);
  }

  return layout.save();
}
