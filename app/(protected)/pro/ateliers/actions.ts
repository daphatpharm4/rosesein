"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfessionalTier } from "@/lib/auth";
import { parseEventDateTimeInput } from "@/lib/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeEventKind(value: FormDataEntryValue | null) {
  return value === "atelier" || value === "webinaire" ? value : null;
}

function appendFeedback(
  key: "status" | "error",
  value: string,
  eventId?: string | null,
) {
  const url = new URL("/pro/ateliers", "http://localhost");
  url.searchParams.set(key, value);
  if (eventId) {
    url.searchParams.set("edit", eventId);
  }
  return `${url.pathname}${url.search}` as Route;
}

async function requirePartnerProfessional() {
  return requireProfessionalTier(["partenaire"], {
    redirectTo: "/pro/ateliers",
    fallbackPath: "/pro",
    error: "events-tier-locked",
  });
}

async function revalidateProfessionalEventSurfaces(eventId: string, professionalSlug: string) {
  revalidatePath("/", "layout");
  revalidatePath("/actualites");
  revalidatePath("/association");
  revalidatePath("/pro");
  revalidatePath("/pro/ateliers");
  revalidatePath(`/actualites/evenements/${eventId}`);
  revalidatePath(`/professionnels/${professionalSlug}`);
}

export async function saveProfessionalEvent(formData: FormData): Promise<void> {
  const eventId = normalizeOptionalText(formData.get("eventId"));
  const eventKind = normalizeEventKind(formData.get("eventKind"));
  const title = normalizeText(formData.get("title"));
  const description = normalizeText(formData.get("description"));
  const startsAtRaw = normalizeText(formData.get("startsAt"));
  const endsAtRaw = normalizeOptionalText(formData.get("endsAt"));
  const locationLabel = normalizeOptionalText(formData.get("locationLabel"));
  const publishNow = formData.get("publishNow") === "on";

  if (!eventKind || title.length < 4 || description.length < 10 || !startsAtRaw) {
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

  const { user, professionalProfile } = await requirePartnerProfessional();
  const supabase = await createSupabaseServerClient();

  if (eventId) {
    const { data: existing } = await supabase
      .from("events")
      .select("id, published_at")
      .eq("id", eventId)
      .eq("professional_id", user.id)
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
        event_kind: eventKind,
      })
      .eq("id", eventId)
      .eq("professional_id", user.id);

    if (error) {
      redirect(appendFeedback("error", "event-save-failed", eventId));
    }

    await revalidateProfessionalEventSurfaces(eventId, professionalProfile.slug);
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
      event_kind: eventKind,
      professional_id: user.id,
    })
    .select("id")
    .maybeSingle();

  if (error || !created) {
    redirect(appendFeedback("error", "event-save-failed"));
  }

  await revalidateProfessionalEventSurfaces(created.id, professionalProfile.slug);
  redirect(appendFeedback("status", "event-created", created.id));
}

export async function toggleProfessionalEventPublish(formData: FormData): Promise<void> {
  const eventId = normalizeText(formData.get("eventId"));
  if (!eventId) {
    redirect(appendFeedback("error", "event-not-found"));
  }

  const { user, professionalProfile } = await requirePartnerProfessional();
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("events")
    .select("id, published_at")
    .eq("id", eventId)
    .eq("professional_id", user.id)
    .maybeSingle();

  if (!existing) {
    redirect(appendFeedback("error", "event-not-found"));
  }

  const nextPublishedAt = existing.published_at ? null : new Date().toISOString();
  const { error } = await supabase
    .from("events")
    .update({ published_at: nextPublishedAt })
    .eq("id", eventId)
    .eq("professional_id", user.id);

  if (error) {
    redirect(appendFeedback("error", "event-publish-failed", eventId));
  }

  await revalidateProfessionalEventSurfaces(eventId, professionalProfile.slug);
  redirect(
    appendFeedback(
      "status",
      nextPublishedAt ? "event-published" : "event-unpublished",
      eventId,
    ),
  );
}
