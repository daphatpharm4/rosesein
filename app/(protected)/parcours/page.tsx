import Link from "next/link";
import { CalendarCheck2, LockKeyhole, NotebookPen, Trash2 } from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import {
  formatAppointmentSchedule,
  formatParcoursDate,
  getParcoursSnapshot,
  toDateTimeLocalValue,
} from "@/lib/parcours";

import {
  deleteAppointment,
  deletePersonalNote,
  saveAppointment,
  saveMoodCheckIn,
  savePersonalNote,
} from "./actions";

export const dynamic = "force-dynamic";

type JourneyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "appointment-created": "Le rendez-vous a été ajouté à votre parcours.",
  "appointment-updated": "Le rendez-vous a été mis à jour.",
  "appointment-deleted": "Le rendez-vous a été supprimé.",
  "note-created": "La note personnelle a été enregistrée.",
  "note-updated": "La note personnelle a été mise à jour.",
  "note-deleted": "La note personnelle a été supprimée.",
  "appointment-title-required": "Indiquez un titre d'au moins deux caractères pour le rendez-vous.",
  "appointment-date-required": "Choisissez une date et une heure pour le rendez-vous.",
  "appointment-save-failed": "Le rendez-vous n'a pas pu être enregistré.",
  "appointment-delete-failed": "Le rendez-vous n'a pas pu être supprimé.",
  "note-title-required": "Ajoutez un titre d'au moins deux caractères pour la note.",
  "note-body-required": "Écrivez quelques mots pour enregistrer la note.",
  "note-save-failed": "La note n'a pas pu être enregistrée.",
  "note-delete-failed": "La note n'a pas pu être supprimée.",
  "mood-invalid": "Humeur non reconnue, veuillez réessayer.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function JourneyPage({ searchParams }: JourneyPageProps) {
  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const feedbackKey = error ?? status;
  const feedback = feedbackKey ? feedbackMap[feedbackKey] : null;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  const { appointments, notes } = await getParcoursSnapshot();

  return (
    <AppShell title="Mon parcours" currentPath="/parcours">
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="eyebrow">Espace protégé</div>
          <h1 className="editorial-title">Votre organisation personnelle, au calme.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Les rendez-vous et notes enregistrés ici sont maintenant rattachés à votre
            compte et conservés dans des tables privées. Le stockage de documents
            sensibles reste volontairement hors de ce lot.
          </p>
        </div>

        {feedback ? (
          <div className={`surface-card ${feedbackTone}`}>
            <p className="font-headline text-base font-semibold">Parcours</p>
            <p className="mt-2 text-sm leading-7">{feedback}</p>
          </div>
        ) : null}

        <section className="surface-section space-y-4">
          <div>
            <p className="font-headline text-lg font-semibold text-on-surface">
              Comment vous sentez-vous aujourd&apos;hui ?
            </p>
            <p className="mt-1 text-sm leading-7 text-on-surface-variant">
              Un geste rapide pour noter votre humeur. Elle sera enregistrée dans vos notes.
            </p>
          </div>
          <form action={saveMoodCheckIn} className="flex gap-3">
            {[
              { value: "1", emoji: "😔", label: "Très difficile" },
              { value: "2", emoji: "😟", label: "Difficile" },
              { value: "3", emoji: "😐", label: "Correct" },
              { value: "4", emoji: "🙂", label: "Bien" },
              { value: "5", emoji: "😊", label: "Très bien" },
            ].map(({ value, emoji, label }) => (
              <button
                key={value}
                type="submit"
                name="mood"
                value={value}
                aria-label={label}
                title={label}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low text-2xl transition-transform hover:-translate-y-1 hover:bg-surface-container"
              >
                {emoji}
              </button>
            ))}
          </form>
        </section>

        <section className="surface-section">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LockKeyhole aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-lg font-semibold text-on-surface">
                Politique privée par défaut
              </p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Les rendez-vous et notes de ce parcours sont limités à votre utilisateur.
                Ils ne sont pas publics et ne peuvent pas être consultés depuis un autre
                compte.
              </p>
              <Link
                href="/aide"
                className="mt-4 inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
              >
                Voir l&apos;aide et les repères d&apos;orientation
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            <section className="surface-section space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CalendarCheck2 aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    Ajouter un rendez-vous
                  </p>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                    Centralisez vos repères utiles sans ouvrir encore de stockage
                    documentaire.
                  </p>
                </div>
              </div>

              <form action={saveAppointment} className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2 md:col-span-2">
                  <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                    Titre du rendez-vous
                  </span>
                  <input
                    type="text"
                    name="title"
                    className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                    placeholder="Consultation, atelier, appel de suivi"
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                    Date et heure
                  </span>
                  <input
                    type="datetime-local"
                    name="scheduledFor"
                    className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                    Lieu
                  </span>
                  <input
                    type="text"
                    name="locationLabel"
                    className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                    placeholder="Hôpital, visio, association"
                  />
                </label>

                <label className="block space-y-2 md:col-span-2">
                  <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                    Contact ou repère utile
                  </span>
                  <input
                    type="text"
                    name="contactLabel"
                    className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                    placeholder="Nom de la personne, service, numéro à rappeler"
                  />
                </label>

                <label className="block space-y-2 md:col-span-2">
                  <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                    Détails
                  </span>
                  <textarea
                    name="details"
                    rows={4}
                    className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                    placeholder="Questions à poser, pièces à penser, rappel logistique"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary md:col-span-2 md:w-fit"
                >
                  Enregistrer le rendez-vous
                </button>
              </form>
            </section>

            <section className="space-y-4">
              <div>
                <div className="eyebrow">Agenda personnel</div>
                <h2 className="font-headline text-2xl font-bold text-on-surface">
                  Vos rendez-vous enregistrés
                </h2>
              </div>

              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <article key={appointment.id} className="surface-card space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-headline text-lg font-semibold text-on-surface">
                            {appointment.title}
                          </p>
                          <p className="mt-1 text-sm leading-7 text-on-surface-variant">
                            {formatAppointmentSchedule(appointment.scheduledFor)}
                          </p>
                        </div>
                        <form action={deleteAppointment}>
                          <input type="hidden" name="appointmentId" value={appointment.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 font-label text-xs font-semibold text-on-surface"
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                            Supprimer
                          </button>
                        </form>
                      </div>

                      <form action={saveAppointment} className="grid gap-4 md:grid-cols-2">
                        <input type="hidden" name="appointmentId" value={appointment.id} />

                        <label className="block space-y-2 md:col-span-2">
                          <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                            Titre
                          </span>
                          <input
                            type="text"
                            name="title"
                            defaultValue={appointment.title}
                            className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                            required
                          />
                        </label>

                        <label className="block space-y-2">
                          <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                            Date et heure
                          </span>
                          <input
                            type="datetime-local"
                            name="scheduledFor"
                            defaultValue={toDateTimeLocalValue(appointment.scheduledFor)}
                            className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                            required
                          />
                        </label>

                        <label className="block space-y-2">
                          <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                            Lieu
                          </span>
                          <input
                            type="text"
                            name="locationLabel"
                            defaultValue={appointment.locationLabel ?? ""}
                            className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                          />
                        </label>

                        <label className="block space-y-2 md:col-span-2">
                          <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                            Contact ou repère
                          </span>
                          <input
                            type="text"
                            name="contactLabel"
                            defaultValue={appointment.contactLabel ?? ""}
                            className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                          />
                        </label>

                        <label className="block space-y-2 md:col-span-2">
                          <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                            Détails
                          </span>
                          <textarea
                            name="details"
                            rows={4}
                            defaultValue={appointment.details ?? ""}
                            className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                          />
                        </label>

                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-full bg-surface-container-lowest px-5 py-3 font-label text-sm font-semibold text-primary shadow-ambient md:col-span-2 md:w-fit"
                        >
                          Mettre à jour
                        </button>
                      </form>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="surface-card">
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    Aucun rendez-vous enregistré
                  </p>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                    Ajoutez ici vos prochaines consultations, ateliers, appels ou
                    rappels personnels.
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-4">
            <section className="surface-section space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                  <NotebookPen aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    Ajouter une note personnelle
                  </p>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                    Gardez vos questions, impressions et rappels dans un espace simple
                    et privé.
                  </p>
                </div>
              </div>

              <form action={savePersonalNote} className="space-y-4">
                <label className="block space-y-2">
                  <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                    Titre
                  </span>
                  <input
                    type="text"
                    name="title"
                    className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                    placeholder="Question à poser, ressenti, rappel"
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                    Contenu
                  </span>
                  <textarea
                    name="body"
                    rows={6}
                    className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                    placeholder="Notez ce qui mérite d'être retrouvé plus tard."
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
                >
                  Enregistrer la note
                </button>
              </form>
            </section>

            <section className="space-y-4">
              <div>
                <div className="eyebrow">Notes privées</div>
                <h2 className="font-headline text-2xl font-bold text-on-surface">
                  Ce que vous voulez retrouver facilement
                </h2>
              </div>

              {notes.length > 0 ? (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <article key={note.id} className="surface-card space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-headline text-lg font-semibold text-on-surface">
                            {note.title}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-outline">
                            Mis à jour le {formatParcoursDate(note.updatedAt)}
                          </p>
                        </div>
                        <form action={deletePersonalNote}>
                          <input type="hidden" name="noteId" value={note.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 font-label text-xs font-semibold text-on-surface"
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                            Supprimer
                          </button>
                        </form>
                      </div>

                      <form action={savePersonalNote} className="space-y-4">
                        <input type="hidden" name="noteId" value={note.id} />

                        <label className="block space-y-2">
                          <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                            Titre
                          </span>
                          <input
                            type="text"
                            name="title"
                            defaultValue={note.title}
                            className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                            required
                          />
                        </label>

                        <label className="block space-y-2">
                          <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                            Contenu
                          </span>
                          <textarea
                            name="body"
                            rows={6}
                            defaultValue={note.body}
                            className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                            required
                          />
                        </label>

                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-full bg-surface-container-lowest px-5 py-3 font-label text-sm font-semibold text-primary shadow-ambient"
                        >
                          Mettre à jour
                        </button>
                      </form>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="surface-card">
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    Aucune note personnelle
                  </p>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                    Conservez ici vos pensées, questions à poser ou repères du quotidien.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
