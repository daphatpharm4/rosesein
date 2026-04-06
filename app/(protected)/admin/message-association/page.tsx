import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { requireStaff } from "@/lib/auth";
import { getActiveAssociationMessage } from "@/lib/association-message";
import { publishAssociationMessage } from "./actions";

export const metadata: Metadata = { title: "Message de l'association" };
export const dynamic = "force-dynamic";

const ERROR_LABELS: Record<string, string> = {
  "title-required": "Le titre est obligatoire.",
  "body-too-short": "Le message doit contenir au moins 10 caractères.",
  "expiry-required": "La date d'expiration est obligatoire.",
  "expiry-past": "La date d'expiration doit être dans le futur.",
  "publish-failed": "La publication a échoué. Veuillez réessayer.",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(value));
}

function daysUntilExpiry(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function expiryLabel(expiresAt: string): string {
  const days = daysUntilExpiry(expiresAt);
  if (days <= 0) return "Expiré";
  if (days === 1) return "Expire aujourd'hui";
  return `Expire dans ${days} jours`;
}

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function MessageAssociationPage({ searchParams }: Props) {
  await requireStaff("/admin/message-association");

  const { error } = await searchParams;
  const activeMessage = await getActiveAssociationMessage();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <AppShell title="Administration" currentPath="/admin">
      <section className="space-y-8">
        <Link
          href={"/admin" as Route}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Administration
        </Link>

        <div className="space-y-2">
          <div className="eyebrow">Administration</div>
          <h1 className="editorial-title">Message de l&apos;association</h1>
          <p className="text-base leading-7 text-on-surface-variant">
            Publiez un message visible en haut de la page d&apos;accueil pour tous les visiteurs.
          </p>
        </div>

        {/* Error feedback */}
        {error && ERROR_LABELS[error] && (
          <div className="rounded-brand bg-primary/10 px-4 py-3 font-label text-sm font-semibold text-primary">
            {ERROR_LABELS[error]}
          </div>
        )}

        {/* Current active message */}
        <section className="space-y-3">
          <h2 className="font-headline text-lg font-semibold text-on-surface">Message actuel</h2>
          {activeMessage ? (
            <div className="surface-card space-y-3 border-l-4 border-primary/30">
              <p className="font-headline text-base font-semibold text-on-surface">
                {activeMessage.title}
              </p>
              <p className="text-sm leading-7 text-on-surface-variant">{activeMessage.body}</p>
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-label text-xs text-outline">
                  Jusqu&apos;au {formatDate(activeMessage.expiresAt)}
                </span>
                <span
                  className={`font-label text-xs font-semibold ${
                    daysUntilExpiry(activeMessage.expiresAt) <= 1
                      ? "text-primary"
                      : "text-on-surface-variant"
                  }`}
                >
                  {expiryLabel(activeMessage.expiresAt)}
                </span>
              </div>
            </div>
          ) : (
            <div className="surface-section">
              <p className="text-sm text-on-surface-variant">Aucun message actif en ce moment.</p>
            </div>
          )}
        </section>

        {/* Publish form */}
        <section className="space-y-4">
          <h2 className="font-headline text-lg font-semibold text-on-surface">
            {activeMessage ? "Publier un nouveau message" : "Publier un message"}
          </h2>
          {activeMessage && (
            <p className="text-sm text-on-surface-variant">
              Le nouveau message remplacera l&apos;actuel dès sa publication.
            </p>
          )}
          <form action={publishAssociationMessage} className="surface-section space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="font-label text-sm font-semibold text-on-surface"
              >
                Titre
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="ex : Fermeture du 15 au 22 août"
                className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="body"
                className="font-label text-sm font-semibold text-on-surface"
              >
                Message
              </label>
              <textarea
                id="body"
                name="body"
                required
                minLength={10}
                rows={4}
                placeholder="Écrivez votre message ici…"
                className="w-full rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm leading-7 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="expires_at"
                className="font-label text-sm font-semibold text-on-surface"
              >
                Date d&apos;expiration
              </label>
              <input
                id="expires_at"
                name="expires_at"
                type="date"
                required
                min={minDate}
                className="rounded-brand border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-label text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5"
              >
                <Megaphone aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                Publier le message
              </button>
            </div>
          </form>
        </section>
      </section>
    </AppShell>
  );
}
