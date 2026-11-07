import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTab, labTabs, tabCount } from "@/content/lab";
import { TabContent } from "@/components/lab/TabContent";

export function generateStaticParams() {
  return labTabs.filter((t) => t.slug !== "patterns").map((t) => ({ tab: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/lab/[tab]">): Promise<Metadata> {
  const { tab: slug } = await params;
  const tab = getTab(slug);
  if (!tab || slug === "patterns") return { title: "Not found" };
  return { title: `${tab.name} · Lab`, description: `${tabCount(tab)} interactive demos. ${tab.intro}` };
}

/* Params are read inside Suspense so tab switches render the shell instantly. Every tab is
   prerendered, so the fallback only ever flashes in development. */
export default function Page({ params }: PageProps<"/lab/[tab]">) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <TabPage params={params} />
    </Suspense>
  );
}

async function TabPage({ params }: { params: Promise<{ tab: string }> }) {
  const { tab: slug } = await params;
  const tab = getTab(slug);
  if (!tab || slug === "patterns") notFound();
  return <TabContent tab={tab} />;
}
