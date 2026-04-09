"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Route } from "next";

import { parseEventDateTimeInput } from "@/lib/events";
import { requireProfessional } from "@/lib/auth";
import {
  createAvailability,
  updateAppointmentStatus,
  type AppointmentStatus,
} from "@/lib/professional-agenda";
import { getProfessionalProfileByUserId, type ConsultationMode } from "@/lib/professional";

function appendFeedback(targetPath: string, key: "status" | "error", value: string) {
  const url = new URL(targetPath, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}` as Route;
}

function normalizeConsultationMode(value: FormDataEntryValue | null): ConsultationMode | null {
  return value === "presentiel" || value === "telephone" || value === "visio" ? value : null;
}

function normalizeAppointmentStatus(value: AppointmentStatus): AppointmentStatus | null {
  return ["pending", "confirmed", "declined", "cancelled", "completed"].includes(value)
    ? value
    : null;
}

export async function createAvailabilitySlot(formData: FormData) {
  const { user } = await requireProfessional("/pro/agenda");
  const startsAt = parseEventDateTimeInput(String(formData.get("startsAt") ?? ""));
  const endsAt = parseEventDateTimeInput(String(formData.get("endsAt") ?? ""));
  const consultationMode = normalizeConsultationMode(formData.get("consultationMode"));
  const professionalProfile = await getProfessionalProfileByUserId(user.id);

  if (!startsAt || !endsAt || !consultationMode) {
    redirect("/pro/agenda?error=slot-invalid");
  }

  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    redirect("/pro/agenda?error=slot-range-invalid");
  }

  await createAvailability({
    professionalId: user.id,
    startsAt,
    endsAt,
    consultationMode,
    createdBy: user.id,
    isPublished: true,
  });

  revalidatePath("/pro");
  revalidatePath("/pro/agenda");
  if (professionalProfile) {
    revalidatePath(`/professionnels/${professionalProfile.slug}`);
  }

  redirect(appendFeedback("/pro/agenda", "status", "slot-created"));
}

export async function respondToAppointment(
  appointmentId: string,
  status: AppointmentStatus,
  formData: FormData,
) {
  await requireProfessional("/pro/agenda");
  const normalizedStatus = normalizeAppointmentStatus(status);

  if (!appointmentId || !normalizedStatus || normalizedStatus === "pending") {
    redirect("/pro/agenda?error=appointment-invalid");
  }

  const professionalNoteValue = formData.get("professionalNote");
  const professionalNote =
    typeof professionalNoteValue === "string" ? professionalNoteValue.trim() : null;

  await updateAppointmentStatus({
    appointmentId,
    status: normalizedStatus,
    professionalNote,
  });

  revalidatePath("/pro");
  revalidatePath("/pro/agenda");
  redirect(
    appendFeedback(
      "/pro/agenda",
      "status",
      normalizedStatus === "confirmed" ? "appointment-confirmed" : "appointment-updated",
    ),
  );
}
