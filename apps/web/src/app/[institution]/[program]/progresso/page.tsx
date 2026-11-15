import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SiteFooter } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getProgramBundle } from "@/server/catalog";

import { ProgressView } from "./progress-view";

export const metadata: Metadata = { title: "Progresso no curso" };

export default function ProgressPage({ params }: PageProps<"/[institution]/[program]/progresso">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProgressLoader params={params} />
    </Suspense>
  );
}

async function ProgressLoader({ params }: Pick<PageProps<"/[institution]/[program]/progresso">, "params">) {
  const { institution, program } = await params;
  const bundle = await getProgramBundle(institution, program);
  if (!bundle) notFound();
  return (
    <>
      <ProgressView bundle={bundle} />
      <SiteFooter syncedAt={bundle.term.syncedAt} />
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-4 py-9 sm:px-8">
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-36" />
      <Skeleton className="h-96" />
    </div>
  );
}
