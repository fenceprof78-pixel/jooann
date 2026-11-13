import type { Metadata } from "next";
import { WeddingSite } from "@/components/wedding/wedding-site";
import { buildEventJsonLd, formatWeddingDate } from "@/lib/format";
import { getPublicSiteData } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPublicSiteData();
  const { settings } = data;
  const title = `${settings.brideName} & ${settings.groomName}`;
  const description = `${settings.tagline} ${formatWeddingDate(settings.weddingDate)} · ${settings.city}, ${settings.country}.`;
  const site = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return {
    metadataBase: new URL(site),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/images/og-cover.jpg", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/og-cover.jpg"],
    },
  };
}

export default async function HomePage() {
  const data = await getPublicSiteData();
  // JSON.stringify does not escape `<`, so a custom quote cannot break out of the script.
  const jsonLd = JSON.stringify(buildEventJsonLd(data.settings)).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <WeddingSite data={data} />
    </>
  );
}
