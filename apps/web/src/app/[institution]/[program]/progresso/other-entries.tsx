"use client";

import { useMemo, useState } from "react";

import { CheckIcon, LockIcon, SearchIcon } from "@/components/icons";
import { Card, WarnBadge } from "@/components/ui";
import type { EntryCategory, ProgramBundle } from "@/lib/catalog-types";
import { type EntryState, missingLabel } from "@/lib/eligibility";
import { formatHours, type useProgram } from "@/lib/use-program";


const GROUPS: { category: EntryCategory; title: string }[] = [
  { category: "elective", title: "Eletivas" },
  { category: "optional", title: "Optativas" },
  { category: "activity", title: "Atividades" },
];

function fold(text: string) {
  return text.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

/** Electives, optional subjects and activities: long lists, so searchable rows instead of a map. */
export function OtherEntries({
  bundle,
  program,
  onSelect,
  selected,
}: {
  bundle: ProgramBundle;
  program: ReturnType<typeof useProgram>;
  onSelect: (code: string) => void;
  selected: string | null;
}) {
  const [query, setQuery] = useState("");
  const [onlyOffered, setOnlyOffered] = useState(false);

  const groups = useMemo(() => {
    const q = fold(query.trim());
    return GROUPS.map((g) => {
      const all = [...program.eligibility.states.values()].filter((s) => s.entry.category === g.category);
      const shown = all
        .filter((s) => !q || fold(`${s.entry.subjectCode} ${program.name(s.entry.subjectCode)}`).includes(q))
        .filter((s) => !onlyOffered || s.offered || s.status === "done")
        .sort(
          (a, b) =>
            rank(a) - rank(b) || program.name(a.entry.subjectCode).localeCompare(program.name(b.entry.subjectCode), "pt-BR"),
        );
      return { ...g, all, shown };
    }).filter((g) => g.all.length > 0);
  }, [program, query, onlyOffered]);

  if (groups.length === 0) return null;

  return (
    <section aria-labelledby="others" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="others" className="font-display text-2xl font-semibold">
          Eletivas e atividades
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyOffered}
              onChange={(e) => setOnlyOffered(e.target.checked)}
              className="size-4.5 accent-brand"
            />
            Só ofertadas em {bundle.term.code}
          </label>
          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-3">
            <SearchIcon size={17} className="text-muted" />
            <label htmlFor="others-search" className="sr-only">
              Buscar eletiva
            </label>
            <input
              id="others-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou código"
              className="w-56 bg-transparent text-[15px] outline-none"
            />
          </div>
        </div>
      </div>

      {groups.map((g) => {
        const doneHours = g.all
          .filter((s) => s.status === "done")
          .reduce((sum, s) => sum + (s.entry.workloadHours ?? 0), 0);
        return (
          <Card key={g.category} className="overflow-hidden">
            <h3 className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4 text-[17px] font-semibold">
              {g.title}
              <span className="text-sm font-normal text-muted">
                {g.all.length} no currículo · {formatHours(doneHours)} cursadas
              </span>
            </h3>
            <ul className="max-h-[420px] overflow-y-auto">
              {g.shown.length === 0 && <li className="px-5 py-4 text-sm text-muted">Nada encontrado.</li>}
              {g.shown.map((s) => (
                <Row
                  key={s.entry.subjectCode}
                  state={s}
                  program={program}
                  term={bundle.term.code}
                  selected={selected === s.entry.subjectCode}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </Card>
        );
      })}
    </section>
  );
}

function rank(s: EntryState) {
  if (s.status === "done") return 0;
  if (s.status === "available" && s.offered) return 1;
  if (s.status === "available") return 2;
  return 3;
}

function Row({
  state,
  program,
  term,
  selected,
  onSelect,
}: {
  state: EntryState;
  program: ReturnType<typeof useProgram>;
  term: string;
  selected: boolean;
  onSelect: (code: string) => void;
}) {
  const code = state.entry.subjectCode;
  const done = state.status === "done";
  return (
    <li
      className={`flex items-center gap-3.5 border-b border-soft px-5 py-2 last:border-0 ${selected ? "bg-brand-tint" : ""}`}
    >
      <input
        type="checkbox"
        checked={done}
        onChange={(e) => program.setCompleted([code], e.target.checked)}
        aria-label={`Aprovado em ${code} ${program.name(code)}`}
        className="size-5 flex-none accent-brand"
      />
      <button type="button" onClick={() => onSelect(code)} className="flex min-h-10 min-w-0 flex-1 flex-col text-left">
        <span className="text-[15px]">
          <span className="mr-2 text-sm font-semibold text-ink-2">{code}</span>
          {program.name(code)}
        </span>
        <span className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
          {state.entry.workloadHours ? formatHours(state.entry.workloadHours) : null}
          {state.entry.track && <span>· {state.entry.track}</span>}
          {done ? (
            <span className="inline-flex items-center gap-1 text-done">
              <CheckIcon size={12} strokeWidth={3} /> aprovada
            </span>
          ) : state.status === "locked" ? (
            <span className="inline-flex items-center gap-1">
              <LockIcon size={12} strokeWidth={3} /> {missingLabel(state)}
            </span>
          ) : !state.offered ? (
            <span>não ofertada em {term}</span>
          ) : state.openSections === 0 ? (
            <WarnBadge className="!text-xs">sem vagas</WarnBadge>
          ) : (
            <span className="font-semibold text-ink-2">pode cursar · ofertada</span>
          )}
        </span>
      </button>
    </li>
  );
}
