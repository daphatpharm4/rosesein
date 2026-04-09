"use server";

import { redirect } from "next/navigation";

import { requireCompletedProfile } from "@/lib/auth";
import { bookAppointment } from "@/lib/professional-agenda";

export async function requestAppointment(
  slug: string,
  professionalId: string,
  formData: FormData,
) {
  const context = await requireCompletedProfile(`/professionnels/${slug}`);
  const profile = context.profile;
  const isAdmin = context.roles.includes("admin");
  const availabilityId = typeof formData.get("availabilityId") === "string"
    ? (formData.get("availabilityId") as string)
    : "";
  const patientNote = typeof formData.get("patientNote") === "string"
    ? (formData.get("patientNote") as string)
    : null;

  if (!profile) {
    redirect(`/account?status=complete-profile&redirectTo=${encodeURIComponent(`/professionnels/${slug}`)}`);
  }

  if (profile.profileKind === "professional" && !isAdmin) {
    redirect(`/professionnels/${slug}?error=booking-forbidden`);
  }

  if (!availabilityId) {
    redirect(`/professionnels/${slug}?error=booking-missing-slot`);
  }

  try {
    await bookAppointment({
      availabilityId,
      patientId: context.user.id,
      professionalId,
      patientNote,
    });
  } catch {
    redirect(`/professionnels/${slug}?error=booking-unavailable`);
  }

  redirect(`/professionnels/${slug}?status=booking-requested`);
}
