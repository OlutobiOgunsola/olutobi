import { Adire } from "@/components/art/Adire";
import { Button, Container } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <Container className="grid min-h-[70vh] items-center gap-12 py-20 md:grid-cols-12">
      <div className="md:col-span-7">
        <h1 className=" font-display font-extrabold text-6xl leading-[0.95] sm:text-7xl">
          This thread <em className="font-serif font-normal italic text-ochre">wasn&apos;t woven.</em>
        </h1>
        <p className="mt-6 max-w-[48ch] text-lg text-ink-2">
          The page you&apos;re looking for doesn&apos;t exist, or it moved when the site was rebuilt.
        </p>
        <div className="mt-10">
          <Button href="/">Back to the start</Button>
        </div>
      </div>
      <div className="md:col-span-5">
        <div className="mx-auto max-w-xs overflow-hidden rounded-2xl opacity-80 md:ml-auto md:mr-0">
          <Adire seed="missing" cols={3} rows={3} className="block h-auto w-full" />
        </div>
      </div>
    </Container>
  );
}
