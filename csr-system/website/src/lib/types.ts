export interface MarqueeItem {
  _id: string;
  message: string;
  linkTarget: string;
}

export interface PublicWorkshop {
  _id: string;
  title: string;
  slug: string;
  status: string;
}

export interface PublicOrganisation {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  type?: string;
  addressLine1?: string;
  addressLine2?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  shortCode?: string;
  industry?: string;
  employeeCount?: number;
  establishedDate?: string;
}

export type PublicBatchStatus = "scheduled" | "ongoing" | "completed" | "cancelled";

export interface PublicBatch {
  _id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: PublicBatchStatus;
  venue?: { name?: string; address?: string; city?: string } | null;
}

export interface PublicBatchDetail extends PublicBatch {
  photos: { _id: string; url: string }[];
  workshop: { title: string; slug: string };
}
