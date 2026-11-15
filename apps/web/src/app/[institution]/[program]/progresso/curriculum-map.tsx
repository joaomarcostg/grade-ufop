"use client";

import { CalendarCheck, Lock } from "lucide-react";
import { useMemo } from "react";

import { WarnBadge } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type EntryState, missingLabel } from "@/lib/eligibility";
import type { Program } from "@/lib/use-program";
import { cn } from "@/lib/utils";

interface Period {
  period: number;
  states: EntryState[];
}

export function usePeriods(program: Program): Period[] {
  return useMemo(() => {
    const byPeriod = new Map<number, EntryState[]>();
    for (const s of program.eligibility.states.values()) {
      if (s.entry.category !== "mandatory") continue;
      const period = s.entry.period ?? 0;
      byPeriod.set(period, [...(byPeriod.get(period) ?? []), s]);
    }
    return [...byPeriod.entries()]
      .sort(([a], [b]) => (a || 99) - (b || 99))
      .map(([period, states]) => ({
        period,
        states: states.sort((a, b) => a.entry.subjectCode.localeCompare(b.entry.subjectCode)),
      }));
  }, [program.eligibility]);
}

export function periodLabel(period: number) {
  return period ? `${period}º período` : "Sem período";
}

/** Marks every mandatory subject up to a period in one go. */
export function MarkUntil({ program, periods }: { program: Program; periods: Period[] }) {
  const numbered = periods.filter((p) => p.period > 0);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={program.simulating} data-tour="mark-until">
          Já cursei até…
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <p className="mb-2 text-sm text-ink-2">Marca como aprovadas todas as obrigatórias até o período escolhido.</p>
        <div className="grid grid-cols-4 gap-1.5">
          {numbered.map(({ period }) => (
            <Button
              key={period}
              variant="outline"
              size="sm"
              onClick={() =>
                program.setCompleted(
                  numbered.filter((p) => p.period <= period).flatMap((p) => p.states.map((s) => s.entry.subjectCode)),
                  true,
                )
              }
            >
              {period}º
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function CurriculumMap({
  program,
  periods,
  term,
  onOpen,
  openCode,
}: {
  program: Program;
  periods: Period[];
  term: string;
  onOpen: (code: string) => void;
  openCode: string | null;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8">
      <div className="flex flex-col gap-6 md:grid md:auto-cols-[minmax(164px,1fr)] md:grid-flow-col md:gap-3">
        {periods.map((p) => (
          <PeriodColumn key={p.period} {...p} program={program} term={term} onOpen={onOpen} openCode={openCode} />
        ))}
      </div>
    </div>
  );
}

function PeriodColumn({
  period,
  states,
  program,
  term,
  onOpen,
  openCode,
}: Period & { program: Program; term: string; onOpen: (code: string) => void; openCode: string | null }) {
  const done = states.filter((s) => s.status === "done").length;
  const all = done === states.length;
  const id = `period-${period}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <div className="flex h-8 items-center gap-2 px-2">
        <Checkbox
          id={`${id}-all`}
          checked={all ? true : done > 0 ? "indeterminate" : false}
          disabled={program.simulating}
          onCheckedChange={() => program.setCompleted(states.map((s) => s.entry.subjectCode), !all)}
          aria-label={`Marcar todas do ${periodLabel(period)}`}
          className="data-checked:border-done data-checked:bg-done data-[state=indeterminate]:border-done data-[state=indeterminate]:bg-done data-[state=indeterminate]:text-white"
        />
        <h3 id={id} className="text-sm font-medium">
          {periodLabel(period)}
        </h3>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {done}/{states.length}
        </span>
      </div>
      {states.map((s) => (
        <SubjectChip
          key={s.entry.subjectCode}
          state={s}
          program={program}
          term={term}
          onOpen={onOpen}
          open={openCode === s.entry.subjectCode}
        />
      ))}
    </section>
  );
}

function SubjectChip({
  state,
  program,
  term,
  onOpen,
  open,
}: {
  state: EntryState;
  program: Program;
  term: string;
  onOpen: (code: string) => void;
  open: boolean;
}) {
  const code = state.entry.subjectCode;
  const name = program.name(code);
  const done = state.status === "done";
  const locked = state.status === "locked";
  const planned = !done && program.state.planned.includes(code);

  return (
    <div
      className={cn(
        "flex gap-2 rounded-lg border p-2 transition-colors",
        done && "border-done-line bg-done-bg",
        !done && !locked && state.offered && "border-foreground/25 bg-card",
        !done && !locked && !state.offered && "border-dashed border-foreground/25 bg-card",
        locked && "border-dashed border-foreground/20 bg-muted/60",
        open && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <Checkbox
        checked={done}
        disabled={program.simulating}
        onCheckedChange={(checked) => program.setCompleted([code], checked === true)}
        aria-label={`Aprovado em ${code} ${name}`}
        className="mt-0.5 bg-card data-checked:border-done data-checked:bg-done"
      />
      <button type="button" onClick={() => onOpen(code)} className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
          {locked && <Lock className="size-3" strokeWidth={2} aria-hidden="true" />}
          {code}
          {locked && <span className="font-sans">· {missingLabel(state)}</span>}
          {planned && (
            <Tooltip>
              <TooltipTrigger asChild>
                <CalendarCheck className="ml-auto size-3.5 text-primary" strokeWidth={2} aria-label="Na sua grade" />
              </TooltipTrigger>
              <TooltipContent>Na sua grade</TooltipContent>
            </Tooltip>
          )}
        </span>
        <span className={cn("text-sm leading-snug", locked ? "text-ink-2" : "text-foreground")}>{name}</span>
        {!done && !locked && !state.offered && (
          <span className="text-xs text-muted-foreground">não ofertada em {term}</span>
        )}
        {!done && !locked && state.offered && state.openSections === 0 && (
          <WarnBadge className="mt-1">sem vagas</WarnBadge>
        )}
      </button>
    </div>
  );
}
