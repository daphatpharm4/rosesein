import Link from "next/link";
import { ArrowRight, MailCheck, ShieldCheck, Sparkles, UserRound } from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseBrowserEnv } from "@/lib/env";
import { normalizeInternalPath } from "@/lib/internal-path";

import { saveProfileSetup, signInWithMagicLink, signOut } from "./actions";

export const dynamic = "force-dynamic";

type AccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const messageMap: Record<string, string> = {
  "signin-required":
    "Connectez-vous pour ouvrir cette surface privée et reprendre la messagerie en sécurité.",
  "magic-link-sent":
    "Un lien de connexion vous a été envoyé. Ouvrez votre boîte mail pour continuer.",
  "signed-out": "Votre session a été fermée.",
  "email-required": "Renseignez une adresse email valide pour recevoir votre lien de connexion.",
  "profile-kind-required": "Choisissez votre profil pour finaliser l'accès à votre espace privé.",
  "display-name-required":
    "Indiquez un prénom ou un nom d'usage d'au moins deux caractères.",
  "magic-link-failed":
    "Le lien de connexion n'a pas pu être envoyé. Vérifiez la configuration Supabase.",
  "missing-supabase-env":
    "Les variables Supabase ne sont pas configurées. Ajoutez-les avant d'utiliser l'authentification.",
  "missing-auth-code":
    "Le lien reçu ne contenait pas les informations d'authentification attendues.",
  "callback-failed":
    "La validation du lien de connexion a échoué. Essayez d'en demander un nouveau.",
  "profile-save-failed":
    "Le profil n'a pas pu être enregistré. Vérifiez la migration et la configuration Supabase.",
  "complete-profile":
    "Complétez votre profil avant d'accéder aux espaces privés de ROSE-SEIN.",
  "profile-ready": "Votre profil est prêt. Vous pouvez maintenant continuer en toute sérénité.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = (await searchParams) ?? {};
  const status = firstValue(params.status);
  const error = firstValue(params.error);
  const redirectTo = normalizeInternalPath(firstValue(params.redirectTo));
  const { user, profile, roles } = await getCurrentUserContext();
  const isConfigured = hasSupabaseBrowserEnv();
  const feedback = error ? messageMap[error] : status ? messageMap[status] : undefined;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";

  return (
    <AppShell title="Compte" currentPath="/account">
      <section className="space-y-8">
        <div className="max-w-2xl space-y-3">
          <div className="eyebrow">Compte et confidentialité</div>
          <h1 className="editorial-title">Entrer dans votre espace privé sans friction.</h1>
          <p className="text-base leading-8 text-on-surface-variant">
            Commencez par le minimum nécessaire. Le compte ouvre ensuite la messagerie,
            le parcours personnel et les futurs réglages sans vous demander plus que
            l'essentiel.
          </p>
        </div>

        {feedback ? (
          <div
            className={`rounded-brand-xl px-5 py-5 ${feedbackTone}`}
            role={error ? "alert" : "status"}
            aria-live={error ? "assertive" : "polite"}
          >
            <p className="font-headline text-base font-semibold">État du compte</p>
            <p className="mt-2 text-sm leading-7">{feedback}</p>
          </div>
        ) : null}

        {!isConfigured ? (
          <div className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-low px-5 py-5">
            <p className="font-headline text-lg font-semibold text-on-surface">
              Configuration nécessaire
            </p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              Ajoutez `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
              dans votre environnement pour activer les liens de connexion.
              `NEXT_PUBLIC_SITE_URL` reste recommandé pour les liens générés hors
              de la requête courante.
            </p>
          </div>
        ) : null}

        {user ? (
          profile ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="surface-section space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <div className="space-y-2">
                    <p className="font-headline text-2xl font-semibold text-on-surface">
                      Votre espace privé est prêt.
                    </p>
                    <p className="text-sm leading-7 text-on-surface-variant">
                      {user.email}
                    </p>
                    <p className="text-xs uppercase tracking-[0.16em] text-outline">
                      {profile.profileKind === "patient" ? "Patiente" : "Aidant"}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-7 text-on-surface-variant">
                  Choisissez simplement la suite la plus utile maintenant. Le reste
                  restera accessible depuis la navigation.
                </p>

                <div className="divide-y divide-outline-variant/30 rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest">
                  <a
                    href={redirectTo}
                    className="flex items-center justify-between px-5 py-5 transition-colors hover:bg-surface-container-low"
                  >
                    <div>
                      <p className="font-headline text-lg font-semibold text-on-surface">
                        Continuer là où vous en étiez
                      </p>
                      <p className="mt-1 text-sm leading-7 text-on-surface-variant">
                        Reprendre le chemin qui vous a amené ici sans repartir de zéro.
                      </p>
                    </div>
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-primary"
                      strokeWidth={2}
                    />
                  </a>

                  <Link
                    href="/messages"
                    className="flex items-center justify-between px-5 py-5 transition-colors hover:bg-surface-container-low"
                  >
                    <div>
                      <p className="font-headline text-lg font-semibold text-on-surface">
                        Ouvrir la messagerie
                      </p>
                      <p className="mt-1 text-sm leading-7 text-on-surface-variant">
                        Retrouver l'association, vos groupes et vos contacts de confiance.
                      </p>
                    </div>
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-primary"
                      strokeWidth={2}
                    />
                  </Link>

                  <Link
                    href="/parcours"
                    className="flex items-center justify-between px-5 py-5 transition-colors hover:bg-surface-container-low"
                  >
                    <div>
                      <p className="font-headline text-lg font-semibold text-on-surface">
                        Reprendre mon parcours
                      </p>
                      <p className="mt-1 text-sm leading-7 text-on-surface-variant">
                        Retrouver rendez-vous, notes et documents privés sans vous disperser.
                      </p>
                    </div>
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-primary"
                      strokeWidth={2}
                    />
                  </Link>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-low px-5 py-5">
                  <div className="flex items-center gap-3 text-primary">
                    <ShieldCheck aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                    <p className="font-headline text-base font-semibold text-on-surface">
                      Résumé du profil
                    </p>
                  </div>
                  <dl className="mt-4 space-y-3 text-sm leading-7 text-on-surface-variant">
                    <div>
                      <dt className="font-semibold text-on-surface">Nom d&apos;usage</dt>
                      <dd>{profile.displayName}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-on-surface">Pseudonyme</dt>
                      <dd>{profile.pseudonym ?? "Non défini"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-on-surface">Affichage pseudonyme</dt>
                      <dd>{profile.isAnonymous ? "Activé" : "Désactivé"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-on-surface">Rôle</dt>
                      <dd>{roles.length > 0 ? roles.join(", ") : "member"}</dd>
                    </div>
                  </dl>
                </div>

                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full rounded-full bg-surface-container-lowest px-5 py-3 font-label text-sm font-semibold text-on-surface shadow-ambient"
                  >
                    Se déconnecter
                  </button>
                </form>
              </aside>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <form action={saveProfileSetup} className="surface-section space-y-6">
                <div className="space-y-2">
                  <div className="eyebrow">Dernière étape</div>
                  <p className="font-headline text-2xl font-semibold text-on-surface">
                    Finaliser votre profil en douceur
                  </p>
                  <p className="text-sm leading-7 text-on-surface-variant">
                    Commencez par votre rôle et votre nom d&apos;usage. Les options de
                    confidentialité restent facultatives et peuvent attendre.
                  </p>
                </div>

                <input type="hidden" name="redirectTo" value={redirectTo} />

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                      Je suis
                    </span>
                    <select
                      name="profileKind"
                      defaultValue="patient"
                      className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface"
                    >
                      <option value="patient">Patiente</option>
                      <option value="caregiver">Aidant</option>
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                      Prénom ou nom d&apos;usage
                    </span>
                    <input
                      type="text"
                      name="displayName"
                      placeholder="Claire"
                      className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                      defaultValue={user.email?.split("@")[0] ?? ""}
                      required
                    />
                  </label>
                </div>

                <details className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-4">
                  <summary className="cursor-pointer list-none font-headline text-base font-semibold text-on-surface">
                    Options de confidentialité facultatives
                  </summary>
                  <div className="mt-4 space-y-4">
                    <label className="block space-y-2">
                      <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                        Pseudonyme
                      </span>
                      <input
                        type="text"
                        name="pseudonym"
                        placeholder="RoseCalme"
                        className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                      />
                    </label>

                    <label className="flex items-start gap-3 rounded-brand bg-surface-container-low px-4 py-4">
                      <input
                        type="checkbox"
                        name="isAnonymous"
                        className="mt-1 h-4 w-4 rounded-sm border-outline-variant text-primary focus:ring-primary/30"
                      />
                      <span className="text-sm leading-7 text-on-surface-variant">
                        Afficher mon profil sous pseudonyme dans les espaces prévus, tout
                        en restant identifiable par l&apos;équipe de modération si besoin.
                      </span>
                    </label>
                  </div>
                </details>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
                >
                  Finaliser mon profil
                  <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                </button>
              </form>

              <aside className="space-y-4">
                <div className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-low px-5 py-5">
                  <div className="flex items-center gap-3 text-primary">
                    <Sparkles aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                    <p className="font-headline text-base font-semibold text-on-surface">
                      Ce qu&apos;il se passe ensuite
                    </p>
                  </div>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-on-surface-variant">
                    <li>La messagerie privée devient accessible.</li>
                    <li>Le parcours peut enregistrer rendez-vous, notes et documents.</li>
                    <li>Vos options de confidentialité restent modifiables plus tard.</li>
                  </ul>
                </div>
              </aside>
            </div>
          )
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <form action={signInWithMagicLink} className="surface-section space-y-6">
              <div className="space-y-2">
                <p className="font-headline text-2xl font-semibold text-on-surface">
                  Recevoir un lien de connexion
                </p>
                <p className="text-sm leading-7 text-on-surface-variant">
                  Utilisez votre email pour recevoir un lien sécurisé. Le profil
                  patient ou aidant sera précisé juste après.
                </p>
              </div>

              <input type="hidden" name="redirectTo" value={redirectTo} />

              <label className="block space-y-2">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Adresse email
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="claire@example.com"
                  className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                  required
                />
              </label>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
              >
                Envoyer le lien
                <MailCheck aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
              </button>
            </form>

            <aside className="space-y-4">
              <div className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-low px-5 py-5">
                <div className="flex items-center gap-3 text-primary">
                  <ShieldCheck aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  <p className="font-headline text-base font-semibold text-on-surface">
                    Ce que le compte ouvre
                  </p>
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-on-surface-variant">
                  <li>Une connexion sans mot de passe, via un lien envoyé par email.</li>
                  <li>Des espaces privés pour les messages, notes, rendez-vous et documents.</li>
                  <li>Les mêmes repères sur mobile, ordinateur ou navigateur partagé.</li>
                </ul>
              </div>

              <Link
                href="/aide"
                className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
              >
                Voir les repères d&apos;aide
                <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
              </Link>
            </aside>
          </div>
        )}
      </section>
    </AppShell>
  );
}
