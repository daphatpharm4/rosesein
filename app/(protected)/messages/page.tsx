import { BackLink } from "@/components/navigation/back-link";
import { AppShell } from "@/components/shell/app-shell";
import { getInboxConversations } from "@/lib/messages";
import { MessageInbox } from "@/components/chat/message-inbox";

export default async function MessagesPage() {
  const conversations = await getInboxConversations();

  return (
    <AppShell title="Messagerie" currentPath="/messages">
      <section className="space-y-6">
        <BackLink href="/" label="Retour à l'accueil" />
        <MessageInbox conversations={conversations} />
      </section>
    </AppShell>
  );
}
