"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HOURS_PER_WEEKLY_CLASS, MIN_SEMESTER_HOURS } from "@/lib/limits";
import type { PlanOption } from "@/lib/scheduler";
import type { Program } from "@/lib/use-program";
import { cn } from "@/lib/utils";

const MIN_WEEKLY = MIN_SEMESTER_HOURS / HOURS_PER_WEEKLY_CLASS;

/**
 * The current option's weekly class hours against the program's limit, plus
 * UFOP's 150 h minimum for the semester.
 */
export function LoadCard({
  program,
  option,
  semesterHours,
  requestedLoad,
  weeklyLimit,
  defaultLimit,
}: {
  program: Program;
  option: PlanOption | undefined;
  /** Semester hours of the subjects in the option. */
  semesterHours: number;
  requestedLoad: number;
  weeklyLimit: number;
  defaultLimit: number;
}) {
  const load = option?.load ?? 0;
  const scale = Math.max(weeklyLimit, load, 1);
  const below = semesterHours > 0 && semesterHours < MIN_SEMESTER_HOURS;
  const overLimit = option?.overLimit ?? [];

  return (
    <section aria-labelledby="load" data-tour="load" className="flex flex-col gap-2 rounded-xl border bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="load" className="text-sm font-medium">
          Carga semanal
        </h2>
        <span className="text-sm">
          <span className="font-medium">{load} h</span>
          <span className="text-muted-foreground"> de até {weeklyLimit} h</span>
        </span>
      </div>

      <div
        role="meter"
        aria-label="Carga semanal"
        aria-valuemin={0}
        aria-valuemax={weeklyLimit}
        aria-valuenow={load}
        aria-valuetext={`${load} horas-aula por semana de até ${weeklyLimit}`}
        className="relative h-2 rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width]", below ? "bg-warn" : "bg-primary")}
          style={{ width: `${(load / scale) * 100}%` }}
        />
        <span
          aria-hidden="true"
          className="absolute -top-1 h-4 w-px bg-foreground/40"
          style={{ left: `${(MIN_WEEKLY / scale) * 100}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Máximo de {weeklyLimit} horas-aula por semana. Mínimo de {MIN_SEMESTER_HOURS} h no semestre
        {semesterHours > 0 ? ` (esta opção soma ${semesterHours} h)` : ""}.{" "}
        <LimitEditor program={program} weeklyLimit={weeklyLimit} defaultLimit={defaultLimit} />
      </p>

      {overLimit.length > 0 && (
        <p className="rounded-md bg-warn-bg px-2.5 py-2 text-xs text-warn">
          Suas escolhas somam {requestedLoad} h por semana, mais que o limite. Para caber,{" "}
          {overLimit.length === 1 ? "ficou" : "ficaram"} de fora {overLimit.join(", ")}. Mude a ordem das suas escolhas
          para trocar.
        </p>
      )}
      {below && (
        <p className="rounded-md bg-warn-bg px-2.5 py-2 text-xs text-warn">
          Abaixo do mínimo de {MIN_SEMESTER_HOURS} h no semestre. Só é permitido se você estiver terminando o curso.
        </p>
      )}
    </section>
  );
}

function LimitEditor({
  program,
  weeklyLimit,
  defaultLimit,
}: {
  program: Program;
  weeklyLimit: number;
  defaultLimit: number;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(weeklyLimit));
  const value = Number(draft);
  const valid = Number.isInteger(value) && value >= MIN_WEEKLY && value <= 80;
  const save = (limit: number | null) => {
    program.change(() => ({ weeklyLimit: limit === defaultLimit ? null : limit }));
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(String(weeklyLimit));
        setOpen(next);
      }}
    >
      <PopoverTrigger className="link">Alterar limite</PopoverTrigger>
      <PopoverContent align="start" className="flex w-72 flex-col gap-3">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (valid) save(value);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="weekly-limit">Limite do seu curso, em horas-aula por semana</Label>
            <Input
              id="weekly-limit"
              type="number"
              inputMode="numeric"
              min={MIN_WEEKLY}
              max={80}
              step={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              aria-invalid={!valid}
            />
          </div>
          <p className="text-xs leading-relaxed text-ink-2">
            Pela regra geral da UFOP, o limite deste curso é {defaultLimit} horas-aula por semana. O projeto do seu
            curso pode definir outro. Para passar dele, é preciso pedir “matrícula com excesso de horas” ao colegiado.
          </p>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!valid}>
              Salvar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => save(null)}
              disabled={weeklyLimit === defaultLimit}
            >
              Voltar ao padrão
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
