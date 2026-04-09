import Link from "next/link";
import {
  CalendarCheck2,
  FileText,
  LockKeyhole,
  NotebookPen,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { BackLink } from "@/components/navigation/back-link";
import { AppShell } from "@/components/shell/app-shell";
import {
  formatAppointmentSchedule,
  formatParcoursDate,
  getParcoursSnapshot,
  toDateTimeLocalValue,
} from "@/lib/parcours";

import {
  deleteAppointment,
  deleteParcoursDocument,
  deletePersonalNote,
  saveAppointment,
  saveMoodCheckIn,
  savePersonalNote,
  uploadParcoursDocument,
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
  "document-uploaded": "Le document a été ajouté à votre espace privé.",
  "document-deleted": "Le document a été supprimé.",
  "appointment-title-required": "Indiquez un titre d'au moins deux caractères pour le rendez-vous.",
  "appointment-date-required": "Choisissez une date et une heure pour le rendez-vous.",
  "appointment-save-failed": "Le rendez-vous n'a pas pu être enregistré.",
  "appointment-delete-failed": "Le rendez-vous n'a pas pu être supprimé.",
  "note-title-required": "Ajoutez un titre d'au moins deux caractères pour la note.",
  "note-body-required": "Écrivez quelques mots pour enregistrer la note.",
  "note-save-failed": "La note n'a pas pu être enregistrée.",
  "note-delete-failed": "La note n'a pas pu être supprimée.",
  "mood-invalid": "Humeur non reconnue, veuillez réessayer.",
  "document-file-required": "Choisissez un document avant l'envoi.",
  "document-too-large": "Le document dépasse la limite de 10 Mo.",
  "document-upload-failed": "Le document n'a pas pu être envoyé.",
  "document-delete-failed": "Le document n'a pas pu être supprimé.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function truncateText(value: string | null, maxLength = 180) {
  if (!value) {
    return null;
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}…`;
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
  const { appointments, notes, documents } = await getParcoursSnapshot();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} Ko`;
    return `${Math.round(bytes / 104857.6) / 10} Mo`;
  };

  return (
    <AppShell title="Mon parcours" currentPath="/parcours">
      <section className="space-y-8">
        <BackLink href="/" label="Retour à l'accueil" />

        <div className="max-w-2xl space-y-3">
          <div className="eyebrow">Espace protégé</div>
          <h1 className="editorial-title">Votre organisation personnelle, au calme.</h1>
          <p className="text-base leading-8 text-on-surface-variant">
            Commencez par ce qui vous aide aujourd&apos;hui. Rendez-vous, notes et
            documents privés restent reliés à votre compte et peuvent être rouverts
            sans tout afficher d&apos;un seul coup.
          </p>
        </div>

        {feedback ? (
          <div
            className={`rounded-brand-xl px-5 py-5 ${feedbackTone}`}
            role={error ? "alert" : "status"}
            aria-live={error ? "assertive" : "polite"}
          >
            <p className="font-headline text-base font-semibold">Parcours</p>
            <p className="mt-2 text-sm leading-7">{feedback}</p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-5 shadow-ambient">
            <p className="font-headline text-3xl font-bold text-on-surface">
              {appointments.length}
            </p>
            <p className="mt-1 text-sm leading-7 text-on-surface-variant">
              rendez-vous enregistrés
            </p>
          </div>
          <div className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-5 shadow-ambient">
            <p className="font-headline text-3xl font-bold text-on-surface">{notes.length}</p>
            <p className="mt-1 text-sm leading-7 text-on-surface-variant">
              notes personnelles
            </p>
          </div>
          <div className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-5 shadow-ambient">
            <p className="font-headline text-3xl font-bold text-on-surface">
              {documents.length}
            </p>
            <p className="mt-1 text-sm leading-7 text-on-surface-variant">
              documents privés
            </p>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="surface-section space-y-4">
            <div>
              <p className="font-headline text-lg font-semibold text-on-surface">
                Comment vous sentez-vous aujourd&apos;hui ?
              </p>
              <p className="mt-1 text-sm leading-7 text-on-surface-variant">
                Un geste rapide pour garder une trace de votre humeur. Elle sera
                ajoutée à vos notes personnelles.
              </p>
            </div>

            <form action={saveMoodCheckIn} className="flex flex-wrap gap-3">
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
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low text-2xl transition-transform hover:-translate-y-0.5 hover:bg-surface-container"
                >
                  {emoji}
                </button>
              ))}
            </form>
          </div>

          <aside className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-low px-5 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <LockKeyhole aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-headline text-base font-semibold text-on-surface">
                  Privé par défaut
                </p>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Les rendez-vous, notes et documents affichés ici restent reliés à
                  votre compte et ne sont pas visibles depuis un autre utilisateur.
                </p>
                <Link
                  href="/aide"
                  className="mt-4 inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
                >
                  Voir l&apos;aide et les repères
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <div className="eyebrow">Agenda personnel</div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              Vos rendez-vous
            </h2>
          </div>

          <details className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-5 shadow-ambient">
            <summary className="flex cursor-pointer list-none items-center gap-3 font-headline text-lg font-semibold text-on-surface">
              <CalendarCheck2 aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.8} />
              Ajouter un rendez-vous
            </summary>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              Centralisez vos prochains repères sans afficher tous les champs en permanence.
            </p>

            <form action={saveAppointment} className="mt-5 grid gap-4 md:grid-cols-2">
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
                  placeholder="Hopital, visio, association"
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
                  Details
                </span>
                <textarea
                  name="details"
                  rows={4}
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                  placeholder="Questions a poser, pieces a penser, rappel logistique"
                />
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary md:col-span-2 md:w-fit"
              >
                Enregistrer le rendez-vous
              </button>
            </form>
          </details>

          {appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <article
                  key={appointment.id}
                  className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-5 shadow-ambient"
                >
                  <div className="space-y-3">
                    <div>
                      <p className="font-headline text-lg font-semibold text-on-surface">
                        {appointment.title}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-on-surface-variant">
                        {formatAppointmentSchedule(appointment.scheduledFor)}
                      </p>
                    </div>

                    {appointment.locationLabel || appointment.contactLabel ? (
                      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-outline">
                        {appointment.locationLabel ? (
                          <span className="rounded-full bg-surface-container-low px-3 py-1">
                            {appointment.locationLabel}
                          </span>
                        ) : null}
                        {appointment.contactLabel ? (
                          <span className="rounded-full bg-surface-container-low px-3 py-1">
                            {appointment.contactLabel}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {appointment.details ? (
                      <p className="text-sm leading-7 text-on-surface-variant">
                        {truncateText(appointment.details)}
                      </p>
                    ) : null}
                  </div>

                  <details className="mt-4 rounded-brand-lg bg-surface-container-low px-4 py-4">
                    <summary className="cursor-pointer list-none font-label text-sm font-semibold text-primary">
                      Modifier ce rendez-vous
                    </summary>

                    <div className="mt-4 space-y-4">
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
                            Details
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

                      <form action={deleteAppointment}>
                        <input type="hidden" name="appointmentId" value={appointment.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 font-label text-xs font-semibold text-on-surface shadow-ambient"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                          Supprimer ce rendez-vous
                        </button>
                      </form>
                    </div>
                  </details>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-5 shadow-ambient">
              <p className="font-headline text-lg font-semibold text-on-surface">
                Aucun rendez-vous enregistré
              </p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Ajoutez ici vos prochaines consultations, ateliers, appels ou rappels personnels.
              </p>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <div className="eyebrow">Notes privées</div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              Ce que vous voulez retrouver facilement
            </h2>
          </div>

          <details className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-5 shadow-ambient">
            <summary className="flex cursor-pointer list-none items-center gap-3 font-headline text-lg font-semibold text-on-surface">
              <NotebookPen aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.8} />
              Ajouter une note personnelle
            </summary>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              Gardez vos questions, impressions et rappels dans un espace simple et privé.
            </p>

            <form action={savePersonalNote} className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Titre
                </span>
                <input
                  type="text"
                  name="title"
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                  placeholder="Question a poser, ressenti, rappel"
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
          </details>

          {notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note) => (
                <article
                  key={note.id}
                  className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-5 shadow-ambient"
                >
                  <div className="space-y-3">
                    <div>
                      <p className="font-headline text-lg font-semibold text-on-surface">
                        {note.title}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-outline">
                        Mis a jour le {formatParcoursDate(note.updatedAt)}
                      </p>
                    </div>

                    <p className="text-sm leading-7 text-on-surface-variant">
                      {truncateText(note.body)}
                    </p>
                  </div>

                  <details className="mt-4 rounded-brand-lg bg-surface-container-low px-4 py-4">
                    <summary className="cursor-pointer list-none font-label text-sm font-semibold text-primary">
                      Modifier cette note
                    </summary>

                    <div className="mt-4 space-y-4">
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

                      <form action={deletePersonalNote}>
                        <input type="hidden" name="noteId" value={note.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 font-label text-xs font-semibold text-on-surface shadow-ambient"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                          Supprimer cette note
                        </button>
                      </form>
                    </div>
                  </details>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-5 shadow-ambient">
              <p className="font-headline text-lg font-semibold text-on-surface">
                Aucune note personnelle
              </p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Conservez ici vos pensées, questions à poser ou repères du quotidien.
              </p>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <div className="eyebrow">Documents</div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              Vos pieces utiles
            </h2>
          </div>

          <details className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-5 shadow-ambient">
            <summary className="flex cursor-pointer list-none items-center gap-3 font-headline text-lg font-semibold text-on-surface">
              <UploadCloud aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.8} />
              Ajouter un document privé
            </summary>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              Ordonnances, résultats ou courriers utiles. Chaque document reste privé
              et n&apos;est accessible qu&apos;à votre compte.
            </p>

            <form action={uploadParcoursDocument} className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Titre du document
                </span>
                <input
                  type="text"
                  name="title"
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                  placeholder="Ordonnance oncologue, résultats prise de sang..."
                />
              </label>

              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Fichier
                </span>
                <input
                  type="file"
                  name="file"
                  required
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                />
              </label>

              <p className="text-xs leading-6 text-on-surface-variant">
                Formats usuels acceptés, limite de 10 Mo par document.
              </p>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
              >
                Envoyer le document
              </button>
            </form>
          </details>

          {documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((document) => (
                <article
                  key={document.id}
                  className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-5 shadow-ambient"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                      <FileText aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-headline text-lg font-semibold text-on-surface">
                        {document.title}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-outline">
                        Ajoute le {formatParcoursDate(document.createdAt)} · {formatFileSize(document.sizeBytes)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {document.downloadUrl ? (
                      <a
                        href={document.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 font-label text-sm font-semibold text-primary"
                      >
                        Ouvrir le document
                      </a>
                    ) : (
                      <p className="text-sm leading-7 text-on-surface-variant">
                        Le lien sécurisé sera recréé au prochain chargement si nécessaire.
                      </p>
                    )}
                  </div>

                  <details className="mt-4 rounded-brand-lg bg-surface-container-low px-4 py-4">
                    <summary className="cursor-pointer list-none font-label text-sm font-semibold text-primary">
                      Gérer ce document
                    </summary>
                    <form action={deleteParcoursDocument} className="mt-4">
                      <input type="hidden" name="documentId" value={document.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 font-label text-xs font-semibold text-on-surface shadow-ambient"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                        Supprimer ce document
                      </button>
                    </form>
                  </details>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-5 shadow-ambient">
              <p className="font-headline text-lg font-semibold text-on-surface">
                Aucun document privé pour le moment
              </p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Ajoutez vos pièces importantes pour les retrouver rapidement dans votre parcours.
              </p>
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}
