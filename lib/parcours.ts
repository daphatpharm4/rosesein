import { requireCompletedProfile } from "@/lib/auth";
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

export type ParcoursSnapshot = {
  appointments: UserAppointment[];
  notes: PersonalNote[];
  documents: UserDocument[];
};

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

export async function getParcoursSnapshot(): Promise<ParcoursSnapshot> {
  const { user } = await requireCompletedProfile("/parcours");
  const supabase = await createSupabaseServerClient();

  const [{ data: appointmentRows }, { data: noteRows }, { data: documentRows }] = await Promise.all([
    supabase
      .from("user_appointments")
      .select(
        "id, title, scheduled_for, location_label, contact_label, details, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .order("scheduled_for", { ascending: true }),
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
