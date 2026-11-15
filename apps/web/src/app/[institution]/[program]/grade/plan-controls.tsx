"use client";

import { Check } from "lucide-react";

import { WarnBadge } from "@/components/brand";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PlanResult, Preferences } from "@/lib/scheduler";
import { SHIFT_LABEL, type Shift } from "@/lib/time";
import type { Program } from "@/lib/use-program";
import { cn } from "@/lib/utils";

const SHIFTS: Shift[] = ["morning", "afternoon", "night"];
const LETTERS = ["A", "B", "C", "D", "E"];
const PRESSED = "data-[state=on]:border-foreground/40 data-[state=on]:bg-secondary data-[state=on]:text-foreground";

export function PlanControls({
  program,
  result,
  optionIndex,
  onChoose,
}: {
  program: Program;
  result: PlanResult;
  optionIndex: number;
  onChoose: (index: number) => void;
}) {
  const prefs = program.state.preferences;
  const setPrefs = (change: Partial<Preferences>) =>
    program.change((s) => ({ preferences: { ...s.preferences, ...change } }));
  const count = result.options.length;

  return (
    <section aria-labelledby="options" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="options" className="text-lg font-medium">
          {program.state.planned.length === 0 ? "Opções" : count === 1 ? "1 grade possível" : `${count} grades possíveis`}
        </h2>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Preferências" data-tour="prefs">
          <ToggleGroup
            type="multiple"
            variant="outline"
            value={prefs.shifts}
            onValueChange={(shifts) => shifts.length && setPrefs({ shifts: shifts as Shift[] })}
            aria-label="Turnos"
          >
            {SHIFTS.map((shift) => (
              <ToggleGroupItem key={shift} value={shift} className={cn("h-9 px-3", PRESSED)}>
                {prefs.shifts.includes(shift) && <Check strokeWidth={2} aria-hidden="true" />}
                {SHIFT_LABEL[shift]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Toggle
            variant="outline"
            pressed={prefs.avoidGaps}
            onPressedChange={(avoidGaps) => setPrefs({ avoidGaps })}
            className={cn("h-9 px-3", PRESSED)}
          >
            {prefs.avoidGaps && <Check strokeWidth={2} aria-hidden="true" />}
            Sem janelas
          </Toggle>
          <Toggle
            variant="outline"
            pressed={prefs.fewerDays}
            onPressedChange={(fewerDays) => setPrefs({ fewerDays })}
            className={cn("h-9 px-3", PRESSED)}
          >
            {prefs.fewerDays && <Check strokeWidth={2} aria-hidden="true" />}
            Menos dias
          </Toggle>
          <Toggle
            variant="outline"
            pressed={prefs.onlyWithSeats}
            onPressedChange={(onlyWithSeats) => setPrefs({ onlyWithSeats })}
            className={cn("h-9 px-3", PRESSED)}
          >
            {prefs.onlyWithSeats && <Check strokeWidth={2} aria-hidden="true" />}
            Só com vaga
          </Toggle>
        </div>
      </div>

      {count > 0 && (
        <div className="grid gap-3 sm:grid-cols-3" data-tour="options">
          {result.options.map((option, i) => {
            const fitted = Object.keys(option.sections).length;
            const pressed = i === optionIndex;
            const clashed = option.left.filter((code) => !option.overLimit.includes(code));
            return (
              <button
                key={i}
                type="button"
                aria-pressed={pressed}
                onClick={() => onChoose(i)}
                className={cn(
                  "flex flex-col gap-1 rounded-xl border bg-card p-4 text-left transition-colors",
                  pressed ? "border-primary ring-1 ring-primary" : "hover:border-foreground/25",
                )}
              >
                <span className={cn("text-xs font-medium", pressed ? "text-primary" : "text-muted-foreground")}>
                  Opção {LETTERS[i]}
                </span>
                <span className="text-sm font-medium">
                  {fitted} {fitted === 1 ? "disciplina" : "disciplinas"} · {option.load} h/semana · {option.days}{" "}
                  {option.days === 1 ? "dia" : "dias"}
                </span>
                <span className="text-xs text-ink-2">
                  {option.gapMinutes === 0 ? "sem janelas" : `${formatGap(option.gapMinutes)} de janela por semana`}
                </span>
                {option.fullSections > 0 && (
                  <WarnBadge className="mt-1">
                    {option.fullSections === 1 ? "1 turma sem vagas" : `${option.fullSections} turmas sem vagas`}
                  </WarnBadge>
                )}
                {option.overLimit.length > 0 && (
                  <span className="text-xs text-muted-foreground">Fora pelo limite: {option.overLimit.join(", ")}</span>
                )}
                {clashed.length > 0 && (
                  <span className="text-xs text-muted-foreground">Fora por choque: {clashed.join(", ")}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {result.truncated && (
        <p className="text-sm text-muted-foreground">
          Muitas combinações: mostrando as melhores encontradas. Fixe turmas ou tire disciplinas para refinar.
        </p>
      )}
    </section>
  );
}

function formatGap(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
}
