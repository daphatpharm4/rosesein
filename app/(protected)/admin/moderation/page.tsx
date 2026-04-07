import { AlertTriangle, ClipboardCheck, ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { getModerationQueue, moderationActionOptions } from "@/lib/moderation";

import { recordModerationAction } from "./actions";

export const dynamic = "force-dynamic";

type ModerationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "moderation-action-recorded": "L'action de modération a été enregistrée.",
  "moderation-action-invalid": "Choisissez un signalement et une action valides.",
  "escalation-target-required": "Indiquez un propriétaire d'escalade pour les cas sévères.",
  "report-not-found": "Le signalement demandé n'est plus disponible.",
  "moderation-action-failed":
    "L'action de modération n'a pas pu être enregistrée dans Supabase.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getStatusLabel(status: "open" | "reviewing" | "resolved" | "escalated") {
  switch (status) {
    case "open":
      return "Ouvert";
    case "reviewing":
      return "En revue";
    case "resolved":
      return "Résolu";
    case "escalated":
      return "Escaladé";
  }

  return status;
}

function getSeverityLabel(severity: "low" | "medium" | "high" | "severe") {
  switch (severity) {
    case "low":
      return "Faible";
    case "medium":
      return "Moyenne";
    case "high":
      return "Haute";
    case "severe":
      return "Sévère";
  }

  return severity;
}

export default async function ModerationPage({ searchParams }: ModerationPageProps) {
  const query = (await searchParams) ?? {};
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const feedbackKey = error ?? status;
  const feedback = feedbackKey ? feedbackMap[feedbackKey] : null;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  const queue = await getModerationQueue();

  return (
    <AppShell title="Modération" currentPath="/admin">
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="eyebrow">Queue staff</div>
          <h1 className="editorial-title">Signalements, décisions et escalades.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Cette surface enregistre un socle minimal mais réel: les membres peuvent
            signaler un message, les modérateurs tracent leur décision, et les cas
            sévères reçoivent un propriétaire d&apos;escalade.
          </p>
        </div>

        {feedback ? (
          <div
            className={`surface-card ${feedbackTone}`}
            role={error ? "alert" : "status"}
            aria-live={error ? "assertive" : "polite"}
          >
            <p className="font-headline text-base font-semibold">Modération</p>
            <p className="mt-2 text-sm leading-7">{feedback}</p>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="surface-section">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <ClipboardCheck aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Workflow lié au produit
                </p>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  1. Un membre signale un message depuis `/messages/[threadId]`.
                  2. Le signalement arrive ici avec son contexte. 3. Une action est
                  enregistrée avec un propriétaire et un horodatage. 4. Les cas sévères
                  passent en statut escaladé avec un responsable nommé.
                </p>
              </div>
            </div>
          </div>

          <div className="surface-card">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldAlert aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Règle d&apos;escalade
                </p>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Aucun bannissement automatique ici. Les cas sévères sont escaladés
                  vers un propriétaire identifié avant toute décision plus lourde.
                </p>
              </div>
            </div>
          </div>
        </div>

        {queue.length > 0 ? (
          <div className="space-y-4">
            {queue.map((report) => (
              <article key={report.id} className="surface-section space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="eyebrow">{report.threadName}</div>
                    <h2 className="font-headline text-xl font-semibold text-on-surface">
                      {report.reasonLabel}
                    </h2>
                    <p className="text-sm leading-7 text-on-surface-variant">
                      Signalé par {report.reporterName} au sujet de {report.targetName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                    <span className="rounded-full bg-primary/10 px-3 py-2 text-primary">
                      {getStatusLabel(report.status)}
                    </span>
                    <span className="rounded-full bg-surface-container-low px-3 py-2 text-on-surface">
                      Gravité {getSeverityLabel(report.severity)}
                    </span>
                  </div>
                </div>

                <div className="rounded-brand bg-surface-container-low px-4 py-4 text-sm leading-7 text-on-surface-variant">
                  <p>
                    <span className="font-semibold text-on-surface">Message visé:</span>{" "}
                    {report.messagePreview}
                  </p>
                  {report.details ? (
                    <p className="mt-2">
                      <span className="font-semibold text-on-surface">Contexte du membre:</span>{" "}
                      {report.details}
                    </p>
                  ) : null}
                  <p className="mt-2">
                    <span className="font-semibold text-on-surface">Créé le:</span>{" "}
                    {report.createdAtLabel}
                  </p>
                  {report.reviewedAtLabel ? (
                    <p className="mt-2">
                      <span className="font-semibold text-on-surface">Dernière revue:</span>{" "}
                      {report.reviewedAtLabel}
                    </p>
                  ) : null}
                  {report.escalationTarget ? (
                    <p className="mt-2">
                      <span className="font-semibold text-on-surface">Escalade actuelle:</span>{" "}
                      {report.escalationTarget}
                    </p>
                  ) : null}
                </div>

                <form action={recordModerationAction} className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                  <input type="hidden" name="reportId" value={report.id} />

                  <label className="block space-y-2">
                    <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                      Action
                    </span>
                    <select
                      name="actionType"
                      defaultValue={report.status === "open" ? "review_note" : "close_report"}
                      className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                    >
                      {moderationActionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                      Notes ou décision
                    </span>
                    <textarea
                      name="notes"
                      rows={4}
                      className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                      placeholder="Décision prise, contexte, consigne donnée au membre, ou justification."
                    />
                  </label>

                  <label className="block space-y-2 lg:col-span-2">
                    <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                      Propriétaire d&apos;escalade si le cas est sévère
                    </span>
                    <input
                      type="text"
                      name="escalationTarget"
                      defaultValue={report.escalationTarget ?? ""}
                      className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                      placeholder="Exemple: référente support, admin de garde, cellule sécurité"
                    />
                  </label>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary lg:col-span-2"
                  >
                    Enregistrer l&apos;action
                  </button>
                </form>

                {report.actions.length > 0 ? (
                  <div className="space-y-3">
                    <p className="font-headline text-base font-semibold text-on-surface">
                      Historique tracé
                    </p>
                    <div className="space-y-3">
                      {report.actions.map((action) => (
                        <div key={action.id} className="rounded-brand bg-surface-container-low px-4 py-4 text-sm leading-7 text-on-surface-variant">
                          <p>
                            <span className="font-semibold text-on-surface">{action.actionLabel}</span>{" "}
                            par {action.moderatorName} le {action.createdAtLabel}
                          </p>
                          {action.notes ? <p className="mt-2">{action.notes}</p> : null}
                          {action.escalationTarget ? (
                            <p className="mt-2">
                              <span className="font-semibold text-on-surface">Escalade:</span>{" "}
                              {action.escalationTarget}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-brand bg-surface-container-low px-4 py-4 text-sm leading-7 text-on-surface-variant">
                    Aucune action n&apos;a encore été enregistrée sur ce signalement.
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-card">
            <div className="flex items-start gap-3">
              <AlertTriangle aria-hidden="true" className="mt-1 h-5 w-5 text-primary" strokeWidth={1.8} />
              <div>
                <p className="font-headline text-lg font-semibold text-on-surface">
                  Aucun signalement pour le moment
                </p>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Les rapports créés depuis la messagerie apparaîtront ici avec leur
                  contexte et leur historique d&apos;action.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
