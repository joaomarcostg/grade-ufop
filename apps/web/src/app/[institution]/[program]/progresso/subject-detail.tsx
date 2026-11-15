"use client";

import { Check, Lock } from "lucide-react";

import { Code, WarnBadge } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ProgramBundle } from "@/lib/catalog-types";
import { seatsLabel, sectionTimes } from "@/lib/format";
import { formatHours, type Program } from "@/lib/use-program";

const CATEGORY_LABEL = {
  mandatory: "Obrigatória",
  elective: "Eletiva",
  optional: "Optativa",
  activity: "Atividade",
} as const;

export function SubjectSheet({
  bundle,
  program,
  code,
  onOpen,
  onClose,
}: {
  bundle: ProgramBundle;
  program: Program;
  code: string | null;
  onOpen: (code: string) => void;
  onClose: () => void;
}) {
  const state = code ? program.eligibility.states.get(code) : undefined;
  return (
    <Sheet open={state !== undefined} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {state && <SubjectDetail bundle={bundle} program={program} code={state.entry.subjectCode} onOpen={onOpen} />}
      </SheetContent>
    </Sheet>
  );
}

function SubjectDetail({
  bundle,
  program,
  code,
  onOpen,
}: {
  bundle: ProgramBundle;
  program: Program;
  code: string;
  onOpen: (code: string) => void;
}) {
  const state = program.eligibility.states.get(code)!;
  const { entry } = state;
  const done = state.status === "done";
  const planned = program.state.planned.includes(code);
  const sections = bundle.sections.filter((s) => s.subjectCode === code && !s.withdrawn);
  const syllabus = bundle.subjects[code]?.syllabus;
  const meta = [
    CATEGORY_LABEL[entry.category],
    entry.period ? `${entry.period}º período` : null,
    entry.workloadHours ? formatHours(entry.workloadHours) : null,
    entry.track,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <SheetHeader className="gap-1 p-6 pb-4">
        <Code>{code}</Code>
        <SheetTitle className="text-xl font-medium leading-snug">{program.name(code)}</SheetTitle>
        <SheetDescription>{meta}</SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-6 px-6 pb-8">
        <div className="flex items-center gap-3 rounded-lg border px-3 py-3">
          <Checkbox
            id="passed"
            checked={done}
            disabled={program.simulating}
            onCheckedChange={(checked) => program.setCompleted([code], checked === true)}
            className="data-checked:border-done data-checked:bg-done"
          />
          <Label htmlFor="passed" className="text-sm font-normal">
            Já fui aprovado nesta disciplina
          </Label>
        </div>

        {entry.requirements.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Pré-requisitos</h3>
            <ul className="flex flex-col gap-1.5">
              {entry.requirements.map((r) => {
                const met = done || !state.missing.includes(r);
                const Icon = met ? Check : Lock;
                return (
                  <li key={r.type === "subject" ? r.code : `h${r.hours}`} className="flex items-start gap-2 text-sm">
                    <Icon
                      className={met ? "mt-0.5 size-4 text-done" : "mt-0.5 size-4 text-muted-foreground"}
                      strokeWidth={2}
                      aria-label={met ? "cumprido" : "pendente"}
                    />
                    {r.type === "subject" ? (
                      <button type="button" onClick={() => onOpen(r.code)} className="text-left hover:underline">
                        <Code className="mr-1.5">{r.code}</Code>
                        {program.name(r.code)}
                      </button>
                    ) : (
                      <span>
                        {formatHours(r.hours)} cursadas
                        <span className="text-muted-foreground">
                          {" "}
                          · você tem {formatHours(program.eligibility.progress.completedHours)}
                        </span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {state.unlocks.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">É pré-requisito de</h3>
            <ul className="flex flex-col gap-1">
              {state.unlocks.map((u) => (
                <li key={u}>
                  <button type="button" onClick={() => onOpen(u)} className="text-left text-sm hover:underline">
                    <Code className="mr-1.5">{u}</Code>
                    {program.name(u)}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Turmas em {bundle.term.code}</h3>
          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">Não ofertada neste semestre.</p>
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border">
              {sections.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                  <span className="flex flex-col">
                    <span>Turma {s.code}</span>
                    <span className="font-mono text-xs text-muted-foreground">{sectionTimes(s)}</span>
                  </span>
                  {s.seats === 0 ? (
                    <WarnBadge>sem vagas</WarnBadge>
                  ) : (
                    <span className="text-xs text-muted-foreground">{seatsLabel(s)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!done && state.status === "available" && sections.length > 0 && (
            <Button
              variant={planned ? "outline" : "default"}
              onClick={() => program.setPlanned(code, !planned)}
              className="self-start"
            >
              {planned ? "Tirar da grade" : "Adicionar à grade"}
            </Button>
          )}
        </section>

        {syllabus && (
          <>
            <Separator />
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Ementa</h3>
              <p className="text-sm leading-relaxed text-ink-2">{syllabus}</p>
            </section>
          </>
        )}
      </div>
    </>
  );
}
