"use client";

import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Code, WarnBadge } from "@/components/brand";
import { SubjectCombobox } from "@/components/subject-combobox";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ProgramBundle, Section } from "@/lib/catalog-types";
import type { EntryState } from "@/lib/eligibility";
import { colorFor, seatsLabel, sectionSummary, sectionTimes, UNAVAILABLE_TEXT } from "@/lib/format";
import { byPriority, weeklyClassesOf } from "@/lib/limits";
import { type PlanOption, type PlanResult, sectionsConflict } from "@/lib/scheduler";
import type { Program } from "@/lib/use-program";

import { LoadCard } from "./load-card";

const AUTO = "auto";

export function SubjectPanel({
  bundle,
  program,
  result,
  option,
  colorOrder,
  load,
  requestedLoad,
  weeklyLimit,
  defaultLimit,
}: {
  bundle: ProgramBundle;
  program: Program;
  result: PlanResult;
  option: PlanOption | undefined;
  /** Codes in a stable order, for the colours shared with the calendar. */
  colorOrder: string[];
  /** Weekly class hours of each planned subject. */
  load: Record<string, number>;
  requestedLoad: number;
  weeklyLimit: number;
  defaultLimit: number;
}) {
  const { state, eligibility, name } = program;
  const base = `/${bundle.institution.code}/${bundle.program.code.toLowerCase()}`;

  const sectionsBySubject = useMemo(() => {
    const map = new Map<string, Section[]>();
    for (const s of bundle.sections) {
      if (!s.withdrawn) map.set(s.subjectCode, [...(map.get(s.subjectCode) ?? []), s]);
    }
    return map;
  }, [bundle.sections]);

  const available = useMemo(
    () =>
      [...eligibility.states.values()]
        .filter((s) => s.status === "available" && !state.planned.includes(s.entry.subjectCode))
        .sort(
          (a, b) =>
            (a.entry.period ?? 99) - (b.entry.period ?? 99) || a.entry.subjectCode.localeCompare(b.entry.subjectCode),
        ),
    [eligibility, state.planned],
  );
  const mandatory = available.filter((s) => s.entry.category === "mandatory");
  const offeredMandatory = mandatory.filter((s) => s.offered);
  const notOffered = mandatory.filter((s) => !s.offered);
  const searchable = available
    .filter((s) => s.offered && s.entry.category !== "activity")
    .map((s) => ({
      code: s.entry.subjectCode,
      name: name(s.entry.subjectCode),
      hint: s.entry.category === "mandatory" ? `${s.entry.period}º` : "eletiva",
    }));

  // The liberated mandatory subjects of the next few periods, up to the weekly limit.
  const suggest = () => {
    const first = offeredMandatory[0]?.entry.period ?? 0;
    let total = 0;
    for (const s of offeredMandatory.filter((s) => (s.entry.period ?? 0) <= first + 2)) {
      const weekly = weeklyClassesOf(s.entry);
      if (total + weekly > weeklyLimit) continue;
      total += weekly;
      program.setPlanned(s.entry.subjectCode, true);
    }
  };
  const fittedLoad = option?.load ?? 0;
  const semesterHours = Object.keys(option?.sections ?? {}).reduce(
    (sum, code) => sum + (eligibility.states.get(code)?.entry.workloadHours ?? 0),
    0,
  );
  const suggestedOrder = byPriority(state.planned, eligibility.states);
  const inSuggestedOrder = suggestedOrder.every((code, i) => code === state.planned[i]);

  return (
    <aside aria-label="Disciplinas" className="order-2 flex min-w-0 flex-[1_1_320px] flex-col gap-6 md:order-none md:max-w-[380px]">
      <div data-tour="add">
        <SubjectCombobox
          options={searchable}
          value={null}
          onChange={(code) => code && program.setPlanned(code, true)}
          placeholder="Adicionar disciplina"
          emptyLabel="Nenhuma disciplina liberada e ofertada com esse nome"
          className="h-10 w-full"
        />
      </div>

      <LoadCard
        program={program}
        option={option}
        semesterHours={semesterHours}
        requestedLoad={requestedLoad}
        weeklyLimit={weeklyLimit}
        defaultLimit={defaultLimit}
      />

      <section aria-labelledby="in-plan" data-tour="chosen" className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 id="in-plan" className="flex items-baseline justify-between text-sm font-medium">
            Suas escolhas
            <span className="font-normal text-muted-foreground">
              {state.planned.length} {state.planned.length === 1 ? "disciplina" : "disciplinas"} · {requestedLoad} h/semana
            </span>
          </h2>
          {state.planned.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Em ordem de prioridade: se não couber tudo, saem primeiro as de baixo.{" "}
              {!inSuggestedOrder && (
                <button
                  type="button"
                  className="link"
                  onClick={() => program.change(() => ({ planned: suggestedOrder }))}
                >
                  Ordenar como sugerido
                </button>
              )}
            </p>
          )}
        </div>
        {state.planned.length === 0 && offeredMandatory.length > 0 && (
          <Button variant="outline" onClick={suggest} className="justify-start" data-tour="suggest">
            <Plus strokeWidth={1.5} />
            Sugerir obrigatórias até {weeklyLimit} h/semana
          </Button>
        )}
        <ul className="flex flex-col gap-2">
          {state.planned.map((code, index) => (
            <PlannedRow
              key={code}
              code={code}
              name={name(code)}
              weekly={load[code] ?? 0}
              color={colorFor(code, colorOrder)}
              onMove={(delta) => program.movePlanned(code, delta)}
              first={index === 0}
              last={index === state.planned.length - 1}
              sections={sectionsBySubject.get(code) ?? []}
              chosen={option?.sections[code]}
              unavailable={result.unavailable.find((u) => u.code === code)?.reason}
              overLimit={option?.overLimit.includes(code) ?? false}
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
        </ul>
      </section>

      <section aria-labelledby="can-take" data-tour="available" className="flex flex-col gap-2">
        <h2 id="can-take" className="flex items-baseline justify-between text-sm font-medium">
          Obrigatórias liberadas
          <span className="font-normal text-muted-foreground">{offeredMandatory.length}</span>
        </h2>
        {offeredMandatory.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma obrigatória liberada e ofertada agora. Busque eletivas acima ou marque o que já cursou em{" "}
            <Link href={`${base}/progresso`} className="link">
              Progresso
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col divide-y rounded-xl border bg-card">
            {offeredMandatory.map((s) => (
              <AvailableRow
                key={s.entry.subjectCode}
                state={s}
                name={name(s.entry.subjectCode)}
                sections={sectionsBySubject.get(s.entry.subjectCode) ?? []}
                option={option}
                passesLimit={fittedLoad + weeklyClassesOf(s.entry) > weeklyLimit}
                onAdd={() => program.setPlanned(s.entry.subjectCode, true)}
              />
            ))}
          </ul>
        )}
        {notOffered.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="py-1 text-sm text-ink-2 hover:text-foreground">
              {notOffered.length} liberadas mas não ofertadas em {bundle.term.code}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="flex flex-col gap-1 pt-1 text-sm text-ink-2">
                {notOffered.map((s) => (
                  <li key={s.entry.subjectCode}>
                    <Code className="mr-2">{s.entry.subjectCode}</Code>
                    {name(s.entry.subjectCode)}
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}
        <Link href={`${base}/progresso`} className="link self-start text-sm">
          Por que outras disciplinas não aparecem?
        </Link>
      </section>
    </aside>
  );
}

function PlannedRow({
  code,
  name,
  weekly,
  color,
  sections,
  chosen,
  unavailable,
  overLimit,
  left,
  locked,
  onLock,
  onRemove,
  onMove,
  first,
  last,
}: {
  code: string;
  name: string;
  weekly: number;
  onMove: (delta: -1 | 1) => void;
  first: boolean;
  last: boolean;
  color: { bg: string; border: string };
  sections: Section[];
  chosen: Section | undefined;
  unavailable: keyof typeof UNAVAILABLE_TEXT | undefined;
  overLimit: boolean;
  left: boolean;
  locked: string | undefined;
  onLock: (section: string | null) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex gap-3 rounded-xl border bg-card p-3">
      <span
        aria-hidden="true"
        className="mt-1 size-3 flex-none rounded-[3px] border"
        style={{ background: color.bg, borderColor: color.border }}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm">
          <Code className="mr-1.5">{code}</Code>
          {name}
        </span>
        {unavailable ? (
          <WarnBadge>{UNAVAILABLE_TEXT[unavailable]}</WarnBadge>
        ) : overLimit ? (
          <WarnBadge>fora: passaria do limite semanal</WarnBadge>
        ) : left ? (
          <WarnBadge>fora: choca com outra escolhida</WarnBadge>
        ) : chosen ? (
          <span className="text-xs text-muted-foreground">
            {weekly ? `${weekly} h/semana · ` : ""}Turma {chosen.code} · {sectionSummary(chosen)}
            {seatsLabel(chosen) ? ` · ${seatsLabel(chosen)}` : ""}
          </span>
        ) : null}
        {sections.length > 1 && (
          <Select value={locked ?? AUTO} onValueChange={(v) => onLock(v === AUTO ? null : v)}>
            <SelectTrigger size="sm" className="mt-1 h-8 w-full text-xs" aria-label={`Turma de ${code}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AUTO}>Melhor turma (automático)</SelectItem>
              {sections.map((s) => (
                <SelectItem key={s.id} value={s.code}>
                  Turma {s.code} · <span className="font-mono">{sectionTimes(s)}</span>
                  {seatsLabel(s) ? ` · ${seatsLabel(s)}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="-mt-1 -mr-1 flex flex-col items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onRemove} aria-label={`Tirar ${code} da grade`}>
              <X className="text-muted-foreground" strokeWidth={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Tirar da grade</TooltipContent>
        </Tooltip>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onMove(-1)}
          disabled={first}
          aria-label={`Subir ${code} na prioridade`}
          title="Mais prioridade"
        >
          <ChevronUp className="text-muted-foreground" strokeWidth={1.5} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onMove(1)}
          disabled={last}
          aria-label={`Descer ${code} na prioridade`}
          title="Menos prioridade"
        >
          <ChevronDown className="text-muted-foreground" strokeWidth={1.5} />
        </Button>
      </div>
    </li>
  );
}

function AvailableRow({
  state,
  name,
  sections,
  option,
  passesLimit,
  onAdd,
}: {
  state: EntryState;
  name: string;
  sections: Section[];
  option: PlanOption | undefined;
  passesLimit: boolean;
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
    <li className="flex items-center gap-2 px-3 py-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm">
          <Code className="mr-1.5">{state.entry.subjectCode}</Code>
          {name}
        </span>
        <span className="text-xs text-muted-foreground">
          {state.entry.period}º per. · {weeklyClassesOf(state.entry) ? `${weeklyClassesOf(state.entry)} h/semana · ` : ""}
          {sections.length === 1 ? sectionSummary(sections[0]) : `${sections.length} turmas`}
          {state.unlocks.length ? ` · libera ${state.unlocks.length}` : ""}
        </span>
        {open === 0 ? (
          <WarnBadge className="mt-0.5">sem vagas</WarnBadge>
        ) : clash ? (
          <WarnBadge className="mt-0.5">choca com {clash} nesta opção</WarnBadge>
        ) : passesLimit ? (
          <span className="text-xs text-muted-foreground">passaria do limite semanal</span>
        ) : null}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={onAdd} aria-label={`Adicionar ${state.entry.subjectCode} à grade`}>
            <Plus strokeWidth={1.5} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Adicionar à grade</TooltipContent>
      </Tooltip>
    </li>
  );
}
