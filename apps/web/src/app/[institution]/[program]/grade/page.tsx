import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SiteFooter } from "@/components/site-header";
import { Skeleton } from "@/components/ui";
import { getProgramBundle } from "@/server/catalog";

import { PlannerView } from "./planner-view";

export const metadata: Metadata = { title: "Montar grade" };

export default function PlannerPage({ params }: PageProps<"/[institution]/[program]/grade">) {
  return (
    <Suspense fallback={<PlannerSkeleton />}>
      <PlannerLoader params={params} />
    </Suspense>
  );
}

async function PlannerLoader({ params }: Pick<PageProps<"/[institution]/[program]/grade">, "params">) {
  const { institution, program } = await params;
  const bundle = await getProgramBundle(institution, program);
  if (!bundle) notFound();
  return (
    <>
      <PlannerView bundle={bundle} />
      <SiteFooter syncedAt={bundle.term.syncedAt} />
    </>
  );
}

function PlannerSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-wrap gap-6 px-4 py-6 sm:px-6">
      <Skeleton className="h-[600px] flex-[1_1_320px]" />
      <Skeleton className="h-[600px] flex-[999_1_640px]" />
    </div>
  );
}
