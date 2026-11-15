"use client";

import { WarnBadge } from "@/components/ui";
import type { PlanResult, Preferences } from "@/lib/scheduler";
import { SHIFT_LABEL, type Shift } from "@/lib/time";

import type { Program } from "@/lib/use-program";

const SHIFTS: Shift[] = ["morning", "afternoon", "night"];
const LETTERS = ["A", "B", "C", "D", "E"];

export function PlanControls({
  program,
  result,
  optionIndex,
  onChoose,
  name,
}: {
  program: Program;
  result: PlanResult;
  optionIndex: number;
  onChoose: (index: number) => void;
  name: (code: string) => string;
}) {
  const prefs = program.state.preferences;
  const setPrefs = (change: Partial<Preferences>) =>
    program.change((s) => ({ preferences: { ...s.preferences, ...change } }));

  const toggleShift = (shift: Shift) => {
    const shifts = prefs.shifts.includes(shift) ? prefs.shifts.filter((s) => s !== shift) : [...prefs.shifts, shift];
    if (shifts.length) setPrefs({ shifts });
  };

  const count = result.options.length;
  return (
    <section aria-labelledby="options" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="options" className="font-display text-[22px] font-semibold">
          {program.state.planned.length === 0
            ? "Monte sua grade"
            : count === 1
              ? "1 grade possível"
              : `${count} grades possíveis`}
        </h2>
        <div role="group" aria-label="Preferências" className="flex flex-wrap items-center gap-2">
          {SHIFTS.map((shift) => (
            <Toggle key={shift} pressed={prefs.shifts.includes(shift)} onClick={() => toggleShift(shift)}>
              {SHIFT_LABEL[shift]}
            </Toggle>
          ))}
          <span aria-hidden="true" className="mx-1 h-6 w-px bg-line" />
          <Toggle pressed={prefs.avoidGaps} onClick={() => setPrefs({ avoidGaps: !prefs.avoidGaps })}>
            Sem janelas
          </Toggle>
          <Toggle pressed={prefs.fewerDays} onClick={() => setPrefs({ fewerDays: !prefs.fewerDays })}>
            Menos dias
          </Toggle>
          <Toggle pressed={prefs.onlyWithSeats} onClick={() => setPrefs({ onlyWithSeats: !prefs.onlyWithSeats })}>
            Só com vaga
          </Toggle>
        </div>
      </div>

      {count > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {result.options.map((option, i) => {
            const fitted = Object.keys(option.sections).length;
            const pressed = i === optionIndex;
            return (
              <button
                key={i}
                type="button"
                aria-pressed={pressed}
                onClick={() => onChoose(i)}
                className={`flex flex-col gap-1.5 rounded-2xl bg-surface p-4 text-left ${
                  pressed ? "border-2 border-brand" : "border border-line p-[17px] hover:border-line-strong"
                }`}
              >
                <span className={`text-[13px] font-bold ${pressed ? "text-brand" : "text-ink-2"}`}>
                  Opção {LETTERS[i]}
                </span>
                <span className="text-[15px] font-semibold">
                  {fitted} {fitted === 1 ? "disciplina" : "disciplinas"} · {option.days}{" "}
                  {option.days === 1 ? "dia" : "dias"}
                </span>
                <span className="text-[13px] text-ink-2">
                  {option.gapMinutes === 0 ? "sem janelas" : `${formatGap(option.gapMinutes)} de janela por semana`}
                </span>
                {option.fullSections > 0 && (
                  <WarnBadge className="!text-xs">
                    {option.fullSections === 1 ? "1 turma sem vagas" : `${option.fullSections} turmas sem vagas`}
                  </WarnBadge>
                )}
                {option.left.length > 0 && (
                  <span className="text-[13px] text-muted">
                    Fica de fora: {option.left.map((c) => `${c} ${name(c)}`).join(", ")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {result.truncated && (
        <p className="text-sm text-muted">
          Muitas combinações: mostrando as melhores encontradas. Fixe turmas ou tire disciplinas para refinar.
        </p>
      )}
    </section>
  );
}

function Toggle({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-10 rounded-full border px-3.5 text-sm font-semibold ${
        pressed ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink-2 hover:bg-soft"
      }`}
    >
      {children}
    </button>
  );
}

function formatGap(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
}
