"use client";

import { useMemo, useState } from "react";

import { WarnBadge } from "@/components/brand";
import { SimulationBanner, SimulationSelect } from "@/components/simulation";
import { Skeleton } from "@/components/ui/skeleton";
import { DayAgenda, WeekCalendar } from "@/components/week-calendar";
import type { ProgramBundle } from "@/lib/catalog-types";
import { byPriority, defaultWeeklyLimit, weeklyClassesOf } from "@/lib/limits";
import { type PlanOption, plan } from "@/lib/scheduler";
import { useFirstVisitTour } from "@/lib/tour";
import { useProgram } from "@/lib/use-program";

import { PlanControls } from "./plan-controls";
import { SavedPlans } from "./saved-plans";
import { SubjectPanel } from "./subject-panel";

export function PlannerView({ bundle }: { bundle: ProgramBundle }) {
  const program = useProgram(bundle);
  const { state, hydrated, eligibility } = program;
  const [chosen, setChosen] = useState(0);
  useFirstVisitTour("planner", hydrated);

  const defaultLimit = defaultWeeklyLimit(bundle.program.code);
  const weeklyLimit = state.weeklyLimit ?? defaultLimit;
  // The plan is in priority order; colours follow the codes so reordering keeps them.
  const colorOrder = useMemo(() => [...state.planned].sort(), [state.planned]);
  // UFOP counts the limit in weekly class hours.
  const load = useMemo(
    () => Object.fromEntries(state.planned.map((code) => [code, weeklyClassesOf(eligibility.states.get(code)?.entry)])),
    [state.planned, eligibility.states],
  );
  const requestedLoad = Object.values(load).reduce((sum, n) => sum + n, 0);

  const result = useMemo(
    () =>
      plan({
        subjects: state.planned,
        sections: bundle.sections,
        locked: state.locked,
        preferences: state.preferences,
        load,
        maxLoad: weeklyLimit,
        limit: 3,
      }),
    [bundle.sections, state.planned, state.locked, state.preferences, load, weeklyLimit],
  );
  const names = useMemo(
    () => Object.fromEntries(Object.values(bundle.subjects).map((s) => [s.code, s.name])),
    [bundle.subjects],
  );

  const optionIndex = Math.min(chosen, Math.max(0, result.options.length - 1));
  const option: PlanOption | undefined = result.options[optionIndex];

  if (!hydrated) {
    return (
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap gap-6 px-4 py-8 sm:px-8">
        <Skeleton className="h-[560px] flex-[1_1_320px]" />
        <Skeleton className="h-[560px] flex-[999_1_640px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 pt-8 pb-12 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-medium tracking-tight">Montar grade</h1>
          <p className="text-sm text-muted-foreground">
            {bundle.program.name} · turmas de {bundle.term.code}
          </p>
        </div>
        <SimulationSelect program={program} />
      </div>

      <SimulationBanner
        program={program}
        term={bundle.term.code}
        onLoadTerm={(codes) => program.change(() => ({ planned: byPriority(codes, eligibility.states), locked: {} }))}
      />

      <div className="flex flex-wrap items-start gap-6">
        <SubjectPanel
          bundle={bundle}
          program={program}
          result={result}
          option={option}
          colorOrder={colorOrder}
          load={load}
          requestedLoad={requestedLoad}
          weeklyLimit={weeklyLimit}
          defaultLimit={defaultLimit}
        />

        <main className="flex min-w-0 flex-[999_1_640px] flex-col gap-4">
          <PlanControls program={program} result={result} optionIndex={optionIndex} onChoose={setChosen} />

          {state.planned.length === 0 ? (
            <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
              <h2 className="text-lg font-medium">Sua grade está vazia</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Escolha ao lado as disciplinas que quer cursar. Aqui aparecem as combinações de turmas sem choque de
                horário e dentro do limite de {weeklyLimit} horas-aula por semana.
              </p>
            </div>
          ) : option ? (
            <>
              <div data-tour="calendar" className="flex flex-col gap-4">
                <WeekCalendar option={option} order={colorOrder} names={names} className="hidden md:block" />
                <div className="md:hidden">
                  <DayAgenda option={option} order={colorOrder} names={names} />
                </div>
                <NoFixedTime option={option} names={names} />
              </div>
              <div data-tour="save">
                <SavedPlans bundle={bundle} program={program} option={option} optionIndex={optionIndex} />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl border bg-card p-6">
              <WarnBadge>Nenhuma combinação possível</WarnBadge>
              <p className="text-sm text-ink-2">
                As disciplinas escolhidas não têm turmas com essas preferências. Libere outro turno ou desmarque “Só
                com vaga”.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function NoFixedTime({ option, names }: { option: PlanOption; names: Record<string, string> }) {
  const loose = Object.entries(option.sections).filter(([, s]) => s.meetings.length === 0);
  if (loose.length === 0) return null;
  return (
    <p className="text-sm text-ink-2">
      Sem horário fixo: {loose.map(([code, s]) => `${code} ${names[code] ?? ""} (turma ${s.code})`).join(", ")}
    </p>
  );
}
