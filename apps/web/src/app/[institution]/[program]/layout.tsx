import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { getProgramBundle } from "@/server/catalog";

import { ProgramNav } from "./program-nav";

// Cache Components needs at least one known value; every other program renders
// on its first visit and is cached from then on.
export async function generateStaticParams() {
  return [{ institution: "ufop", program: "sjm" }];
}

export default function ProgramLayout({ children, params }: LayoutProps<"/[institution]/[program]">) {
  return (
    <>
      <Suspense fallback={<SiteHeader />}>
        <Header params={params} />
      </Suspense>
      {children}
    </>
  );
}

async function Header({ params }: Pick<LayoutProps<"/[institution]/[program]">, "params">) {
  const { institution, program } = await params;
  const bundle = await getProgramBundle(institution, program);
  return (
    <SiteHeader term={bundle?.term.code}>
      <ProgramNav base={`/${institution}/${program}`} />
    </SiteHeader>
  );
}
