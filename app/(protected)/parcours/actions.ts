"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCompletedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function appendFeedback(targetPath: string, key: "status" | "error", value: string) {
  const url = new URL(targetPath, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

function normalizeId(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeRequiredText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeScheduledFor(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  return `${match[1]}T${match[2]}:${match[3]}:00`;
}

export async function saveAppointment(formData: FormData) {
  const appointmentId = normalizeId(formData.get("appointmentId"));
  const title = normalizeRequiredText(formData.get("title"));
  const scheduledFor = normalizeScheduledFor(formData.get("scheduledFor"));
  const locationLabel = normalizeOptionalText(formData.get("locationLabel"));
  const contactLabel = normalizeOptionalText(formData.get("contactLabel"));
  const details = normalizeOptionalText(formData.get("details"));

  if (title.length < 2) {
    redirect("/parcours?error=appointment-title-required");
  }

  if (!scheduledFor) {
    redirect("/parcours?error=appointment-date-required");
  }

  const { user } = await requireCompletedProfile("/parcours");
  const supabase = await createSupabaseServerClient();

  if (appointmentId) {
    const { data, error } = await supabase
      .from("user_appointments")
      .update({
        title,
        scheduled_for: scheduledFor,
        location_label: locationLabel,
        contact_label: contactLabel,
        details,
      })
      .eq("id", appointmentId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      redirect("/parcours?error=appointment-save-failed");
    }

    revalidatePath("/parcours");
    redirect(appendFeedback("/parcours", "status", "appointment-updated"));
  }

  const { error } = await supabase.from("user_appointments").insert({
    user_id: user.id,
    title,
    scheduled_for: scheduledFor,
    location_label: locationLabel,
    contact_label: contactLabel,
    details,
  });

  if (error) {
    redirect("/parcours?error=appointment-save-failed");
  }

  revalidatePath("/parcours");
  redirect(appendFeedback("/parcours", "status", "appointment-created"));
}

export async function deleteAppointment(formData: FormData) {
  const appointmentId = normalizeId(formData.get("appointmentId"));

  if (!appointmentId) {
    redirect("/parcours?error=appointment-delete-failed");
  }

  const { user } = await requireCompletedProfile("/parcours");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_appointments")
    .delete()
    .eq("id", appointmentId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect("/parcours?error=appointment-delete-failed");
  }

  revalidatePath("/parcours");
  redirect(appendFeedback("/parcours", "status", "appointment-deleted"));
}

export async function savePersonalNote(formData: FormData) {
  const noteId = normalizeId(formData.get("noteId"));
  const title = normalizeRequiredText(formData.get("title"));
  const body = normalizeRequiredText(formData.get("body"));

  if (title.length < 2) {
    redirect("/parcours?error=note-title-required");
  }

  if (body.length < 4) {
    redirect("/parcours?error=note-body-required");
  }

  const { user } = await requireCompletedProfile("/parcours");
  const supabase = await createSupabaseServerClient();

  if (noteId) {
    const { data, error } = await supabase
      .from("personal_notes")
      .update({
        title,
        body,
      })
      .eq("id", noteId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      redirect("/parcours?error=note-save-failed");
    }

    revalidatePath("/parcours");
    redirect(appendFeedback("/parcours", "status", "note-updated"));
  }

  const { error } = await supabase.from("personal_notes").insert({
    user_id: user.id,
    title,
    body,
  });

  if (error) {
    redirect("/parcours?error=note-save-failed");
  }

  revalidatePath("/parcours");
  redirect(appendFeedback("/parcours", "status", "note-created"));
}

export async function deletePersonalNote(formData: FormData) {
  const noteId = normalizeId(formData.get("noteId"));

  if (!noteId) {
    redirect("/parcours?error=note-delete-failed");
  }

  const { user } = await requireCompletedProfile("/parcours");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("personal_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect("/parcours?error=note-delete-failed");
  }

  revalidatePath("/parcours");
  redirect(appendFeedback("/parcours", "status", "note-deleted"));
}

export async function saveMoodCheckIn(formData: FormData) {
  const mood = formData.get("mood");
  if (typeof mood !== "string" || !["1", "2", "3", "4", "5"].includes(mood)) {
    redirect("/parcours?error=mood-invalid");
  }

  const { user } = await requireCompletedProfile("/parcours");
  const supabase = await createSupabaseServerClient();

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const moodLabels: Record<string, string> = {
    "1": "Très difficile",
    "2": "Difficile",
    "3": "Correct",
    "4": "Bien",
    "5": "Très bien",
  };

  const { error } = await supabase.from("personal_notes").insert({
    user_id: user.id,
    title: `Humeur — ${today}`,
    body: `${moodLabels[String(mood)]} (${mood}/5)`,
  });

  if (error) {
    redirect("/parcours?error=note-save-failed");
  }

  revalidatePath("/parcours");
  redirect(appendFeedback("/parcours", "status", "note-created"));
}
