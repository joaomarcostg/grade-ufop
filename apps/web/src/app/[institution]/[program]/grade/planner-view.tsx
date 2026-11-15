"use client";

import { useMemo, useState } from "react";

import { Skeleton, WarnBadge } from "@/components/ui";
import type { ProgramBundle } from "@/lib/catalog-types";
import { SUBJECT_COLORS } from "@/lib/format";
import { type PlanOption, plan } from "@/lib/scheduler";
import { useProgram } from "@/lib/use-program";

import { PlanControls } from "./plan-controls";
import { SavedPlans } from "./saved-plans";
import { SubjectPanel } from "./subject-panel";
import { DayAgenda, WeekCalendar } from "./week-calendar";

export function PlannerView({ bundle }: { bundle: ProgramBundle }) {
  const program = useProgram(bundle);
  const { state, hydrated } = program;
  const [chosen, setChosen] = useState(0);

  const result = useMemo(
    () =>
      plan({
        subjects: state.planned,
        sections: bundle.sections,
        locked: state.locked,
        preferences: state.preferences,
        limit: 3,
      }),
    [bundle.sections, state.planned, state.locked, state.preferences],
  );

  const colors = useMemo(() => {
    const map: Record<string, (typeof SUBJECT_COLORS)[number]> = {};
    state.planned.forEach((code, i) => (map[code] = SUBJECT_COLORS[i % SUBJECT_COLORS.length]));
    return map;
  }, [state.planned]);

  const optionIndex = Math.min(chosen, Math.max(0, result.options.length - 1));
  const option: PlanOption | undefined = result.options[optionIndex];

  if (!hydrated) {
    return (
      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap gap-6 px-4 py-6 sm:px-6">
        <Skeleton className="h-[600px] flex-[1_1_320px]" />
        <Skeleton className="h-[600px] flex-[999_1_640px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-start gap-6 px-4 pb-10 pt-6 sm:px-6">
      <SubjectPanel bundle={bundle} program={program} result={result} option={option} colors={colors} />

      <main className="flex min-w-0 flex-[999_1_640px] flex-col gap-4">
        <h1 className="sr-only">Montar grade de {bundle.program.name}</h1>
        <PlanControls
          program={program}
          result={result}
          optionIndex={optionIndex}
          onChoose={setChosen}
          name={program.name}
        />

        {state.planned.length === 0 ? (
          <EmptyState />
        ) : option ? (
          <>
            <div className="hidden md:block">
              <WeekCalendar option={option} colors={colors} name={program.name} />
            </div>
            <div className="md:hidden">
              <DayAgenda option={option} colors={colors} name={program.name} />
            </div>
            <NoFixedTime option={option} name={program.name} />
            <SavedPlans bundle={bundle} program={program} option={option} optionIndex={optionIndex} />
          </>
        ) : (
          <div className="rounded-2xl border border-line bg-surface p-6">
            <WarnBadge>Nenhuma combinação possível</WarnBadge>
            <p className="mt-3 text-[15px] text-ink-2">
              As disciplinas escolhidas não têm turmas com essas preferências. Tente liberar outro turno ou desmarcar
              “Só com vaga”.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center">
      <h2 className="font-display text-xl font-semibold">Sua grade está vazia</h2>
      <p className="text-[15px] text-muted">
        Adicione disciplinas na lista ao lado. As combinações de turmas sem choque aparecem aqui.
      </p>
    </div>
  );
}

function NoFixedTime({ option, name }: { option: PlanOption; name: (code: string) => string }) {
  const loose = Object.entries(option.sections).filter(([, s]) => s.meetings.length === 0);
  if (loose.length === 0) return null;
  return (
    <p className="text-sm text-ink-2">
      Sem horário fixo: {loose.map(([code, s]) => `${code} ${name(code)} (turma ${s.code})`).join(", ")}
    </p>
  );
}
