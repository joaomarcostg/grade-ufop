"use client";

import { CheckIcon, LockIcon } from "@/components/icons";
import { buttonClass, Card, WarnBadge } from "@/components/ui";
import type { ProgramBundle } from "@/lib/catalog-types";
import type { EntryState } from "@/lib/eligibility";
import { formatMinutes, WEEKDAY_SHORT } from "@/lib/time";
import { formatHours, type useProgram } from "@/lib/use-program";

const CATEGORY_LABEL = {
  mandatory: "Obrigatória",
  elective: "Eletiva",
  optional: "Optativa",
  activity: "Atividade",
} as const;

export function SubjectDetail({
  bundle,
  program,
  state,
  onSelect,
}: {
  bundle: ProgramBundle;
  program: ReturnType<typeof useProgram>;
  state: EntryState;
  onSelect: (code: string) => void;
}) {
  const { entry } = state;
  const code = entry.subjectCode;
  const subject = bundle.subjects[code];
  const done = state.status === "done";
  const planned = program.state.planned.includes(code);
  const sections = bundle.sections.filter((s) => s.subjectCode === code && !s.withdrawn);
  const completedHours = program.eligibility.progress.completedHours;

  const meta = [
    code,
    CATEGORY_LABEL[entry.category],
    entry.period ? `${entry.period}º período` : null,
    entry.workloadHours ? formatHours(entry.workloadHours) : null,
    entry.track,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="flex w-full flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold text-muted">{meta}</span>
        <h2 className="font-display text-[22px] font-semibold">{program.name(code)}</h2>
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-line px-4">
        <input
          type="checkbox"
          checked={done}
          onChange={(e) => program.setCompleted([code], e.target.checked)}
          className="size-5 accent-brand"
        />
        <span className="text-[15px] font-medium">Já fui aprovado nesta disciplina</span>
      </label>

      {entry.requirements.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Pré-requisitos</span>
          <ul className="flex flex-col gap-1.5">
            {entry.requirements.map((r) => {
              const met = done || !state.missing.includes(r);
              return (
                <li key={r.type === "subject" ? r.code : `h${r.hours}`} className="flex items-center gap-2.5 text-[15px]">
                  {met ? (
                    <CheckIcon size={16} className="flex-none text-done" />
                  ) : (
                    <LockIcon size={16} className="flex-none text-ink-2" />
                  )}
                  {r.type === "subject" ? (
                    <button type="button" onClick={() => onSelect(r.code)} className="text-left hover:underline">
                      <strong>{r.code}</strong> {program.name(r.code)}
                    </button>
                  ) : (
                    <span>
                      {formatHours(r.hours)} cursadas{" "}
                      <span className="text-muted">(você tem {formatHours(completedHours)})</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {state.unlocks.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">É pré-requisito de</span>
          <ul className="flex flex-wrap gap-2">
            {state.unlocks.map((u) => (
              <li key={u}>
                <button
                  type="button"
                  onClick={() => onSelect(u)}
                  className="rounded-lg border border-line px-2.5 py-1.5 text-sm hover:border-line-strong"
                >
                  <strong>{u}</strong> {program.name(u)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Turmas em {bundle.term.code}</span>
        {sections.length === 0 ? (
          <span className="text-[15px] text-muted">Não ofertada neste semestre.</span>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {sections.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px]">
                <strong>Turma {s.code}</strong>
                <span className="text-ink-2">
                  {s.meetings.length
                    ? s.meetings.map((m) => `${WEEKDAY_SHORT[m.day]} ${formatMinutes(m.start)}`).join(", ")
                    : "sem horário fixo"}
                </span>
                {s.seats === 0 ? (
                  <WarnBadge>sem vagas</WarnBadge>
                ) : s.seats !== null ? (
                  <span className="text-sm text-muted">{s.seats} vagas</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!done && state.status === "available" && sections.length > 0 && (
        <button
          type="button"
          onClick={() => program.setPlanned(code, !planned)}
          className={`${planned ? buttonClass.secondary : buttonClass.primary} self-start`}
        >
          {planned ? "Tirar da grade" : "Adicionar à grade"}
        </button>
      )}

      {subject?.syllabus && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold text-brand">Ementa</summary>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{subject.syllabus}</p>
        </details>
      )}
    </Card>
  );
}
