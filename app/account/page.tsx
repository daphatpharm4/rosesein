import Link from "next/link";
import { ArrowRight, MailCheck, ShieldCheck, Sparkles, UserRound } from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUserContext } from "@/lib/auth";
import { hasSupabaseBrowserEnv } from "@/lib/env";

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
  const redirectTo = firstValue(params.redirectTo) ?? "/messages";
  const { user, profile, roles } = await getCurrentUserContext();
  const isConfigured = hasSupabaseBrowserEnv();
  const feedback = error ? messageMap[error] : status ? messageMap[status] : undefined;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";

  return (
    <AppShell title="Compte" currentPath="/account">
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="eyebrow">Authentification et accès</div>
          <h1 className="editorial-title">Entrer dans votre espace privé en douceur.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Cette première fondation utilise Supabase pour préparer des surfaces
            protégées, sans exposer les messages, les préférences ou les futurs
            documents personnels.
          </p>
        </div>

        {feedback ? (
          <div className={`surface-card ${feedbackTone}`}>
            <p className="font-headline text-base font-semibold">État de connexion</p>
            <p className="mt-2 text-sm leading-7">{feedback}</p>
          </div>
        ) : null}

        {!isConfigured ? (
          <div className="surface-card">
            <p className="font-headline text-lg font-semibold text-on-surface">
              Configuration nécessaire
            </p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              Ajoutez `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
              dans votre environnement pour activer les liens de connexion.
              `NEXT_PUBLIC_SITE_URL` reste recommande pour les liens generes hors
              de la requete courante.
            </p>
          </div>
        ) : null}

        {user ? (
          !profile ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <form action={saveProfileSetup} className="surface-section space-y-5">
                <div>
                  <div className="eyebrow">Derniere etape</div>
                  <p className="font-headline text-xl font-semibold text-on-surface">
                    Construire votre espace prive avec douceur
                  </p>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                    Nous avons besoin de quelques informations simples pour adapter
                    l'experience a votre situation et proteger l'acces aux espaces
                    sensibles.
                  </p>
                </div>

                <input type="hidden" name="redirectTo" value={redirectTo} />

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
                    Prenom ou nom d'usage
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

                <label className="block space-y-2">
                  <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                    Pseudonyme facultatif
                  </span>
                  <input
                    type="text"
                    name="pseudonym"
                    placeholder="RoseCalme"
                    className="w-full rounded-brand bg-surface-container-high px-4 py-4 text-sm text-on-surface placeholder:text-outline"
                  />
                </label>

                <label className="flex items-start gap-3 rounded-brand bg-surface-container-lowest px-4 py-4 shadow-ambient">
                  <input
                    type="checkbox"
                    name="isAnonymous"
                    className="mt-1 h-4 w-4 rounded-sm border-outline-variant text-primary focus:ring-primary/30"
                  />
                  <span className="text-sm leading-7 text-on-surface-variant">
                    Je souhaite afficher mon profil de facon pseudonyme dans les
                    espaces prevus, tout en restant identifiable par l'equipe de
                    moderation si necessaire.
                  </span>
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
                >
                  Finaliser mon profil
                  <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                </button>
              </form>

              <div className="surface-card">
                <div className="flex items-center gap-3 text-primary">
                  <Sparkles aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  <p className="font-headline text-base font-semibold text-on-surface">
                    Pourquoi cette etape existe
                  </p>
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-on-surface-variant">
                  <li>Adapter les contenus a votre profil de patiente ou d'aidant.</li>
                  <li>Preparer les echanges prives avec l'association en toute clarte.</li>
                  <li>Permettre un mode pseudonyme sans perdre la securite de moderation.</li>
                </ul>
              </div>
            </div>
          ) : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="surface-section">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-headline text-lg font-semibold text-on-surface">
                    Session active
                  </p>
                  <p className="text-sm text-on-surface-variant">{user.email}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-outline">
                    {profile.profileKind === "patient" ? "Patiente" : "Aidant"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                Les routes protégées peuvent maintenant s'appuyer sur votre session.
                Votre profil de base est en place. Les prochaines étapes relieront
                vos parcours, vos préférences et les données de messagerie à vos
                tables Supabase.
              </p>
              <div className="mt-4 rounded-brand bg-surface-container-low px-4 py-4 text-sm leading-7 text-on-surface-variant">
                <p>
                  <span className="font-semibold text-on-surface">Nom d'usage:</span>{" "}
                  {profile.displayName}
                </p>
                <p>
                  <span className="font-semibold text-on-surface">Pseudonyme:</span>{" "}
                  {profile.pseudonym ?? "Non defini"}
                </p>
                <p>
                  <span className="font-semibold text-on-surface">Mode pseudonyme:</span>{" "}
                  {profile.isAnonymous ? "Active" : "Desactive"}
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={redirectTo}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
                >
                  Continuer
                  <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                </a>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="rounded-full bg-surface-container-lowest px-5 py-3 font-label text-sm font-semibold text-on-surface shadow-ambient"
                  >
                    Se déconnecter
                  </button>
                </form>
              </div>
            </div>

            <div className="surface-card">
              <div className="flex items-center gap-3 text-primary">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                <p className="font-headline text-base font-semibold text-on-surface">
                  Routes protégées
                </p>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-on-surface-variant">
                <li>`/messages` pour la messagerie privée</li>
                <li>`/parcours` pour l'agenda, les notes et les documents</li>
                <li>`/parametres` pour les préférences de compte et de confidentialité</li>
                <li>
                  Rôle actuel: {roles.length > 0 ? roles.join(", ") : "member"}
                </li>
              </ul>
            </div>
          </div>
          )
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <form action={signInWithMagicLink} className="surface-section space-y-5">
              <div>
                <p className="font-headline text-xl font-semibold text-on-surface">
                  Recevoir un lien de connexion
                </p>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Utilisez votre email pour recevoir un lien sécurisé. Le parcours
                  `patient` ou `aidant` sera branché ensuite sur votre profil.
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

            <div className="surface-card">
              <p className="font-headline text-lg font-semibold text-on-surface">
                Ce que cette phase met en place
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-on-surface-variant">
                <li>Rafraîchissement de session via middleware Supabase.</li>
                <li>Protection des routes sensibles avant toute donnée réelle.</li>
                <li>Point d'entrée canonique pour votre compte et la connexion.</li>
              </ul>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
