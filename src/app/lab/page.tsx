import type { Metadata } from "next";
import { getTab, labCount } from "@/content/lab";
import { TabContent } from "@/components/lab/TabContent";

export const metadata: Metadata = {
  title: "Lab",
  description: `${labCount} engineering ideas you can break with your own hands: patterns, system design, databases, data structures, algorithms, security and networking.`,
};

export default function LabPage() {
  return <TabContent tab={getTab("patterns")!} />;
}
