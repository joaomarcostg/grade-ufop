"use client";

import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";

import { CheckIcon, LockIcon, PlusIcon } from "@/components/icons";
import { buttonClass, Card, Skeleton, WarnBadge } from "@/components/ui";
import type { ProgramBundle } from "@/lib/catalog-types";
import { type EntryState, missingLabel } from "@/lib/eligibility";
import { formatHours, useProgram } from "@/lib/use-program";

import { OtherEntries } from "./other-entries";
import { SubjectDetail } from "./subject-detail";

export function ProgressView({ bundle }: { bundle: ProgramBundle }) {
  const program = useProgram(bundle);
  const { eligibility, state, hydrated } = program;
  const [selected, setSelected] = useState<string | null>(null);

  const periods = useMemo(() => {
    const byPeriod = new Map<number, EntryState[]>();
    for (const s of eligibility.states.values()) {
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
  }, [eligibility]);

  const selectedState = selected ? eligibility.states.get(selected) : undefined;
  const p = bundle.program;
  const meta = [p.degree, p.campus ? `Campus ${p.campus}` : null, p.curriculumVersion ? `currículo ${p.curriculumVersion}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="mx-auto flex w-full max-w-[1360px] flex-col gap-7 px-4 pb-12 pt-9 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{p.name}</h1>
          <span className="text-[15px] text-muted">{meta}</span>
        </div>
        {p.tracks.length > 0 && <TrackPicker bundle={bundle} program={program} />}
      </div>

      {!hydrated ? (
        <Skeleton className="h-40" />
      ) : (
        <>
          <HoursCard program={program} />
          {state.completed.length === 0 && (
            <p className="rounded-xl bg-brand-tint px-4 py-3 text-[15px] text-ink">
              Clique numa disciplina para marcar se já foi aprovado, ou use “Marcar período” para marcar um período
              inteiro de uma vez.
            </p>
          )}
          <Legend term={bundle.term.code} />
          <section aria-label="Disciplinas obrigatórias por período" className="overflow-x-auto pb-1">
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${periods.length}, minmax(150px, 1fr))`, minWidth: periods.length * 162 }}
            >
              {periods.map(({ period, states }) => (
                <PeriodColumn
                  key={period}
                  period={period}
                  states={states}
                  selected={selected}
                  onSelect={setSelected}
                  program={program}
                  term={bundle.term.code}
                />
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-start gap-5">
            <div className="flex min-w-0 flex-[1_1_420px]">
              {selectedState ? (
                <SubjectDetail bundle={bundle} program={program} state={selectedState} onSelect={setSelected} />
              ) : (
                <Card className="flex w-full flex-col gap-2 p-6">
                  <h2 className="font-display text-xl font-semibold">Detalhes da disciplina</h2>
                  <p className="text-[15px] text-muted">
                    Selecione uma disciplina no mapa para ver pré-requisitos, o que ela libera e as turmas deste
                    semestre.
                  </p>
                </Card>
              )}
            </div>
            <UnlockCard bundle={bundle} program={program} onSelect={setSelected} />
          </div>

          <OtherEntries bundle={bundle} program={program} onSelect={setSelected} selected={selected} />
        </>
      )}
    </main>
  );
}

type Program = ReturnType<typeof useProgram>;

function TrackPicker({ bundle, program }: { bundle: ProgramBundle; program: Program }) {
  const names = [...new Set(bundle.program.tracks.map((t) => t.name))];
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      Ênfase
      <select
        value={program.state.track ?? ""}
        onChange={(e) => program.change(() => ({ track: e.target.value || null }))}
        className="min-h-11 rounded-xl border border-line-strong bg-surface px-3 text-[15px] font-normal"
      >
        <option value="">Ainda não escolhi (mostrar todas)</option>
        {names.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

function HoursCard({ program }: { program: Program }) {
  const { progress } = program.eligibility;
  const required = progress.required;
  const total = required.total ?? 0;
  const done = progress.completedHours;
  const percent = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const rows = [
    { label: "Obrigatórias", done: progress.byCategory.mandatory, required: required.mandatory },
    { label: "Eletivas", done: progress.byCategory.elective, required: required.elective },
    { label: "Atividades complementares", done: progress.byCategory.activity, required: required.activities },
  ].filter((r) => r.required);

  return (
    <Card className="flex flex-wrap gap-8 p-6">
      <div className="flex flex-[1_1_260px] flex-col gap-2.5">
        <h2 className="text-[15px] font-semibold text-muted">Carga horária para se formar</h2>
        <div className="flex items-baseline gap-2.5">
          <span className="font-display text-[44px] font-bold tracking-tight">{formatHours(done)}</span>
          {total > 0 && (
            <span className="text-base text-muted">
              de {formatHours(total)} · {percent}%
            </span>
          )}
        </div>
        <Bar value={percent} className="h-2.5 bg-brand" />
      </div>
      <div className="grid flex-[999_1_560px] grid-cols-1 gap-5 sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-2">
            <span className="text-sm font-semibold">{r.label}</span>
            <span className="text-sm text-ink-2">
              {formatHours(r.done)} de {formatHours(r.required ?? 0)}
            </span>
            <Bar value={r.required ? (r.done / r.required) * 100 : 0} className="h-1.5 bg-ink" />
          </div>
        ))}
        {required.extension ? (
          <p className="text-[13px] leading-normal text-muted sm:col-span-3">
            Extensão: {formatHours(required.extension)} exigidas, contadas dentro das disciplinas e atividades acima.
          </p>
        ) : null}
      </div>
    </Card>
  );
}

function Bar({ value, className }: { value: number; className: string }) {
  return (
    <div aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-soft">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function Legend({ term }: { term: string }) {
  const items = [
    { label: "Aprovada", swatch: "border border-done-line bg-done-bg" },
    { label: "Pode cursar agora", swatch: "border-2 border-ink-2 bg-surface" },
    { label: "Falta pré-requisito", swatch: "border border-dashed border-[#a9a59a] bg-soft" },
    { label: `Não ofertada em ${term}`, swatch: "border border-dashed border-[#a9a59a] bg-surface" },
  ];
  return (
    <div aria-label="Legenda" className="flex flex-wrap gap-5 text-sm text-ink-2">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-2">
          <span aria-hidden="true" className={`size-4 rounded-[5px] ${i.swatch}`} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function PeriodColumn({
  period,
  states,
  selected,
  onSelect,
  program,
  term,
}: {
  period: number;
  states: EntryState[];
  selected: string | null;
  onSelect: (code: string) => void;
  program: Program;
  term: string;
}) {
  const allDone = states.every((s) => s.status === "done");
  return (
    <div className="flex flex-col gap-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-muted">{period ? `${period}º período` : "Sem período"}</h3>
        <button
          type="button"
          onClick={() => program.setCompleted(states.map((s) => s.entry.subjectCode), !allDone)}
          className="rounded-md px-1.5 py-1 text-xs font-semibold text-brand hover:bg-brand-tint"
        >
          {allDone ? "Desmarcar" : "Marcar período"}
        </button>
      </div>
      {states.map((s) => (
        <SubjectChip
          key={s.entry.subjectCode}
          state={s}
          name={program.name(s.entry.subjectCode)}
          selected={selected === s.entry.subjectCode}
          onSelect={onSelect}
          term={term}
          planned={program.state.planned.includes(s.entry.subjectCode)}
        />
      ))}
    </div>
  );
}

export function SubjectChip({
  state,
  name,
  selected,
  onSelect,
  term,
  planned,
}: {
  state: EntryState;
  name: string;
  selected: boolean;
  onSelect: (code: string) => void;
  term: string;
  planned: boolean;
}) {
  const code = state.entry.subjectCode;
  const ring = selected ? "outline-3 outline-offset-2 outline-brand" : "";
  let style = "border-2 border-ink-2 bg-surface text-ink";
  let label: ReactNode = (
    <>
      <PlusIcon size={11} strokeWidth={3.5} />
      {code}
    </>
  );
  let note: ReactNode = null;

  if (state.status === "done") {
    style = "border border-done-line bg-done-bg text-done";
    label = (
      <>
        <CheckIcon size={12} strokeWidth={3} />
        {code}
      </>
    );
  } else if (state.status === "locked") {
    style = "border-2 border-dashed border-[#a9a59a] bg-soft text-ink-2";
    label = (
      <>
        <LockIcon size={11} strokeWidth={3} />
        {code} · {missingLabel(state)}
      </>
    );
  } else if (!state.offered) {
    style = "border border-dashed border-[#a9a59a] bg-surface text-ink-2";
    note = <span className="text-xs text-muted">não ofertada em {term}</span>;
  } else if (state.openSections === 0) {
    note = <WarnBadge className="mt-1 !text-xs">sem vagas</WarnBadge>;
  }
  if (planned && state.status !== "done") {
    note = (
      <>
        {note}
        <span className="text-xs font-semibold text-brand">na sua grade</span>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(code)}
      aria-pressed={selected}
      className={`flex flex-col gap-0.5 rounded-[10px] p-2.5 text-left ${style} ${ring}`}
    >
      <span className="inline-flex items-center gap-1 text-xs font-semibold">{label}</span>
      <span className="text-[13px] leading-snug">{name}</span>
      {note}
    </button>
  );
}

function UnlockCard({
  bundle,
  program,
  onSelect,
}: {
  bundle: ProgramBundle;
  program: Program;
  onSelect: (code: string) => void;
}) {
  const ranked = [...program.eligibility.states.values()]
    .filter((s) => s.status === "available" && s.offered && s.entry.category === "mandatory")
    .sort(
      (a, b) =>
        b.unlocks.length - a.unlocks.length ||
        (a.entry.period ?? 99) - (b.entry.period ?? 99) ||
        a.entry.subjectCode.localeCompare(b.entry.subjectCode),
    )
    .slice(0, 5);
  if (ranked.length === 0) return null;
  const base = `/${bundle.institution.code}/${bundle.program.code.toLowerCase()}`;

  return (
    <Card className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-[22px] font-semibold">O que destrava mais</h2>
        <span className="text-sm text-muted">Obrigatórias que você pode cursar agora e são ofertadas em {bundle.term.code}</span>
      </div>
      <ol className="flex flex-col">
        {ranked.map((s) => (
          <li key={s.entry.subjectCode} className="border-b border-soft last:border-0">
            <button
              type="button"
              onClick={() => onSelect(s.entry.subjectCode)}
              className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
            >
              <span className="text-[15px]">
                <strong>{s.entry.subjectCode}</strong> {program.name(s.entry.subjectCode)}
              </span>
              <span className="flex-none text-sm text-ink-2">
                {s.unlocks.length ? `pré-requisito de ${s.unlocks.length}` : `${s.entry.period}º período`}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <Link
        href={`${base}/grade`}
        onClick={() => ranked.forEach((s) => program.setPlanned(s.entry.subjectCode, true))}
        className={`${buttonClass.primary} self-start no-underline hover:text-white`}
      >
        Montar grade com estas
      </Link>
    </Card>
  );
}
