"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCompletedProfile } from "@/lib/auth";
import { formatEventSchedule } from "@/lib/content";
import { isEventClosed } from "@/lib/events";
import { notifyUser } from "@/lib/app-notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function eventPath(eventId: string) {
  return `/actualites/evenements/${eventId}` as Route;
}

function appendFeedback(eventId: string, key: "status" | "error", value: string) {
  const url = new URL(eventPath(eventId), "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}` as Route;
}

async function revalidateEventPaths(eventId: string) {
  revalidatePath("/", "layout");
  revalidatePath("/actualites");
  revalidatePath("/association");
  revalidatePath("/admin/evenements");
  revalidatePath(eventPath(eventId));
}

export async function registerForEvent(formData: FormData): Promise<void> {
  const eventId = normalizeText(formData.get("eventId"));
  const contactEmail = normalizeOptionalText(formData.get("contactEmail"));
  const contactPhone = normalizeOptionalText(formData.get("contactPhone"));
  const note = normalizeOptionalText(formData.get("note"));

  if (!eventId) {
    redirect("/actualites?error=event-not-found" as Route);
  }

  const { user } = await requireCompletedProfile(eventPath(eventId));
  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, title, starts_at, published_at")
    .eq("id", eventId)
    .not("published_at", "is", null)
    .maybeSingle();

  if (!event) {
    redirect(appendFeedback(eventId, "error", "event-not-found"));
  }

  if (isEventClosed(event.starts_at)) {
    redirect(appendFeedback(eventId, "error", "event-closed"));
  }

  const { error } = await supabase.from("event_registrations").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      contact_email: contactEmail ?? user.email ?? null,
      contact_phone: contactPhone,
      note,
      status: "registered",
    },
    { onConflict: "event_id,user_id" },
  );

  if (error) {
    redirect(appendFeedback(eventId, "error", "registration-failed"));
  }

  await notifyUser({
    userId: user.id,
    kind: "event",
    title: `Inscription enregistrée: ${event.title}`,
    body: `Votre demande est bien prise en compte pour ${formatEventSchedule({
      startsAt: event.starts_at,
      endsAt: null,
    })}.`,
    href: eventPath(eventId),
  });

  await revalidateEventPaths(eventId);
  redirect(appendFeedback(eventId, "status", "registration-saved"));
}

export async function cancelEventRegistration(formData: FormData): Promise<void> {
  const eventId = normalizeText(formData.get("eventId"));
  if (!eventId) {
    redirect("/actualites?error=event-not-found" as Route);
  }

  const { user } = await requireCompletedProfile(eventPath(eventId));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "cancelled" })
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  if (error) {
    redirect(appendFeedback(eventId, "error", "cancellation-failed"));
  }

  await revalidateEventPaths(eventId);
  redirect(appendFeedback(eventId, "status", "registration-cancelled"));
}
