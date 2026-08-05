import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getBatchReportData } from "../services/batchReport.service";
import { renderBatchReportPdf } from "../services/batchReportPdf.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";

export const generateReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const data = await getBatchReportData(resolveProjectId(req), req.params.workshopId as string, req.params.batchId as string);
  const pdfBuffer = await renderBatchReportPdf(data);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="batch-report-${data.batch.code}.pdf"`);
  res.send(pdfBuffer);
});
