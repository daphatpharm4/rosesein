"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { ConversationList } from "@/components/chat/conversation-list";
import { SearchField } from "@/components/chat/search-field";
import type { Conversation, ConversationScope } from "@/lib/messages";

const tabs: Array<{ value: ConversationScope; label: string }> = [
  { value: "association", label: "Association" },
  { value: "private", label: "Privé" },
];

type MessageInboxProps = {
  conversations: Conversation[];
};

export function MessageInbox({ conversations }: MessageInboxProps) {
  const [scope, setScope] = useState<ConversationScope>("association");
  const [query, setQuery] = useState("");
  const featuredConversation =
    conversations.find((conversation) => conversation.scope === "association") ??
    conversations[0];

  const visibleConversations = conversations.filter((conversation) => {
    const matchesScope = conversation.scope === scope;
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return matchesScope;
    }

    return (
      matchesScope &&
      `${conversation.name} ${conversation.preview}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  });

  return (
    <>
      <Link
        href={"/messages/nouveau" as Route}
        aria-label="Démarrer une nouvelle conversation"
        className="fixed bottom-32 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-on-primary shadow-ambient transition-transform active:scale-95"
      >
        <MessageSquarePlus aria-hidden="true" className="h-7 w-7" strokeWidth={2} />
      </Link>

      <section className="space-y-8">
        <div className="space-y-4">
          <div className="eyebrow">Messagerie calme et privée</div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h1 className="editorial-title">Rester en lien, sans bruit.</h1>
              <p className="mt-3 max-w-lg text-base leading-7 text-on-surface-variant">
                Une messagerie pensée pour les échanges utiles avec l’association,
                vos groupes de parole et vos contacts de confiance.
              </p>
            </div>
            <div className="surface-card max-w-sm bg-surface-container-lowest/90">
              <p className="font-headline text-base font-semibold text-on-surface">
                Priorité aujourd&apos;hui
              </p>
              {featuredConversation ? (
                <>
                  <p className="mt-2 text-sm font-semibold text-on-surface">
                    {featuredConversation.name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    {featuredConversation.preview}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Vos fils privés et associatifs apparaîtront ici dès qu&apos;un
                  échange existera. Le bouton flottant permet maintenant d&apos;écrire
                  librement à un autre membre.
                </p>
              )}
            </div>
          </div>
        </div>

        <SearchField value={query} onChange={setQuery} />

        <div className="rounded-full bg-surface-container-low p-1.5" role="tablist" aria-label="Filtres de conversation">
          <div className="grid grid-cols-2 gap-2">
            {tabs.map((tab) => {
              const isActive = tab.value === scope;

              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setScope(tab.value)}
                  className={`rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-surface-container-lowest text-primary shadow-ambient"
                      : "text-on-surface-variant"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <ConversationList conversations={visibleConversations} />
      </section>
    </>
  );
}
