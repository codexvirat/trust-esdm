import { Notification } from "../models/Notification";
import type { NotificationChannel } from "../types/enums";

/**
 * Stub dispatcher — records the notification and logs it. Wiring a real
 * email/SMS provider (Part 09 / Part 14 of the design doc) is a follow-up;
 * every caller already goes through this single choke point so swapping the
 * transport later touches one file, not every call site.
 */
export async function sendNotification(input: {
  projectId: string;
  recipientUserId?: string | null;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  relatedEntity?: { type: string; id: string };
}): Promise<void> {
  const record = await Notification.create({
    projectId: input.projectId,
    recipientUserId: input.recipientUserId ?? null,
    channel: input.channel,
    subject: input.subject,
    body: input.body,
    status: "sent",
    sentAt: new Date(),
    relatedEntity: input.relatedEntity ?? null,
  });

  console.log(`[notification:stub] -> ${input.channel} recipient=${input.recipientUserId ?? "n/a"} subject="${input.subject ?? ""}" (id=${record.id})`);
}
