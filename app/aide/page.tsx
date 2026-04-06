import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CircleHelp,
  HeartHandshake,
  LockKeyhole,
  MessageCircleHeart,
  ShieldAlert,
  Smartphone,
} from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";

const faqItems = [
  {
    question: "ROSE-SEIN remplace-t-il un avis médical ou un service d'urgence ?",
    answer:
      "Non. L'application aide à s'orienter, à contacter l'association et à organiser son parcours personnel. Elle ne remplace ni une équipe médicale, ni le 112, ni un service d'urgence.",
  },
  {
    question: "Quand utiliser la messagerie ROSE-SEIN ?",
    answer:
      "Utilisez-la pour poser une question à l'association, demander une orientation, signaler une difficulté de navigation ou reprendre un échange déjà engagé dans un cadre sécurisé.",
  },
  {
    question: "Que faire si un contenu paraît faux, dangereux ou intrusif ?",
    answer:
      "Si le contenu se trouve dans la messagerie, utilisez le signalement prévu dans le fil. Sinon, passez par la messagerie sécurisée ou par le site associatif afin qu'une personne de l'équipe puisse revoir la situation.",
  },
  {
    question: "Mes notes et mes rendez-vous dans Parcours sont-ils visibles par d'autres personnes ?",
    answer:
      "Non. Les rendez-vous et notes du parcours sont stockés dans des tables privées, liées à votre compte, avec une politique d'accès limitée à votre utilisateur.",
  },
];

export default function HelpPage() {
  return (
    <AppShell title="Aide" currentPath="/aide">
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="eyebrow">Aide et orientation</div>
          <h1 className="editorial-title">Trouver le bon appui, sans dramatiser ni minimiser.</h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Cette surface oriente vers le bon canal selon la situation: support
            associatif, question de compte, besoin d'information, ou urgence à sortir
            de l'application immédiatement.
          </p>
        </div>

        <section className="surface-section border border-primary/10 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
              <ShieldAlert aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="space-y-3">
              <p className="font-headline text-lg font-semibold text-on-surface">
                En cas d&apos;urgence ou de détresse immédiate
              </p>
              <p className="text-sm leading-7 text-on-surface-variant">
                ROSE-SEIN n&apos;est pas un service d&apos;urgence ni une ligne médicale.
                Si la situation est grave, urgente, ou si vous craignez pour votre
                sécurité ou celle d&apos;une autre personne, contactez immédiatement les
                secours locaux. Depuis la France et l&apos;Union européenne, le <strong>112</strong>{" "}
                permet de joindre les urgences.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="tel:112"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
                >
                  Appeler le 112
                </a>
                <p className="rounded-full bg-surface-container-lowest px-4 py-3 text-sm text-on-surface shadow-ambient">
                  Si possible, contactez aussi votre équipe de soins habituelle.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="surface-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircleHeart aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <h2 className="mt-5 font-headline text-lg font-semibold text-on-surface">
              Support associatif sécurisé
            </h2>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              Pour une question d&apos;orientation, un besoin d&apos;aide dans
              l&apos;application, ou une demande de suivi avec l&apos;association.
            </p>
            <Link
              href="/messages"
              className="mt-5 inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
            >
              Ouvrir la messagerie
              <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </article>

          <article className="surface-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <Smartphone aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <h2 className="mt-5 font-headline text-lg font-semibold text-on-surface">
              Compte, accès et réglages
            </h2>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              Pour se connecter, mettre à jour son profil, ou reprendre la main sur ses
              préférences et surfaces privées.
            </p>
            <Link
              href="/account"
              className="mt-5 inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
            >
              Aller au compte
              <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </article>

          <article className="surface-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HeartHandshake aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <h2 className="mt-5 font-headline text-lg font-semibold text-on-surface">
              Repères institutionnels
            </h2>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              Pour retrouver la voix publique de l&apos;association, ses contenus et ses
              points d&apos;entrée institutionnels.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/association"
                className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
              >
                Voir l&apos;association
                <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              </Link>
              <a
                href="https://rosesein.org/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-label text-sm font-semibold text-primary"
              >
                Ouvrir rosesein.org
                <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              </a>
            </div>
          </article>

          <article className="surface-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <LockKeyhole aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <h2 className="mt-5 font-headline text-lg font-semibold text-on-surface">
              Signalement et confidentialité
            </h2>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              Si un échange ou un contenu vous semble inadapté, intrusif, ou risqué,
              utilisez le signalement en messagerie ou contactez l&apos;association pour
              demander une revue.
            </p>
            <p className="mt-5 text-sm leading-7 text-on-surface-variant">
              Les données privées ne sont pas destinées à être publiques. Si vous avez
              un doute sur un accès ou une exposition involontaire, passez par un canal
              associatif dès que possible.
            </p>
          </article>
        </div>

        <section className="space-y-4">
          <div>
            <div className="eyebrow">FAQ</div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              Les réponses les plus utiles en premier
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item) => (
              <details key={item.question} className="surface-card group">
                <summary className="flex cursor-pointer list-none items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CircleHelp aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <span className="font-headline text-base font-semibold text-on-surface">
                    {item.question}
                  </span>
                </summary>
                <p className="mt-4 pl-12 text-sm leading-7 text-on-surface-variant">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="surface-card">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <AlertTriangle aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline text-lg font-semibold text-on-surface">
                Limite volontaire de cette surface
              </p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Cette page donne des repères de support et d&apos;escalade. Elle ne pose
                pas de diagnostic, ne qualifie pas une urgence clinique, et ne prétend
                pas remplacer les professionnels de santé ou les services publics
                compétents.
              </p>
            </div>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
