import "server-only";

import { requireStaff, type ProfileKind } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ManagedUser = {
  id: string;
  displayName: string;
  pseudonym: string | null;
  profileKind: ProfileKind;
  isAnonymous: boolean;
  difficultDayMode: boolean;
  roles: string[];
};

export async function getManagedUsers(query = ""): Promise<ManagedUser[]> {
  await requireStaff("/admin/utilisateurs");
  const supabase = await createSupabaseServerClient();

  let profileQuery = supabase
    .from("profiles")
    .select("id, display_name, pseudonym, profile_kind, is_anonymous, difficult_day_mode")
    .order("display_name", { ascending: true });

  const normalized = query.trim();
  if (normalized) {
    profileQuery = profileQuery.or(
      `display_name.ilike.%${normalized}%,pseudonym.ilike.%${normalized}%`
    );
  }

  const { data: profiles } = await profileQuery;
  const userIds = (profiles ?? []).map((profile) => profile.id as string);

  const { data: roles } =
    userIds.length > 0
      ? await supabase.from("user_roles").select("user_id, role").in("user_id", userIds)
      : { data: [] };

  const roleMap = new Map<string, string[]>();
  for (const row of roles ?? []) {
    const userRole = row.user_id as string;
    roleMap.set(userRole, [...(roleMap.get(userRole) ?? []), row.role as string]);
  }

  return (profiles ?? []).map((profile) => ({
    id: profile.id,
    displayName: profile.display_name,
    pseudonym: profile.pseudonym,
    profileKind: profile.profile_kind,
    isAnonymous: profile.is_anonymous,
    difficultDayMode: profile.difficult_day_mode ?? false,
    roles: roleMap.get(profile.id) ?? ["member"],
  }));
}
