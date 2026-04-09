import { requireProfessionalProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireProfessionalProfile("/pro");

  return children;
}
