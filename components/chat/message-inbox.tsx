"use client";

import Link from "next/link";
import type { Route } from "next";
import { useDeferredValue, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, MessageSquarePlus } from "lucide-react";
import { ConversationList } from "@/components/chat/conversation-list";
import { SearchField } from "@/components/chat/search-field";
import { RevealScene } from "@/components/motion/reveal-scene";
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
  const deferredQuery = useDeferredValue(query);
  const tabRefs = useRef<Record<ConversationScope, HTMLButtonElement | null>>({
    association: null,
    private: null,
  });

  const visibleConversations = conversations.filter((conversation) => {
    const matchesScope = conversation.scope === scope;
    const normalizedQuery = deferredQuery.trim().toLowerCase();

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

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentScope: ConversationScope) {
    const currentIndex = tabs.findIndex((tab) => tab.value === currentScope);

    if (currentIndex === -1) {
      return;
    }

    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();

    const nextScope = tabs[nextIndex]?.value;
    if (!nextScope) {
      return;
    }

    setScope(nextScope);
    tabRefs.current[nextScope]?.focus();
  }

  const activeTabId = `messages-tab-${scope}`;
  const activePanelId = `messages-panel-${scope}`;
  const tabShift = scope === "private" ? "100%" : "0%";

  return (
    <RevealScene>
      <section className="space-y-6">
        <div className="space-y-4" data-reveal="section" style={{ ["--reveal-delay" as string]: "30ms" }}>
          <div className="eyebrow">Messagerie calme et privée</div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h1 className="editorial-title">Rester en lien, sans bruit.</h1>
              <p className="mt-3 max-w-lg text-base leading-7 text-on-surface-variant">
                Commencez par le bon canal, retrouvez un échange en quelques secondes,
                puis écrivez seulement si vous en avez besoin.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={"/messages/nouveau" as Route}
                className="motion-cta inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 font-label text-sm font-semibold text-on-primary"
              >
                <MessageSquarePlus aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                Nouveau message ou groupe
              </Link>
              <Link
                href={"/aide" as Route}
                className="motion-cta inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-5 py-3 font-label text-sm font-semibold text-primary shadow-ambient"
              >
                Besoin d&apos;un repère
                <ArrowRight aria-hidden="true" className="motion-link-arrow h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>

        <div
          className="space-y-4 rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-4 shadow-ambient"
          data-reveal="section"
          style={{ ["--reveal-delay" as string]: "120ms" }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-on-surface-variant">
              {scope === "association"
                ? "Retrouvez les échanges officiels avec l'association."
                : "Retrouvez les conversations directes et les groupes privés entre membres."}
            </p>
            <p className="font-label text-xs uppercase tracking-[0.16em] text-outline">
              {visibleConversations.length} conversation
              {visibleConversations.length > 1 ? "s" : ""}
            </p>
          </div>

          <div
            className="message-tab-shell rounded-full bg-surface-container-low p-1.5"
            style={{ ["--tab-shift" as string]: tabShift }}
          >
            <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Filtres de conversation">
              {tabs.map((tab) => {
                const isActive = tab.value === scope;
                const tabId = `messages-tab-${tab.value}`;
                const panelId = `messages-panel-${tab.value}`;

                return (
                  <button
                    key={tab.value}
                    ref={(node) => {
                      tabRefs.current[tab.value] = node;
                    }}
                    id={tabId}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={panelId}
                    tabIndex={isActive ? 0 : -1}
                    data-active={isActive ? "true" : "false"}
                    onClick={() => setScope(tab.value)}
                    onKeyDown={(event) => handleTabKeyDown(event, tab.value)}
                    className={`message-tab-button rounded-full px-4 py-3 text-sm font-semibold ${
                      isActive ? "text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div data-reveal="section" style={{ ["--reveal-delay" as string]: "180ms" }}>
          <SearchField value={query} onChange={setQuery} />
        </div>

        <div
          id={activePanelId}
          role="tabpanel"
          aria-labelledby={activeTabId}
          tabIndex={0}
          data-reveal="section"
          style={{ ["--reveal-delay" as string]: "240ms" }}
        >
          <ConversationList conversations={visibleConversations} />
        </div>
      </section>
    </RevealScene>
  );
}
