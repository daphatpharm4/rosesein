"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useRealtimeMessages(threadId: string) {
  const router = useRouter();

  useEffect(() => {
    if (!threadId || !hasSupabaseBrowserEnv()) {
      return;
    }

    let supabase;

    try {
      supabase = createSupabaseBrowserClient();
    } catch (error) {
      console.error("Failed to initialize Supabase realtime client for messages.", error);
      return;
    }

    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [threadId, router]);
}
