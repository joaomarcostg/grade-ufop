"use client";

import { FileUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CheckGlyph, Code } from "@/components/brand";
import { SimulationBanner, SimulationSelect } from "@/components/simulation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProgramBundle } from "@/lib/catalog-types";
import { useFirstVisitTour } from "@/lib/tour";
import { formatHours, type Program, useProgram } from "@/lib/use-program";

import { CurriculumMap, MarkUntil, usePeriods } from "./curriculum-map";
import { OtherEntries } from "./other-entries";
import { SubjectSheet } from "./subject-detail";

export function ProgressView({ bundle }: { bundle: ProgramBundle }) {
  const program = useProgram(bundle);
  const periods = usePeriods(program);
  const [open, setOpen] = useState<string | null>(null);
  useFirstVisitTour("progress", program.hydrated);
  const base = `/${bundle.institution.code}/${bundle.program.code.toLowerCase()}`;
  const p = bundle.program;
  const meta = [p.degree, p.campus ? `Campus ${p.campus}` : null, p.curriculumVersion ? `currículo ${p.curriculumVersion}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 pt-8 pb-12 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-medium tracking-tight">{p.name}</h1>
          <p className="text-sm text-muted-foreground">{meta}</p>
        </div>
        {program.hydrated && (
          <div className="flex flex-wrap items-center gap-2">
            {p.tracks.length > 0 && <TrackSelect bundle={bundle} program={program} />}
            <SimulationSelect program={program} />
            <MarkUntil program={program} periods={periods} />
            <Button variant="outline" asChild data-tour="import">
              <Link href={`${base}/importar`}>
                <FileUp strokeWidth={1.5} />
                Importar histórico
              </Link>
            </Button>
          </div>
        )}
      </div>

      {!program.hydrated ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          <SimulationBanner program={program} term={bundle.term.code} />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <HoursSummary program={program} />
            <NextSteps program={program} base={base} onOpen={setOpen} />
          </div>

          <section aria-labelledby="map" data-tour="map" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <div className="flex flex-col gap-1">
                <h2 id="map" className="text-xl font-medium">
                  Obrigatórias por período
                </h2>
                <p className="max-w-2xl text-sm text-ink-2">
                  {program.simulating ? (
                    "Na simulação as marcações vêm do seu histórico. Saia da simulação para editar."
                  ) : (
                    <>
                      Marque <CheckGlyph /> as disciplinas que você já cursou e foi aprovado. O quadrado ao lado do
                      período marca todas dele; clicar no nome mostra ementa e pré-requisitos.
                    </>
                  )}
                </p>
              </div>
              <Legend term={bundle.term.code} />
            </div>
            <CurriculumMap program={program} periods={periods} term={bundle.term.code} onOpen={setOpen} openCode={open} />
          </section>

          <OtherEntries program={program} term={bundle.term.code} onOpen={setOpen} />
          <SubjectSheet bundle={bundle} program={program} code={open} onOpen={setOpen} onClose={() => setOpen(null)} />
        </>
      )}
    </main>
  );
}

function TrackSelect({ bundle, program }: { bundle: ProgramBundle; program: Program }) {
  const names = [...new Set(bundle.program.tracks.map((t) => t.name))];
  return (
    <Select
      value={program.state.track ?? "all"}
      onValueChange={(value) => program.change(() => ({ track: value === "all" ? null : value }))}
    >
      <SelectTrigger className="h-9 min-w-48" aria-label="Ênfase">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas as ênfases</SelectItem>
        {names.map((name) => (
          <SelectItem key={name} value={name}>
            Ênfase em {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function HoursSummary({ program }: { program: Program }) {
  const { progress } = program.eligibility;
  const required = progress.required;
  const total = required.total ?? 0;
  const done = progress.completedHours;
  const percent = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const rows = [
    { label: "Obrigatórias", done: progress.byCategory.mandatory, required: required.mandatory },
    { label: "Eletivas", done: progress.byCategory.elective, required: required.elective },
    { label: "Atividades", done: progress.byCategory.activity, required: required.activities },
  ].filter((r) => r.required);

  return (
    <section aria-labelledby="hours" data-tour="hours" className="flex flex-wrap gap-x-10 gap-y-6 rounded-xl border bg-card p-6">
      <div className="flex min-w-56 flex-1 flex-col gap-3">
        <h2 id="hours" className="text-sm text-muted-foreground">
          Carga horária para se formar
        </h2>
        <p className="flex items-baseline gap-2">
          <span className="text-4xl font-medium tracking-tight">{formatHours(done)}</span>
          {total > 0 && (
            <span className="text-sm text-muted-foreground">
              de {formatHours(total)} · {percent}%
            </span>
          )}
        </p>
        <Bar value={percent} className="bg-primary" />
      </div>
      <dl className="grid min-w-64 flex-[2] content-start gap-4 sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-2">
            <dt className="text-sm text-ink-2">{r.label}</dt>
            <dd className="text-sm">
              {formatHours(r.done)} <span className="text-muted-foreground">de {formatHours(r.required ?? 0)}</span>
            </dd>
            <Bar value={r.required ? (r.done / r.required) * 100 : 0} className="bg-foreground/70" />
          </div>
        ))}
        {required.extension ? (
          <p className="text-xs text-muted-foreground sm:col-span-3">
            Inclui {formatHours(required.extension)} de extensão, contadas dentro das disciplinas e atividades
          </p>
        ) : null}
      </dl>
    </section>
  );
}

function Bar({ value, className }: { value: number; className: string }) {
  return (
    <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function NextSteps({ program, base, onOpen }: { program: Program; base: string; onOpen: (code: string) => void }) {
  const ranked = [...program.eligibility.states.values()]
    .filter((s) => s.status === "available" && s.offered && s.entry.category === "mandatory")
    .sort(
      (a, b) =>
        b.unlocks.length - a.unlocks.length ||
        (a.entry.period ?? 99) - (b.entry.period ?? 99) ||
        a.entry.subjectCode.localeCompare(b.entry.subjectCode),
    )
    .slice(0, 4);

  return (
    <section aria-labelledby="next" data-tour="next" className="flex flex-col gap-3 rounded-xl border bg-card p-6">
      <h2 id="next" className="text-sm text-muted-foreground">
        O que destrava mais
      </h2>
      {ranked.length === 0 ? (
        <p className="text-sm text-ink-2">Nenhuma obrigatória liberada e ofertada neste semestre.</p>
      ) : (
        <>
          <ol className="flex flex-col">
            {ranked.map((s) => (
              <li key={s.entry.subjectCode}>
                <button
                  type="button"
                  onClick={() => onOpen(s.entry.subjectCode)}
                  className="flex w-full items-baseline gap-2 rounded-md py-1.5 text-left text-sm hover:bg-muted/60"
                >
                  <Code className="w-14 shrink-0">{s.entry.subjectCode}</Code>
                  <span className="min-w-0 flex-1 truncate">{program.name(s.entry.subjectCode)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {s.unlocks.length ? `libera ${s.unlocks.length}` : `${s.entry.period}º per.`}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <Button asChild className="mt-auto self-start">
            <Link
              href={`${base}/grade`}
              onClick={() => ranked.forEach((s) => program.setPlanned(s.entry.subjectCode, true))}
            >
              Montar grade com estas
            </Link>
          </Button>
        </>
      )}
    </section>
  );
}

function Legend({ term }: { term: string }) {
  const items = [
    { label: "Aprovada", swatch: "border-done-line bg-done-bg" },
    { label: "Pode cursar", swatch: "border-foreground/25 bg-card" },
    { label: "Falta pré-requisito", swatch: "border-dashed border-foreground/20 bg-muted" },
    { label: `Não ofertada em ${term}`, swatch: "border-dashed border-foreground/25 bg-card" },
  ];
  return (
    <ul aria-label="Legenda" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className={`h-3 w-5 rounded-[4px] border ${i.swatch}`} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
