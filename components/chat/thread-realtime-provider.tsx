"use client";

import { useRealtimeMessages } from "@/lib/hooks/use-realtime-messages";

type Props = {
  threadId: string;
  children: React.ReactNode;
};

export function ThreadRealtimeProvider({ threadId, children }: Props) {
  useRealtimeMessages(threadId);
  return <>{children}</>;
}
