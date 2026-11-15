"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CloseIcon, SearchIcon } from "@/components/icons";
import { buttonClass, WarnBadge } from "@/components/ui";
import type { ProgramBundle, Section } from "@/lib/catalog-types";
import type { EntryState } from "@/lib/eligibility";
import { seatsLabel, sectionSummary, sectionTimes, type SUBJECT_COLORS, UNAVAILABLE_TEXT } from "@/lib/format";
import { type PlanOption, type PlanResult, sectionsConflict } from "@/lib/scheduler";
import type { Program } from "@/lib/use-program";


type Color = (typeof SUBJECT_COLORS)[number];

function fold(text: string) {
  return text.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

export function SubjectPanel({
  bundle,
  program,
  result,
  option,
  colors,
}: {
  bundle: ProgramBundle;
  program: Program;
  result: PlanResult;
  option: PlanOption | undefined;
  colors: Record<string, Color>;
}) {
  const { state, eligibility, name } = program;
  const sectionsBySubject = useMemo(() => {
    const map = new Map<string, Section[]>();
    for (const s of bundle.sections) {
      if (s.withdrawn) continue;
      map.set(s.subjectCode, [...(map.get(s.subjectCode) ?? []), s]);
    }
    return map;
  }, [bundle.sections]);

  const available = useMemo(
    () =>
      [...eligibility.states.values()]
        .filter((s) => s.status === "available" && !state.planned.includes(s.entry.subjectCode))
        .sort(
          (a, b) =>
            categoryRank(a) - categoryRank(b) ||
            (a.entry.period ?? 99) - (b.entry.period ?? 99) ||
            a.entry.subjectCode.localeCompare(b.entry.subjectCode),
        ),
    [eligibility, state.planned],
  );
  const offeredMandatory = available.filter((s) => s.offered && s.entry.category === "mandatory");
  const notOffered = available.filter((s) => !s.offered && s.entry.category === "mandatory");

  const suggest = () => {
    const firstPeriod = offeredMandatory[0]?.entry.period;
    offeredMandatory
      .filter((s) => s.entry.period === firstPeriod || s.entry.period === (firstPeriod ?? 0) + 1)
      .slice(0, 5)
      .forEach((s) => program.setPlanned(s.entry.subjectCode, true));
  };

  const plannedHours = state.planned.reduce((sum, code) => {
    const hours = eligibility.states.get(code)?.entry.workloadHours ?? 0;
    return sum + (option && code in option.sections ? hours : 0);
  }, 0);

  return (
    <aside aria-label="Disciplinas" className="flex min-w-0 flex-[1_1_320px] flex-col gap-5 md:max-w-[400px]">
      <SubjectSearch states={available} name={name} onAdd={(code) => program.setPlanned(code, true)} />

      <section aria-labelledby="in-plan" className="flex flex-col gap-2">
        <h2 id="in-plan" className="text-sm font-semibold text-ink-2">
          Na grade · {state.planned.length} {state.planned.length === 1 ? "disciplina" : "disciplinas"}
          {plannedHours ? ` · ${plannedHours} h` : ""}
        </h2>
        {state.planned.length === 0 && offeredMandatory.length > 0 && (
          <button type="button" onClick={suggest} className={`${buttonClass.secondary} justify-start`}>
            Sugerir as do próximo período
          </button>
        )}
        {state.planned.map((code) => (
          <PlannedRow
            key={code}
            code={code}
            name={name(code)}
            color={colors[code]}
            sections={sectionsBySubject.get(code) ?? []}
            chosen={option?.sections[code]}
            unavailable={result.unavailable.find((u) => u.code === code)?.reason}
            left={option?.left.includes(code) ?? false}
            locked={state.locked[code]}
            onLock={(section) =>
              program.change((s) => {
                const locked = { ...s.locked };
                if (section) locked[code] = section;
                else delete locked[code];
                return { locked };
              })
            }
            onRemove={() => program.setPlanned(code, false)}
          />
        ))}
      </section>

      <section aria-labelledby="can-take" className="flex flex-col gap-2">
        <h2 id="can-take" className="text-sm font-semibold text-ink-2">
          Obrigatórias que você pode cursar · {offeredMandatory.length}
        </h2>
        {offeredMandatory.length === 0 ? (
          <p className="text-sm text-muted">
            Nenhuma obrigatória liberada e ofertada agora. Use a busca para eletivas ou marque o que já cursou em{" "}
            <Link href={`/${bundle.institution.code}/${bundle.program.code.toLowerCase()}/progresso`}>Progresso</Link>.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-line bg-surface">
            {offeredMandatory.map((s) => (
              <AvailableRow
                key={s.entry.subjectCode}
                state={s}
                name={name(s.entry.subjectCode)}
                sections={sectionsBySubject.get(s.entry.subjectCode) ?? []}
                option={option}
                onAdd={() => program.setPlanned(s.entry.subjectCode, true)}
              />
            ))}
          </ul>
        )}
        {notOffered.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer py-1 font-semibold text-ink-2">
              Liberadas mas não ofertadas em {bundle.term.code} · {notOffered.length}
            </summary>
            <ul className="mt-1 flex flex-col gap-1 text-ink-2">
              {notOffered.map((s) => (
                <li key={s.entry.subjectCode}>
                  <strong>{s.entry.subjectCode}</strong> {name(s.entry.subjectCode)}
                </li>
              ))}
            </ul>
          </details>
        )}
        <Link
          href={`/${bundle.institution.code}/${bundle.program.code.toLowerCase()}/progresso`}
          className="text-sm font-semibold"
        >
          Por que outras disciplinas não aparecem?
        </Link>
      </section>
    </aside>
  );
}

function categoryRank(s: EntryState) {
  return { mandatory: 0, elective: 1, optional: 2, activity: 3 }[s.entry.category];
}

function SubjectSearch({
  states,
  name,
  onAdd,
}: {
  states: EntryState[];
  name: (code: string) => string;
  onAdd: (code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = fold(query.trim());
  const matches = q
    ? states
        .filter((s) => s.offered && s.entry.category !== "activity")
        .filter((s) => fold(`${s.entry.subjectCode} ${name(s.entry.subjectCode)}`).includes(q))
        .slice(0, 8)
    : [];
  return (
    <div className="relative">
      <div className="flex min-h-12 items-center gap-2.5 rounded-xl border border-line-strong bg-surface px-3.5 focus-within:border-brand">
        <SearchIcon size={18} className="flex-none text-muted" />
        <label htmlFor="subject-search" className="sr-only">
          Buscar disciplina para adicionar
        </label>
        <input
          id="subject-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Adicionar disciplina (nome ou código)"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
      </div>
      {q && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-line bg-surface py-1 shadow-lg">
          {matches.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted">
              Nenhuma disciplina liberada e ofertada com esse nome.
            </li>
          )}
          {matches.map((s) => (
            <li key={s.entry.subjectCode}>
              <button
                type="button"
                onClick={() => {
                  onAdd(s.entry.subjectCode);
                  setQuery("");
                }}
                className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-brand-tint"
              >
                <span className="text-[15px] font-semibold">
                  {s.entry.subjectCode} {name(s.entry.subjectCode)}
                </span>
                <span className="text-sm text-muted">
                  {s.entry.category === "mandatory" ? `${s.entry.period}º período` : "eletiva"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlannedRow({
  code,
  name,
  color,
  sections,
  chosen,
  unavailable,
  left,
  locked,
  onLock,
  onRemove,
}: {
  code: string;
  name: string;
  color: Color | undefined;
  sections: Section[];
  chosen: Section | undefined;
  unavailable: keyof typeof UNAVAILABLE_TEXT | undefined;
  left: boolean;
  locked: string | undefined;
  onLock: (section: string | null) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
      <span
        aria-hidden="true"
        className="mt-1 size-3 flex-none rounded"
        style={{ background: color?.bg, border: `1px solid ${color?.border}` }}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[15px] font-semibold">
          {code} {name}
        </span>
        {unavailable ? (
          <WarnBadge>{UNAVAILABLE_TEXT[unavailable]}</WarnBadge>
        ) : left ? (
          <WarnBadge>não coube nesta opção</WarnBadge>
        ) : chosen ? (
          <span className="text-[13px] text-muted">
            Turma {chosen.code} · {sectionSummary(chosen)}
            {seatsLabel(chosen) ? ` · ${seatsLabel(chosen)}` : ""}
          </span>
        ) : null}
        {sections.length > 1 && (
          <label className="mt-1 flex flex-col gap-1 text-[13px] text-ink-2">
            <span className="sr-only">Turma de {code}</span>
            <select
              value={locked ?? ""}
              onChange={(e) => onLock(e.target.value || null)}
              className="min-h-10 rounded-lg border border-line-strong bg-surface px-2 text-[13px]"
            >
              <option value="">Melhor turma (automático)</option>
              {sections.map((s) => (
                <option key={s.id} value={s.code}>
                  Fixar turma {s.code}: {sectionTimes(s)}
                  {seatsLabel(s) ? ` (${seatsLabel(s)})` : ""}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Tirar ${code} da grade`}
        className="-mr-1.5 -mt-1.5 flex size-11 flex-none items-center justify-center rounded-xl text-muted hover:bg-soft"
      >
        <CloseIcon size={18} />
      </button>
    </div>
  );
}

function AvailableRow({
  state,
  name,
  sections,
  option,
  onAdd,
}: {
  state: EntryState;
  name: string;
  sections: Section[];
  option: PlanOption | undefined;
  onAdd: () => void;
}) {
  const placed = option ? Object.entries(option.sections) : [];
  // Clashes with the current option when every one of its sections does.
  const clash =
    placed.length && sections.length && sections.every((s) => placed.some(([, p]) => sectionsConflict(p, s)))
      ? placed.find(([, p]) => sectionsConflict(p, sections[0]))?.[0]
      : undefined;
  const open = sections.filter((s) => s.seats === null || s.seats > 0).length;

  return (
    <li className="flex items-center gap-2.5 border-b border-soft px-3 py-2.5 last:border-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold">
          {state.entry.subjectCode} {name}
        </span>
        <span className="text-[13px] text-ink-2">
          {state.entry.period}º per. · {sections.length} {sections.length === 1 ? "turma" : "turmas"}
          {sections.length === 1 ? ` · ${sectionSummary(sections[0])}` : ""}
          {state.unlocks.length ? ` · destrava ${state.unlocks.length}` : ""}
        </span>
        {open === 0 ? (
          <WarnBadge className="!text-xs">sem vagas</WarnBadge>
        ) : clash ? (
          <WarnBadge className="!text-xs">choca com {clash} na opção atual</WarnBadge>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="min-h-10 flex-none rounded-xl border border-brand bg-surface px-3 text-sm font-semibold text-brand hover:bg-brand-tint"
      >
        Adicionar
      </button>
    </li>
  );
}
