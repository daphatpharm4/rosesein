import { ConversationCard } from "@/components/chat/conversation-card";
import type { Conversation } from "@/lib/messages";

type ConversationListProps = {
  conversations: Conversation[];
};

export function ConversationList({ conversations }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="surface-card">
        <p className="font-headline text-lg font-semibold text-on-surface">
          Aucun résultat pour cette recherche
        </p>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          Essayez un autre mot-clé ou revenez à la liste complète des conversations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => (
        <ConversationCard key={conversation.id} conversation={conversation} />
      ))}
    </div>
  );
}
