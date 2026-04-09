import { CircleAlert, Clock3, MessageSquareText, Plus, Sparkles } from "lucide-react";

import { BackLink } from "@/components/navigation/back-link";
import { AppShell } from "@/components/shell/app-shell";
import { requireProfessionalTier } from "@/lib/auth";
import { PROFESSIONAL_APPOINTMENT_STATUS_LABELS } from "@/lib/parcours";
import {
  getProfessionalAgendaSnapshot,
  isLateCancellationWindow,
} from "@/lib/professional-agenda";

import {
  cancelAppointmentAsProfessional,
  createAvailabilitySlot,
  respondToAppointment,
} from "./actions";

export const dynamic = "force-dynamic";

type ProAgendaPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "slot-created": "Le créneau a été ajouté et publié sur votre fiche.",
  "appointment-confirmed": "La demande a été confirmée.",
  "appointment-cancelled": "Le rendez-vous a été annulé et le créneau a été rouvert.",
  "appointment-updated": "La demande a été mise à jour.",
  "slot-invalid": "Renseignez un début, une fin et un mode de consultation valides.",
  "slot-range-invalid": "La fin doit être postérieure au début du créneau.",
  "appointment-cancel-reason-required":
    "Ajoutez un motif d'au moins quelques mots pour annuler ce rendez-vous.",
  "appointment-invalid": "La demande ciblée est introuvable ou son statut n'est pas valide.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function ProAgendaPage({ searchParams }: ProAgendaPageProps) {
  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const { user } = await requireProfessionalTier(
    ["visibilite_agenda", "partenaire"],
    {
      redirectTo: "/pro/agenda",
      fallbackPath: "/pro",
      error: "agenda-tier-locked",
    },
  );
  const { upcomingAvailabilities, appointments } = await getProfessionalAgendaSnapshot(user.id);
  const feedbackKey = error ?? status;
  const feedback = feedbackKey ? feedbackMap[feedbackKey] : null;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  const pendingAppointments = appointments.filter((appointment) => appointment.status === "pending");
  const confirmedAppointments = appointments.filter((appointment) => appointment.status === "confirmed");
  const recentUpdates = appointments.filter((appointment) => appointment.status !== "pending" && appointment.status !== "confirmed");

  return (
    <AppShell title="Espace pro" currentPath="/pro">
      <section className="space-y-6">
        <BackLink href="/pro" label="Retour à l'espace pro" />

        <div className="space-y-3">
          <div className="eyebrow">Agenda professionnel</div>
          <h1 className="editorial-title">Préparer les créneaux, puis traiter les demandes sans dispersion.</h1>
          <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
            La logique reste volontairement simple: un créneau publié devient visible sur votre fiche,
            puis chaque demande arrive ici pour être confirmée, déclinée ou annulée avec un motif clair.
          </p>
        </div>

        {feedback ? (
          <div className={`surface-card ${feedbackTone}`} role={error ? "alert" : "status"}>
            <p className="font-headline text-base font-semibold">Agenda</p>
            <p className="mt-2 text-sm leading-7">{feedback}</p>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <section className="surface-section space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="font-headline text-lg font-semibold text-on-surface">Ajouter un créneau</h2>
                  <p className="text-sm leading-7 text-on-surface-variant">
                    Les heures sont interprétées en heure de Paris pour rester cohérentes avec le reste de l'application.
                  </p>
                </div>
              </div>

              <form action={createAvailabilitySlot} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                      Début
                    </span>
                    <input
                      type="datetime-local"
                      name="startsAt"
                      required
                      className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-base text-on-surface sm:text-sm"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                      Fin
                    </span>
                    <input
                      type="datetime-local"
                      name="endsAt"
                      required
                      className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-base text-on-surface sm:text-sm"
                    />
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                    Mode de consultation
                  </span>
                  <select
                    name="consultationMode"
                    defaultValue="presentiel"
                    className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-base text-on-surface sm:text-sm"
                  >
                    <option value="presentiel">Présentiel</option>
                    <option value="telephone">Téléphone</option>
                    <option value="visio">Visio</option>
                  </select>
                </label>

                <button
                  type="submit"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  Publier le créneau
                </button>
              </form>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock3 aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.8} />
                <h2 className="font-headline text-lg font-semibold text-on-surface">Créneaux à venir</h2>
              </div>

              {upcomingAvailabilities.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAvailabilities.map((availability) => (
                    <article key={availability.id} className="surface-card space-y-2">
                      <p className="font-headline text-base font-semibold text-on-surface">
                        {formatLongDate(availability.startsAt)}
                      </p>
                      <p className="text-sm leading-7 text-on-surface-variant">
                        {formatTime(availability.startsAt)} – {formatTime(availability.endsAt)}
                        {" · "}
                        {availability.consultationMode}
                      </p>
                      <p className="text-xs uppercase tracking-[0.16em] text-outline">
                        {availability.isPublished ? "Publié sur la fiche publique" : "Brouillon"}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="surface-card">
                  <p className="font-headline text-base font-semibold text-on-surface">Aucun créneau à venir</p>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                    Ajoutez un premier créneau pour rendre votre agenda visible depuis la fiche publique.
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="surface-card space-y-4">
              <div className="flex items-center gap-3">
                <MessageSquareText aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.8} />
                <div>
                  <h2 className="font-headline text-lg font-semibold text-on-surface">
                    Demandes en attente
                  </h2>
                  <p className="text-sm leading-7 text-on-surface-variant">
                    {pendingAppointments.length} à traiter maintenant
                  </p>
                </div>
              </div>

              {pendingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {pendingAppointments.map((appointment) => {
                    const confirmAction = respondToAppointment.bind(null, appointment.id, "confirmed");
                    const declineAction = respondToAppointment.bind(null, appointment.id, "declined");

                    return (
                      <article key={appointment.id} className="rounded-brand bg-surface-container-low px-4 py-4">
                        <p className="font-headline text-base font-semibold text-on-surface">
                          {appointment.patientDisplayName}
                        </p>
                        <p className="mt-1 text-sm leading-7 text-on-surface-variant">
                          {formatLongDate(appointment.startsAt)} · {formatTime(appointment.startsAt)} –{" "}
                          {formatTime(appointment.endsAt)}
                        </p>
                        {appointment.patientNote ? (
                          <p className="mt-3 rounded-brand bg-surface-container-lowest px-3 py-3 text-sm leading-7 text-on-surface-variant">
                            {appointment.patientNote}
                          </p>
                        ) : null}
                        <div className="mt-4 flex gap-2">
                          <form action={confirmAction} className="flex-1">
                            <button
                              type="submit"
                              className="min-h-[44px] w-full rounded-full bg-gradient-primary px-4 py-2.5 font-label text-sm font-semibold text-on-primary"
                            >
                              Confirmer
                            </button>
                          </form>
                          <form action={declineAction} className="flex-1">
                            <button
                              type="submit"
                              className="min-h-[44px] w-full rounded-full bg-surface-container-lowest px-4 py-2.5 font-label text-sm font-semibold text-on-surface shadow-ambient"
                            >
                              Décliner
                            </button>
                          </form>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm leading-7 text-on-surface-variant">
                  Aucune demande en attente pour le moment.
                </p>
              )}
            </section>

            <section className="surface-card space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.8} />
                <div>
                  <h2 className="font-headline text-lg font-semibold text-on-surface">
                    Rendez-vous confirmés
                  </h2>
                  <p className="text-sm leading-7 text-on-surface-variant">
                    Les prochaines consultations validées.
                  </p>
                </div>
              </div>

              {confirmedAppointments.length > 0 ? (
                <div className="space-y-3">
                  {confirmedAppointments.map((appointment) => {
                    const cancelAction = cancelAppointmentAsProfessional.bind(null, appointment.id);
                    const lateWindow = isLateCancellationWindow(appointment.startsAt);

                    return (
                      <article key={appointment.id} className="rounded-brand bg-surface-container-low px-4 py-4">
                        <p className="font-headline text-base font-semibold text-on-surface">
                          {appointment.patientDisplayName}
                        </p>
                        <p className="mt-1 text-sm leading-7 text-on-surface-variant">
                          {formatLongDate(appointment.startsAt)} · {formatTime(appointment.startsAt)} –{" "}
                          {formatTime(appointment.endsAt)}
                        </p>
                        {appointment.patientNote ? (
                          <p className="mt-3 rounded-brand bg-surface-container-lowest px-3 py-3 text-sm leading-7 text-on-surface-variant">
                            {appointment.patientNote}
                          </p>
                        ) : null}
                        {lateWindow ? (
                          <div className="mt-3 flex items-start gap-3 rounded-brand bg-primary/8 px-3 py-3">
                            <CircleAlert aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
                            <p className="text-sm leading-7 text-on-surface-variant">
                              Ce rendez-vous entre dans la fenêtre d&apos;annulation tardive. Le motif sera visible côté patiente.
                            </p>
                          </div>
                        ) : null}

                        <details className="mt-4 rounded-brand bg-surface-container-lowest px-3 py-3">
                          <summary className="cursor-pointer list-none font-label text-sm font-semibold text-primary">
                            Annuler ce rendez-vous
                          </summary>
                          <form action={cancelAction} className="mt-4 space-y-3">
                            <label className="block space-y-2">
                              <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                                Motif d&apos;annulation
                              </span>
                              <textarea
                                name="cancellationReason"
                                rows={3}
                                minLength={8}
                                required
                                className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-base leading-7 text-on-surface sm:text-sm"
                                placeholder="Expliquez brièvement ce qui change pour la patiente."
                              />
                            </label>
                            <button
                              type="submit"
                              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-surface-container-low px-5 py-3 font-label text-sm font-semibold text-primary shadow-ambient"
                            >
                              Confirmer l&apos;annulation
                            </button>
                          </form>
                        </details>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm leading-7 text-on-surface-variant">
                  Aucun rendez-vous confirmé à afficher pour l&apos;instant.
                </p>
              )}
            </section>

            <section className="surface-card space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.8} />
                <div>
                  <h2 className="font-headline text-lg font-semibold text-on-surface">
                    Mises à jour récentes
                  </h2>
                  <p className="text-sm leading-7 text-on-surface-variant">
                    Déclinaisons, annulations et rendez-vous déjà clôturés.
                  </p>
                </div>
              </div>

              {recentUpdates.length > 0 ? (
                <div className="space-y-3">
                  {recentUpdates.slice(0, 6).map((appointment) => (
                    <article key={appointment.id} className="rounded-brand bg-surface-container-low px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-headline text-base font-semibold text-on-surface">
                            {appointment.patientDisplayName}
                          </p>
                          <p className="mt-1 text-sm leading-7 text-on-surface-variant">
                            {formatLongDate(appointment.startsAt)} · {formatTime(appointment.startsAt)} –{" "}
                            {formatTime(appointment.endsAt)}
                          </p>
                        </div>
                        <span className="rounded-full bg-surface-container-lowest px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                          {PROFESSIONAL_APPOINTMENT_STATUS_LABELS[appointment.status]}
                        </span>
                      </div>
                      {appointment.cancellationReason ? (
                        <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                          {appointment.cancellationReason}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-7 text-on-surface-variant">
                  Aucun changement récent à afficher.
                </p>
              )}
            </section>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
