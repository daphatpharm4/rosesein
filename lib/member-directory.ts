import "server-only";

import { requireCompletedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DirectoryMember = {
  id: string;
  visibleName: string;
  profileKind: "patient" | "caregiver";
  isAnonymous: boolean;
  hasExistingThread: boolean;
};

export async function searchMemberDirectory(query = ""): Promise<DirectoryMember[]> {
  await requireCompletedProfile("/messages/nouveau");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("search_member_directory", {
    search_query: query,
  });

  if (error || !data) {
    return [];
  }

  return (data as Array<{
    user_id: string;
    visible_name: string;
    profile_kind: "patient" | "caregiver";
    is_anonymous: boolean;
    has_existing_thread: boolean;
  }>).map((row) => ({
    id: row.user_id,
    visibleName: row.visible_name,
    profileKind: row.profile_kind,
    isAnonymous: row.is_anonymous,
    hasExistingThread: row.has_existing_thread,
  }));
}
