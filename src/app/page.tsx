import { Hero } from "@/components/sections/Hero";
import { Ticker } from "@/components/sections/Ticker";
import { FeaturedArticle } from "@/components/sections/FeaturedArticle";
import { Building } from "@/components/sections/Building";
import { About } from "@/components/sections/About";
import { Writing } from "@/components/sections/Writing";
import { Contact } from "@/components/sections/Contact";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Ticker />
      <FeaturedArticle />
      <Writing />
      <Building />
      <About />
      <Contact />
    </>
  );
}
