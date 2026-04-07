import "server-only";

import { getCurrentUserContext } from "@/lib/auth";
import { EVENT_TIME_ZONE, type PublishedEvent } from "@/lib/content";
import { hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EventRegistrationStatus = "registered" | "cancelled";

export type EventRegistrationRecord = {
  id: string;
  eventId: string;
  userId: string;
  displayName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  note: string | null;
  status: EventRegistrationStatus;
  createdAt: string;
};

export type AdminManagedEvent = PublishedEvent & {
  createdAt: string;
  isPublished: boolean;
  registrationCount: number;
  registrations: EventRegistrationRecord[];
};

type EventRow = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string | null;
  location_label: string | null;
  published_at: string | null;
  created_at: string;
};

type EventRegistrationRow = {
  id: string;
  event_id: string;
  user_id: string;
  contact_email: string | null;
  contact_phone: string | null;
  note: string | null;
  status: EventRegistrationStatus;
  created_at: string;
};

function toPublishedEvent(row: EventRow): PublishedEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    locationLabel: row.location_label,
    publishedAt: row.published_at ?? row.created_at,
  };
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const timeZoneName = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  if (!timeZoneName || timeZoneName === "GMT" || timeZoneName === "UTC") {
    return 0;
  }

  const match = timeZoneName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? "0");
  return sign * (hours * 60 + minutes);
}

export function parseEventDateTimeInput(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match;
  const utcGuess = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    ),
  );
  const offsetMinutes = getTimeZoneOffsetMinutes(utcGuess, EVENT_TIME_ZONE);
  return new Date(utcGuess.getTime() - offsetMinutes * 60_000).toISOString();
}

export function formatEventDateTimeInput(value: string | null) {
  if (!value) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: EVENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));

  const mapped = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${mapped.year}-${mapped.month}-${mapped.day}T${mapped.hour}:${mapped.minute}`;
}

export function isEventClosed(startsAt: string) {
  return new Date(startsAt).getTime() <= Date.now();
}

export async function getPublishedEventById(eventId: string): Promise<PublishedEvent | null> {
  if (!hasSupabaseBrowserEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("events")
    .select(
      "id, title, description, starts_at, ends_at, location_label, published_at, created_at",
    )
    .eq("id", eventId)
    .not("published_at", "is", null)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return toPublishedEvent(data as EventRow);
}

export async function getCurrentUserEventRegistration(
  eventId: string,
): Promise<EventRegistrationRecord | null> {
  if (!hasSupabaseBrowserEnv()) {
    return null;
  }

  const { user, profile } = await getCurrentUserContext();
  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("event_registrations")
    .select("id, event_id, user_id, contact_email, contact_phone, note, status, created_at")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    eventId: data.event_id,
    userId: data.user_id,
    displayName: profile?.displayName ?? "Membre",
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    note: data.note,
    status: data.status as EventRegistrationStatus,
    createdAt: data.created_at,
  };
}

export async function getAdminEventsSnapshot(): Promise<AdminManagedEvent[]> {
  if (!hasSupabaseBrowserEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, description, starts_at, ends_at, location_label, published_at, created_at",
    )
    .order("starts_at", { ascending: true });

  const eventRows = (events ?? []) as EventRow[];
  const eventIds = eventRows.map((event) => event.id);

  const { data: registrations } =
    eventIds.length > 0
      ? await supabase
          .from("event_registrations")
          .select(
            "id, event_id, user_id, contact_email, contact_phone, note, status, created_at",
          )
          .in("event_id", eventIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  const registrationRows = (registrations ?? []) as EventRegistrationRow[];
  const userIds = Array.from(new Set(registrationRows.map((registration) => registration.user_id)));
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, pseudonym")
          .in("id", userIds)
      : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.id as string,
      {
        displayName: profile.display_name as string,
        pseudonym: profile.pseudonym as string | null,
      },
    ]),
  );

  const registrationsByEvent = registrationRows.reduce<Record<string, EventRegistrationRecord[]>>(
    (accumulator, registration) => {
      const profile = profileMap.get(registration.user_id);
      const displayName =
        profile?.displayName ??
        profile?.pseudonym ??
        registration.contact_email ??
        "Membre";

      (accumulator[registration.event_id] ??= []).push({
        id: registration.id,
        eventId: registration.event_id,
        userId: registration.user_id,
        displayName,
        contactEmail: registration.contact_email,
        contactPhone: registration.contact_phone,
        note: registration.note,
        status: registration.status,
        createdAt: registration.created_at,
      });

      return accumulator;
    },
    {},
  );

  return eventRows.map((event) => {
    const eventRegistrations = registrationsByEvent[event.id] ?? [];

    return {
      ...toPublishedEvent(event),
      createdAt: event.created_at,
      isPublished: Boolean(event.published_at),
      registrationCount: eventRegistrations.filter(
        (registration) => registration.status === "registered",
      ).length,
      registrations: eventRegistrations,
    };
  });
}
