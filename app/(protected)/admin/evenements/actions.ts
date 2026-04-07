"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { formatEventDateTimeInput, parseEventDateTimeInput } from "@/lib/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function appendFeedback(
  key: "status" | "error",
  value: string,
  eventId?: string | null,
) {
  const url = new URL("/admin/evenements", "http://localhost");
  url.searchParams.set(key, value);
  if (eventId) {
    url.searchParams.set("edit", eventId);
  }
  return `${url.pathname}${url.search}` as Route;
}

async function revalidateEventSurfaces(eventId: string) {
  revalidatePath("/", "layout");
  revalidatePath("/actualites");
  revalidatePath("/association");
  revalidatePath("/admin/evenements");
  revalidatePath(`/actualites/evenements/${eventId}`);
}

export async function saveAdminEvent(formData: FormData): Promise<void> {
  const eventId = normalizeOptionalText(formData.get("eventId"));
  const title = normalizeText(formData.get("title"));
  const description = normalizeText(formData.get("description"));
  const startsAtRaw = normalizeText(formData.get("startsAt"));
  const endsAtRaw = normalizeOptionalText(formData.get("endsAt"));
  const locationLabel = normalizeOptionalText(formData.get("locationLabel"));
  const publishNow = formData.get("publishNow") === "on";

  if (title.length < 4 || description.length < 10 || !startsAtRaw) {
    redirect(appendFeedback("error", "event-invalid", eventId));
  }

  const startsAt = parseEventDateTimeInput(startsAtRaw);
  const endsAt = endsAtRaw ? parseEventDateTimeInput(endsAtRaw) : null;

  if (!startsAt || (endsAtRaw && !endsAt)) {
    redirect(appendFeedback("error", "event-datetime-invalid", eventId));
  }

  if (endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    redirect(appendFeedback("error", "event-end-before-start", eventId));
  }

  const { user } = await requireStaff("/admin/evenements");
  const supabase = await createSupabaseServerClient();

  if (eventId) {
    const { data: existing } = await supabase
      .from("events")
      .select("id, published_at")
      .eq("id", eventId)
      .maybeSingle();

    if (!existing) {
      redirect(appendFeedback("error", "event-not-found"));
    }

    const nextPublishedAt = publishNow
      ? existing.published_at ?? new Date().toISOString()
      : null;

    const { error } = await supabase
      .from("events")
      .update({
        title,
        description,
        starts_at: startsAt,
        ends_at: endsAt,
        location_label: locationLabel,
        published_at: nextPublishedAt,
      })
      .eq("id", eventId);

    if (error) {
      redirect(appendFeedback("error", "event-save-failed", eventId));
    }

    await recordAdminAudit({
      actionType: "event.updated",
      targetKind: "event",
      targetId: eventId,
      summary: `Événement mis à jour: ${title}`,
      metadata: {
        startsAt,
        endsAt,
        locationLabel,
        published: Boolean(nextPublishedAt),
      },
    });

    await revalidateEventSurfaces(eventId);
    redirect(appendFeedback("status", "event-updated", eventId));
  }

  const publishedAt = publishNow ? new Date().toISOString() : null;
  const { data: created, error } = await supabase
    .from("events")
    .insert({
      title,
      description,
      starts_at: startsAt,
      ends_at: endsAt,
      location_label: locationLabel,
      created_by: user.id,
      published_at: publishedAt,
    })
    .select("id")
    .maybeSingle();

  if (error || !created) {
    redirect(appendFeedback("error", "event-save-failed"));
  }

  await recordAdminAudit({
    actionType: "event.created",
    targetKind: "event",
    targetId: created.id,
    summary: `Événement créé: ${title}`,
    metadata: {
      startsAt,
      endsAt,
      locationLabel,
      published: Boolean(publishedAt),
    },
  });

  await revalidateEventSurfaces(created.id);
  redirect(appendFeedback("status", "event-created", created.id));
}

export async function toggleAdminEventPublish(formData: FormData): Promise<void> {
  const eventId = normalizeText(formData.get("eventId"));
  if (!eventId) {
    redirect(appendFeedback("error", "event-not-found"));
  }

  await requireStaff("/admin/evenements");
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("events")
    .select("id, title, published_at")
    .eq("id", eventId)
    .maybeSingle();

  if (!existing) {
    redirect(appendFeedback("error", "event-not-found"));
  }

  const nextPublishedAt = existing.published_at ? null : new Date().toISOString();
  const { error } = await supabase
    .from("events")
    .update({ published_at: nextPublishedAt })
    .eq("id", eventId);

  if (error) {
    redirect(appendFeedback("error", "event-publish-failed", eventId));
  }

  await recordAdminAudit({
    actionType: nextPublishedAt ? "event.published" : "event.unpublished",
    targetKind: "event",
    targetId: eventId,
    summary: `${nextPublishedAt ? "Publication" : "Retrait"} de l'événement ${existing.title}`,
  });

  await revalidateEventSurfaces(eventId);
  redirect(
    appendFeedback(
      "status",
      nextPublishedAt ? "event-published" : "event-unpublished",
      eventId,
    ),
  );
}

export { formatEventDateTimeInput };
