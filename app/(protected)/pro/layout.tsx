import { redirect } from "next/navigation";

import { requireProfessional } from "@/lib/auth";
import { getProfessionalProfileByUserId } from "@/lib/professional";

export const dynamic = "force-dynamic";

export default async function ProLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await requireProfessional("/pro");
  const professionalProfile = await getProfessionalProfileByUserId(user.id);

  if (!professionalProfile) {
    redirect("/account/pro-onboarding?status=complete-pro-profile&redirectTo=/pro");
  }

  return children;
}
