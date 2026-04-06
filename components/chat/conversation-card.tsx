import Link from "next/link";
import type { Route } from "next";
import { Building2, Circle, MessageCircleHeart, Users } from "lucide-react";
import type { Conversation } from "@/lib/messages";

type ConversationCardProps = {
  conversation: Conversation;
};

function ConversationIcon({ conversation }: ConversationCardProps) {
  if (conversation.kind === "association") {
    return <Building2 aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />;
  }

  if (conversation.kind === "group") {
    return <Users aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />;
  }

  return <MessageCircleHeart aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />;
}

export function ConversationCard({ conversation }: ConversationCardProps) {
  const accentClass =
    conversation.accent === "secondary"
      ? "bg-secondary-container text-on-secondary-container"
      : "bg-primary/10 text-primary";

  return (
    <Link
      href={conversation.href as Route}
      className={`block w-full rounded-brand-md p-5 text-left transition-transform duration-200 hover:-translate-y-0.5 ${
        conversation.active
          ? "bg-surface-container-lowest shadow-ambient"
          : "bg-surface-container-low"
      }`}
      aria-label={`Ouvrir la conversation ${conversation.name}`}
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full ${accentClass}`}
          >
            {conversation.kind === "direct" ? (
              <span className="font-headline text-base font-bold">
                {conversation.initials}
              </span>
            ) : (
              <ConversationIcon conversation={conversation} />
            )}
          </div>
          {conversation.isOnline ? (
            <Circle
              aria-hidden="true"
              className="absolute bottom-0 right-0 h-4 w-4 fill-emerald-500 text-emerald-500"
              strokeWidth={0}
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-3">
            <h3 className="font-headline text-base font-semibold text-on-surface">
              {conversation.name}
            </h3>
            <span
              className={`whitespace-nowrap font-label text-xs ${
                conversation.active ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              {conversation.timestamp}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm text-on-surface-variant">
              {conversation.preview}
            </p>
            {conversation.unreadCount ? (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-on-primary">
                {conversation.unreadCount}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
