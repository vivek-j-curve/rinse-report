"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendNotificationEmail } from "@/lib/email/send-notification";
import type { Database } from "@/types/database";

type NotificationType = Database["public"]["Enums"]["notification_type"];
type AuditResource = Database["public"]["Enums"]["audit_resource"];

export async function getNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return { data: data ?? [] };
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return count ?? 0;
}

export async function markAllRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  revalidatePath("/", "layout");
}

export async function markRead(notificationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  revalidatePath("/", "layout");
}

// Internal helper — called from other server actions
export async function createNotificationsForOrg({
  organisationId,
  excludeUserId,
  targetUserIds,
  type,
  title,
  body,
  resourceId,
  resourceType,
  sendEmail,
  emailSubject,
  emailBody,
  actionUrl,
}: {
  organisationId: string;
  excludeUserId?: string;
  targetUserIds?: string[]; // if provided, only notify these users; otherwise admins/owners
  type: NotificationType;
  title: string;
  body?: string;
  resourceId?: string;
  resourceType?: AuditResource;
  sendEmail?: boolean;
  emailSubject?: string;
  emailBody?: string;
  actionUrl?: string;
}) {
  const admin = createAdminClient();

  // Resolve recipients
  let query = admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("organisation_id", organisationId);

  if (targetUserIds && targetUserIds.length > 0) {
    query = query.in("id", targetUserIds);
  } else {
    // Default: admins and owners
    query = query.in("role", ["admin", "owner"]);
  }

  const { data: recipients } = await query;
  if (!recipients || recipients.length === 0) return;

  const rows = recipients
    .filter((r) => r.id !== excludeUserId)
    .map((r) => ({
      user_id: r.id,
      organisation_id: organisationId,
      type,
      title,
      body: body ?? null,
      resource_id: resourceId ?? null,
      resource_type: resourceType ?? null,
      is_read: false,
      emailed: false,
    }));

  if (rows.length === 0) return;

  await admin.from("notifications").insert(rows);

  // Send emails if requested
  if (sendEmail && emailSubject && emailBody) {
    const emailRecipients = recipients.filter((r) => r.id !== excludeUserId && r.email);
    await Promise.allSettled(
      emailRecipients.map((r) =>
        sendNotificationEmail({
          toEmail: r.email!,
          toName: r.full_name,
          subject: emailSubject,
          body: emailBody,
          actionUrl,
        }).then(async () => {
          // mark emailed for this user's notification
          await admin
            .from("notifications")
            .update({ emailed: true })
            .eq("user_id", r.id)
            .eq("organisation_id", organisationId)
            .eq("title", title)
            .eq("type", type)
            .eq("emailed", false);
        })
      )
    );
  }
}
