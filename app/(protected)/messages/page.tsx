import { AppShell } from "@/components/shell/app-shell";
import { getInboxConversations } from "@/lib/messages";
import { MessageInbox } from "@/components/chat/message-inbox";

export default async function MessagesPage() {
  const conversations = await getInboxConversations();

  return (
    <AppShell title="Messagerie" currentPath="/messages">
      <MessageInbox conversations={conversations} />
    </AppShell>
  );
}
