import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function ProgramHome({ params }: PageProps<"/[institution]/[program]">) {
  return (
    <Suspense>
      <RedirectToProgress params={params} />
    </Suspense>
  );
}

async function RedirectToProgress({
  params,
}: Pick<PageProps<"/[institution]/[program]">, "params">): Promise<never> {
  const { institution, program } = await params;
  return redirect(`/${institution}/${program}/progresso`);
}
