import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, Search, ShieldCheck, ShieldPlus, UserRoundCog } from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { requireStaff } from "@/lib/auth";
import { getManagedUsers } from "@/lib/admin-users";

import { updateManagedUserRole } from "./actions";

type AdminUsersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const feedbackMap: Record<string, string> = {
  "role-updated": "Le rôle a été mis à jour.",
  "role-invalid": "Le rôle demandé est invalide.",
  "role-update-failed": "La mise à jour du rôle a échoué.",
  "self-admin-lock": "Vous ne pouvez pas retirer votre propre rôle admin.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const query = (await searchParams) ?? {};
  const q = firstValue(query.q) ?? "";
  const status = firstValue(query.status);
  const error = firstValue(query.error);
  const feedback = feedbackMap[error ?? status ?? ""] ?? null;
  const feedbackTone = error
    ? "bg-primary/10 text-on-primary-container"
    : "bg-secondary-container text-on-secondary-container";
  const { user, roles } = await requireStaff("/admin/utilisateurs");
  const users = await getManagedUsers(q);
  const canManageRoles = roles.includes("admin");

  return (
    <AppShell title="Utilisateurs" currentPath="/admin">
      <section className="space-y-6">
        <Link
          href={"/admin" as Route}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          Retour à l'administration
        </Link>

        <div className="space-y-3">
          <div className="eyebrow">Gouvernance</div>
          <h1 className="editorial-title">Gérer les accès et les rôles.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Consultez les membres actifs, identifiez les profils pseudonymes et ajustez
            les rôles staff lorsque vous avez les droits admin.
          </p>
        </div>

        {feedback ? (
          <div
            className={`surface-card ${feedbackTone}`}
            role={error ? "alert" : "status"}
            aria-live={error ? "assertive" : "polite"}
          >
            <p className="font-headline text-base font-semibold">Utilisateurs</p>
            <p className="mt-2 text-sm leading-7">{feedback}</p>
          </div>
        ) : null}

        <form action="/admin/utilisateurs" className="surface-card">
          <label className="block space-y-2">
            <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Rechercher un membre
            </span>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                strokeWidth={1.8}
              />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Prénom d'usage ou pseudonyme"
                className="w-full rounded-brand bg-surface-container-high py-4 pl-11 pr-4 text-sm text-on-surface placeholder:text-outline"
              />
            </div>
          </label>
        </form>

        {!canManageRoles ? (
          <div className="surface-card">
            <p className="font-headline text-base font-semibold text-on-surface">
              Accès lecture seule
            </p>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              Votre rôle staff permet de consulter les profils, mais seul un compte admin
              peut modifier les rôles.
            </p>
          </div>
        ) : null}

        <div className="space-y-4">
          {users.map((managedUser) => {
            const isSelf = managedUser.id === user.id;
            const hasModerator = managedUser.roles.includes("moderator");
            const hasAdmin = managedUser.roles.includes("admin");

            return (
              <article key={managedUser.id} className="surface-section space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserRoundCog aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="font-headline text-lg font-semibold text-on-surface">
                        {managedUser.displayName}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-on-surface-variant">
                        {managedUser.profileKind === "patient" ? "Patiente" : "Aidant"}
                        {managedUser.pseudonym ? ` · pseudo public ${managedUser.pseudonym}` : ""}
                        {managedUser.isAnonymous ? " · mode pseudonyme" : ""}
                        {managedUser.difficultDayMode ? " · mode journée difficile" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    {managedUser.roles.map((role) => (
                      <span
                        key={role}
                        className="rounded-full bg-surface-container-low px-3 py-2 font-label text-xs font-semibold text-on-surface-variant"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {canManageRoles ? (
                  <div className="flex flex-wrap gap-3">
                    <form action={updateManagedUserRole}>
                      <input type="hidden" name="userId" value={managedUser.id} />
                      <input type="hidden" name="role" value="moderator" />
                      <input type="hidden" name="enabled" value={String(!hasModerator)} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2.5 font-label text-sm font-semibold text-on-surface shadow-ambient"
                      >
                        {hasModerator ? (
                          <ShieldCheck aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                        ) : (
                          <ShieldPlus aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                        )}
                        {hasModerator ? "Retirer modérateur" : "Donner modérateur"}
                      </button>
                    </form>

                    <form action={updateManagedUserRole}>
                      <input type="hidden" name="userId" value={managedUser.id} />
                      <input type="hidden" name="role" value="admin" />
                      <input type="hidden" name="enabled" value={String(!hasAdmin)} />
                      <button
                        type="submit"
                        disabled={isSelf && hasAdmin}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2.5 font-label text-sm font-semibold text-on-primary disabled:opacity-50"
                      >
                        {hasAdmin ? (
                          <ShieldCheck aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                        ) : (
                          <ShieldPlus aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                        )}
                        {hasAdmin ? "Retirer admin" : "Donner admin"}
                      </button>
                    </form>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
