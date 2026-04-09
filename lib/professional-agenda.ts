import "server-only";

import { hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ConsultationMode } from "@/lib/professional";

export type AppointmentStatus = "pending" | "confirmed" | "declined" | "cancelled" | "completed";
export type AppointmentActor = "patient" | "professional" | "admin";

export const PATIENT_SELF_CANCELLATION_NOTICE_HOURS = 24;
export const LATE_CANCELLATION_NOTICE_HOURS = 48;
export const LATE_CANCELLATION_WINDOW_DAYS = 90;
export const LATE_CANCELLATION_LIMIT = 2;
export const LATE_CANCELLATION_BOOKING_PAUSE_DAYS = 30;

export type Availability = {
  id: string;
  professionalId: string;
  startsAt: string;
  endsAt: string;
  consultationMode: ConsultationMode;
  isPublished: boolean;
  createdAt: string;
};

export type ProfessionalAppointment = {
  id: string;
  availabilityId: string;
  patientId: string;
  patientDisplayName: string;
  professionalId: string;
  status: AppointmentStatus;
  patientNote: string | null;
  professionalNote: string | null;
  cancelledAt: string | null;
  cancelledBy: AppointmentActor | null;
  cancellationReason: string | null;
  lateCancellation: boolean;
  startsAt: string;
  endsAt: string;
  consultationMode: ConsultationMode;
  createdAt: string;
};

type AvailabilityRow = {
  id: string;
  professional_id: string;
  starts_at: string;
  ends_at: string;
  consultation_mode: ConsultationMode;
  is_published: boolean;
  created_at: string;
};

type AppointmentRow = {
  id: string;
  availability_id: string;
  patient_id: string;
  professional_id: string;
  status: AppointmentStatus;
  patient_note: string | null;
  professional_note: string | null;
  cancelled_at: string | null;
  cancelled_by: AppointmentActor | null;
  cancellation_reason: string | null;
  late_cancellation: boolean | null;
  created_at: string;
  professional_availabilities:
    | {
        starts_at: string;
        ends_at: string;
        consultation_mode: ConsultationMode;
      }
    | Array<{
        starts_at: string;
        ends_at: string;
        consultation_mode: ConsultationMode;
      }>;
};

function getAvailabilityRelation(
  value:
    | AppointmentRow["professional_availabilities"]
    | null
    | undefined,
) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function mapAvailabilityRow(row: AvailabilityRow): Availability {
  return {
    id: row.id,
    professionalId: row.professional_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    consultationMode: row.consultation_mode,
    isPublished: row.is_published,
    createdAt: row.created_at,
  };
}

export function getHoursUntilAppointment(value: string, now = new Date()) {
  return (new Date(value).getTime() - now.getTime()) / (1000 * 60 * 60);
}

export function canPatientCancelOwnAppointment(
  status: AppointmentStatus,
  startsAt: string,
  now = new Date(),
) {
  if (status === "pending") {
    return true;
  }

  if (status !== "confirmed") {
    return false;
  }

  return getHoursUntilAppointment(startsAt, now) >= PATIENT_SELF_CANCELLATION_NOTICE_HOURS;
}

export function isLateCancellationWindow(startsAt: string, now = new Date()) {
  return getHoursUntilAppointment(startsAt, now) < LATE_CANCELLATION_NOTICE_HOURS;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

type LateCancellationSnapshot = {
  cancelled_at: string | null;
};

export async function getPatientBookingRestriction(patientId: string) {
  const supabase = await createSupabaseServerClient();
  const thresholdDate = addDays(new Date(), -LATE_CANCELLATION_WINDOW_DAYS).toISOString();
  const { data, error } = await supabase
    .from("professional_appointments")
    .select("cancelled_at")
    .eq("patient_id", patientId)
    .eq("cancelled_by", "patient")
    .eq("late_cancellation", true)
    .not("cancelled_at", "is", null)
    .gte("cancelled_at", thresholdDate)
    .order("cancelled_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as LateCancellationSnapshot[];
  if (rows.length < LATE_CANCELLATION_LIMIT) {
    return {
      isBlocked: false,
      pauseUntil: null,
      lateCancellationCount: rows.length,
    };
  }

  const latestCancelledAt = rows[0]?.cancelled_at;
  if (!latestCancelledAt) {
    return {
      isBlocked: false,
      pauseUntil: null,
      lateCancellationCount: rows.length,
    };
  }

  const pauseUntil = addDays(
    new Date(latestCancelledAt),
    LATE_CANCELLATION_BOOKING_PAUSE_DAYS,
  );

  return {
    isBlocked: pauseUntil.getTime() > Date.now(),
    pauseUntil: pauseUntil.toISOString(),
    lateCancellationCount: rows.length,
  };
}

export async function getPublishedAvailabilities(
  professionalId: string,
): Promise<Availability[]> {
  if (!hasSupabaseBrowserEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("professional_availabilities")
    .select("id, professional_id, starts_at, ends_at, consultation_mode, is_published, created_at")
    .eq("professional_id", professionalId)
    .eq("is_published", true)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) {
    throw error;
  }

  const availabilities = ((data ?? []) as AvailabilityRow[]).map(mapAvailabilityRow);
  if (availabilities.length === 0) {
    return [];
  }

  const { data: activeAppointments, error: appointmentError } = await supabase
    .from("professional_appointments")
    .select("availability_id")
    .in(
      "availability_id",
      availabilities.map((availability) => availability.id),
    )
    .in("status", ["pending", "confirmed", "completed"]);

  if (appointmentError) {
    throw appointmentError;
  }

  const unavailableIds = new Set(
    (activeAppointments ?? []).map((appointment) => appointment.availability_id as string),
  );

  return availabilities.filter((availability) => !unavailableIds.has(availability.id));
}

export async function getProfessionalAgendaSnapshot(
  professionalId: string,
): Promise<{
  upcomingAvailabilities: Availability[];
  appointments: ProfessionalAppointment[];
}> {
  if (!hasSupabaseBrowserEnv()) {
    return { upcomingAvailabilities: [], appointments: [] };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: availabilityRows, error: availabilityError }, { data: appointmentRows, error: appointmentError }] =
    await Promise.all([
      supabase
        .from("professional_availabilities")
        .select("id, professional_id, starts_at, ends_at, consultation_mode, is_published, created_at")
        .eq("professional_id", professionalId)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true }),
      supabase
        .from("professional_appointments")
        .select(
          `
            id,
            availability_id,
            patient_id,
            professional_id,
            status,
            patient_note,
            professional_note,
            cancelled_at,
            cancelled_by,
            cancellation_reason,
            late_cancellation,
            created_at,
            professional_availabilities!inner(starts_at, ends_at, consultation_mode)
          `,
        )
        .eq("professional_id", professionalId)
        .order("created_at", { ascending: false }),
    ]);

  if (availabilityError) {
    throw availabilityError;
  }

  if (appointmentError) {
    throw appointmentError;
  }

  const patientIds = Array.from(
    new Set(((appointmentRows ?? []) as AppointmentRow[]).map((row) => row.patient_id)),
  );

  const { data: patientRows, error: patientError } =
    patientIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", patientIds)
      : { data: [], error: null };

  if (patientError) {
    throw patientError;
  }

  const patientMap = new Map(
    (patientRows ?? []).map((row) => [row.id as string, row.display_name as string]),
  );

  return {
    upcomingAvailabilities: ((availabilityRows ?? []) as AvailabilityRow[]).map(mapAvailabilityRow),
    appointments: ((appointmentRows ?? []) as AppointmentRow[]).map((row) => {
      const availability = getAvailabilityRelation(row.professional_availabilities);

      return {
        id: row.id,
        availabilityId: row.availability_id,
        patientId: row.patient_id,
        patientDisplayName: patientMap.get(row.patient_id) ?? "Patiente ROSE-SEIN",
        professionalId: row.professional_id,
        status: row.status,
        patientNote: row.patient_note,
        professionalNote: row.professional_note,
        cancelledAt: row.cancelled_at,
        cancelledBy: row.cancelled_by,
        cancellationReason: row.cancellation_reason,
        lateCancellation: row.late_cancellation ?? false,
        startsAt: availability?.starts_at ?? row.created_at,
        endsAt: availability?.ends_at ?? row.created_at,
        consultationMode: availability?.consultation_mode ?? "presentiel",
        createdAt: row.created_at,
      };
    }),
  };
}

export async function bookAppointment(input: {
  availabilityId: string;
  patientId: string;
  professionalId: string;
  patientNote?: string | null;
}) {
  const restriction = await getPatientBookingRestriction(input.patientId);
  if (restriction.isBlocked) {
    throw new Error(`BOOKING_TEMPORARILY_PAUSED:${restriction.pauseUntil ?? ""}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("professional_appointments").insert({
    availability_id: input.availabilityId,
    patient_id: input.patientId,
    professional_id: input.professionalId,
    status: "pending",
    patient_note: input.patientNote?.trim() ? input.patientNote.trim() : null,
  });

  if (error) {
    throw error;
  }
}

export async function createAvailability(input: {
  professionalId: string;
  startsAt: string;
  endsAt: string;
  consultationMode: ConsultationMode;
  createdBy: string;
  isPublished?: boolean;
}) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("professional_availabilities").insert({
    professional_id: input.professionalId,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    consultation_mode: input.consultationMode,
    is_published: input.isPublished ?? true,
    created_by: input.createdBy,
  });

  if (error) {
    throw error;
  }
}

export async function updateAppointmentStatus(input: {
  appointmentId: string;
  status: AppointmentStatus;
  professionalNote?: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("professional_appointments")
    .update({
      status: input.status,
      professional_note: input.professionalNote?.trim()
        ? input.professionalNote.trim()
        : null,
    })
    .eq("id", input.appointmentId);

  if (error) {
    throw error;
  }
}

export async function cancelAppointment(input: {
  appointmentId: string;
  reason: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("cancel_professional_appointment", {
    target_appointment_id: input.appointmentId,
    cancellation_reason_input: input.reason,
  });

  if (error) {
    throw error;
  }
}

export function getCancellationErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("CANCELLATION_REASON_REQUIRED")) {
    return "reason-required";
  }

  if (message.includes("PATIENT_CANCELLATION_WINDOW_CLOSED")) {
    return "window-closed";
  }

  if (message.includes("APPOINTMENT_NOT_FOUND")) {
    return "not-found";
  }

  if (message.includes("APPOINTMENT_FORBIDDEN")) {
    return "forbidden";
  }

  if (message.includes("APPOINTMENT_STATUS_INVALID")) {
    return "invalid-status";
  }

  return "unknown";
}
