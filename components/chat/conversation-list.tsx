import { ConversationCard } from "@/components/chat/conversation-card";
import type { Conversation } from "@/lib/messages";

type ConversationListProps = {
  conversations: Conversation[];
};

export function ConversationList({ conversations }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-brand-xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-5 shadow-ambient">
        <p className="type-card-title text-on-surface">
          Aucun résultat pour cette recherche
        </p>
        <p className="type-note mt-2 text-on-surface-variant">
          Essayez un autre mot-clé ou revenez à la liste complète des conversations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation, index) => (
        <ConversationCard key={conversation.id} conversation={conversation} index={index} />
      ))}
    </div>
  );
}
