import "server-only";

import { requireCompletedProfile } from "@/lib/auth";
import {
  CONSULTATION_MODE_LABELS,
  getProfessionalCategoryLabel,
  type ConsultationMode,
  type MedicalCategory,
  type ProfessionalKind,
  type SupportCategory,
} from "@/lib/professional";
import type { AppointmentActor } from "@/lib/professional-agenda";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserAppointment = {
  id: string;
  title: string;
  scheduledFor: string;
  locationLabel: string | null;
  contactLabel: string | null;
  details: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PersonalNote = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type UserDocument = {
  id: string;
  title: string;
  bucketId: string;
  storagePath: string;
  mimeType: string | null;
  sizeBytes: number;
  createdAt: string;
  downloadUrl: string | null;
};

export type ProfessionalAppointmentStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed";

export type PatientProfessionalAppointment = {
  id: string;
  professionalId: string;
  professionalDisplayName: string;
  professionalTitle: string | null;
  professionalCategoryLabel: string;
  professionalSlug: string | null;
  status: ProfessionalAppointmentStatus;
  startsAt: string;
  endsAt: string;
  consultationMode: ConsultationMode;
  patientNote: string | null;
  professionalNote: string | null;
  cancelledAt: string | null;
  cancelledBy: AppointmentActor | null;
  cancellationReason: string | null;
  lateCancellation: boolean;
  createdAt: string;
};

export type ParcoursSnapshot = {
  appointments: UserAppointment[];
  professionalAppointments: PatientProfessionalAppointment[];
  notes: PersonalNote[];
  documents: UserDocument[];
};

type AppointmentAvailabilityRelation =
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

type AppointmentProfessionalRelation =
  | {
      id: string;
      slug: string;
      professional_kind: ProfessionalKind;
      medical_category: MedicalCategory | null;
      support_category: SupportCategory | null;
      title: string | null;
      profiles:
        | {
            display_name?: string | null;
          }
        | Array<{
            display_name?: string | null;
          }>
        | null;
    }
  | Array<{
      id: string;
      slug: string;
      professional_kind: ProfessionalKind;
      medical_category: MedicalCategory | null;
      support_category: SupportCategory | null;
      title: string | null;
      profiles:
        | {
            display_name?: string | null;
          }
        | Array<{
            display_name?: string | null;
          }>
        | null;
    }>;

type PatientProfessionalAppointmentRow = {
  id: string;
  professional_id: string;
  status: ProfessionalAppointmentStatus;
  patient_note: string | null;
  professional_note: string | null;
  cancelled_at: string | null;
  cancelled_by: AppointmentActor | null;
  cancellation_reason: string | null;
  late_cancellation: boolean | null;
  created_at: string;
  professional_availabilities: AppointmentAvailabilityRelation | null;
  professional_profiles: AppointmentProfessionalRelation | null;
};

export const PROFESSIONAL_APPOINTMENT_STATUS_LABELS: Record<ProfessionalAppointmentStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  declined: "Décliné",
  cancelled: "Annulé",
  completed: "Réalisé",
};

function getRelationObject<T extends object>(relation: T | T[] | null | undefined): T | null {
  if (!relation) {
    return null;
  }

  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function parseLocalTimestamp(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? "0"),
  };
}

function formatUtcDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("fr-FR", {
    ...options,
    timeZone: "UTC",
  }).format(date);
}

export function formatAppointmentSchedule(value: string) {
  const parsed = parseLocalTimestamp(value);

  if (!parsed) {
    return value;
  }

  const date = new Date(
    Date.UTC(
      parsed.year,
      parsed.month - 1,
      parsed.day,
      parsed.hour,
      parsed.minute,
      parsed.second,
    ),
  );

  return formatUtcDate(date, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateTimeLocalValue(value: string) {
  const parsed = parseLocalTimestamp(value);

  if (!parsed) {
    return value;
  }

  const parts = [
    String(parsed.year).padStart(4, "0"),
    String(parsed.month).padStart(2, "0"),
    String(parsed.day).padStart(2, "0"),
  ];
  const time = `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}`;

  return `${parts.join("-")}T${time}`;
}

export function formatParcoursDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatProfessionalAppointmentSchedule(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });

  const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });

  return `${formatter.format(new Date(start))} – ${timeFormatter.format(new Date(end))}`;
}

export async function getParcoursSnapshot(): Promise<ParcoursSnapshot> {
  const { user } = await requireCompletedProfile("/parcours");
  const supabase = await createSupabaseServerClient();

  const [{ data: appointmentRows }, { data: professionalAppointmentRows }, { data: noteRows }, { data: documentRows }] = await Promise.all([
    supabase
      .from("user_appointments")
      .select(
        "id, title, scheduled_for, location_label, contact_label, details, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .order("scheduled_for", { ascending: true }),
    supabase
      .from("professional_appointments")
      .select(
        `
          id,
          professional_id,
          status,
          patient_note,
          professional_note,
          cancelled_at,
          cancelled_by,
          cancellation_reason,
          late_cancellation,
          created_at,
          professional_availabilities!inner(starts_at, ends_at, consultation_mode),
          professional_profiles!inner(
            id,
            slug,
            professional_kind,
            medical_category,
            support_category,
            title,
            profiles!inner(display_name)
          )
        `,
      )
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("personal_notes")
      .select("id, title, body, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("user_documents")
      .select("id, title, bucket_id, storage_path, mime_type, size_bytes, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const documents = await Promise.all(
    (documentRows ?? []).map(async (row) => {
      const { data } = await supabase.storage
        .from(row.bucket_id)
        .createSignedUrl(row.storage_path, 60 * 15);

      return {
        id: row.id,
        title: row.title,
        bucketId: row.bucket_id,
        storagePath: row.storage_path,
        mimeType: row.mime_type,
        sizeBytes: Number(row.size_bytes ?? 0),
        createdAt: row.created_at,
        downloadUrl: data?.signedUrl ?? null,
      };
    })
  );

  return {
    appointments: (appointmentRows ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      scheduledFor: row.scheduled_for,
      locationLabel: row.location_label,
      contactLabel: row.contact_label,
      details: row.details,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    professionalAppointments: ((professionalAppointmentRows ?? []) as PatientProfessionalAppointmentRow[]).map((row) => {
      const availability = getRelationObject(row.professional_availabilities);
      const professional = getRelationObject(row.professional_profiles);
      const professionalProfile = getRelationObject(professional?.profiles);

      return {
        id: row.id,
        professionalId: row.professional_id,
        professionalDisplayName:
          professionalProfile?.display_name ?? "Professionnel ROSE-SEIN",
        professionalTitle: professional?.title ?? null,
        professionalCategoryLabel: professional
          ? getProfessionalCategoryLabel({
              professionalKind: professional.professional_kind,
              medicalCategory: professional.medical_category,
              supportCategory: professional.support_category,
            })
          : "Accompagnement professionnel",
        professionalSlug: professional?.slug ?? null,
        status: row.status,
        startsAt: availability?.starts_at ?? row.created_at,
        endsAt: availability?.ends_at ?? row.created_at,
        consultationMode: availability?.consultation_mode ?? "presentiel",
        patientNote: row.patient_note,
        professionalNote: row.professional_note,
        cancelledAt: row.cancelled_at,
        cancelledBy: row.cancelled_by,
        cancellationReason: row.cancellation_reason,
        lateCancellation: row.late_cancellation ?? false,
        createdAt: row.created_at,
      };
    }),
    notes: (noteRows ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    documents,
  };
}
