import type { Metadata } from "next";
import { AtelierApp } from "@/components/atelier/atelier-app";
import { isAdmin, previewHint } from "@/lib/auth";
import { getSiteData } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Atelier",
  robots: { index: false, follow: false },
};

export default async function AtelierPage() {
  const admin = await isAdmin();
  // Replies are included only after the studio cookie is valid.
  const data = admin ? await getSiteData() : null;

  return <AtelierApp initialAdmin={admin} initialData={data} previewHint={previewHint()} />;
}
