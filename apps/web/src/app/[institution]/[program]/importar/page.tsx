import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SiteFooter } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getProgramBundle } from "@/server/catalog";

import { ImportView } from "./import-view";

export const metadata: Metadata = { title: "Importar histórico" };

export default function ImportPage({ params }: PageProps<"/[institution]/[program]/importar">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-12 h-96 w-full max-w-3xl" />}>
      <ImportLoader params={params} />
    </Suspense>
  );
}

async function ImportLoader({ params }: Pick<PageProps<"/[institution]/[program]/importar">, "params">) {
  const { institution, program } = await params;
  const bundle = await getProgramBundle(institution, program);
  if (!bundle) notFound();
  return (
    <>
      <ImportView bundle={bundle} />
      <SiteFooter syncedAt={bundle.term.syncedAt} />
    </>
  );
}
