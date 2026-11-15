"use client";

import { Plus, X } from "lucide-react";
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
import { type PlanOption, type PlanResult, sectionsConflict } from "@/lib/scheduler";
import type { Program } from "@/lib/use-program";

const AUTO = "auto";

export function SubjectPanel({
  bundle,
  program,
  result,
  option,
}: {
  bundle: ProgramBundle;
  program: Program;
  result: PlanResult;
  option: PlanOption | undefined;
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

  const suggest = () => {
    const first = offeredMandatory[0]?.entry.period ?? 0;
    offeredMandatory
      .filter((s) => (s.entry.period ?? 0) <= first + 1)
      .slice(0, 5)
      .forEach((s) => program.setPlanned(s.entry.subjectCode, true));
  };

  const plannedHours = Object.keys(option?.sections ?? {}).reduce(
    (sum, code) => sum + (eligibility.states.get(code)?.entry.workloadHours ?? 0),
    0,
  );

  return (
    <aside aria-label="Disciplinas" className="order-2 flex min-w-0 flex-[1_1_320px] flex-col gap-6 md:order-none md:max-w-[380px]">
      <SubjectCombobox
        options={searchable}
        value={null}
        onChange={(code) => code && program.setPlanned(code, true)}
        placeholder="Adicionar disciplina"
        emptyLabel="Nenhuma disciplina liberada e ofertada com esse nome"
        className="h-10 w-full"
      />

      <section aria-labelledby="in-plan" className="flex flex-col gap-2">
        <h2 id="in-plan" className="flex items-baseline justify-between text-sm font-medium">
          Na grade
          <span className="font-normal text-muted-foreground">
            {state.planned.length} {state.planned.length === 1 ? "disciplina" : "disciplinas"}
            {plannedHours ? ` · ${plannedHours} h` : ""}
          </span>
        </h2>
        {state.planned.length === 0 && offeredMandatory.length > 0 && (
          <Button variant="outline" onClick={suggest} className="justify-start">
            <Plus strokeWidth={1.5} />
            Sugerir as do próximo período
          </Button>
        )}
        <ul className="flex flex-col gap-2">
          {state.planned.map((code) => (
            <PlannedRow
              key={code}
              code={code}
              name={name(code)}
              color={colorFor(code, state.planned)}
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
        </ul>
      </section>

      <section aria-labelledby="can-take" className="flex flex-col gap-2">
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
  color: { bg: string; border: string };
  sections: Section[];
  chosen: Section | undefined;
  unavailable: keyof typeof UNAVAILABLE_TEXT | undefined;
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
        ) : left ? (
          <WarnBadge>não coube nesta opção</WarnBadge>
        ) : chosen ? (
          <span className="text-xs text-muted-foreground">
            Turma {chosen.code} · {sectionSummary(chosen)}
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onRemove} aria-label={`Tirar ${code} da grade`} className="-mt-1 -mr-1">
            <X className="text-muted-foreground" strokeWidth={1.5} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Tirar da grade</TooltipContent>
      </Tooltip>
    </li>
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
    <li className="flex items-center gap-2 px-3 py-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm">
          <Code className="mr-1.5">{state.entry.subjectCode}</Code>
          {name}
        </span>
        <span className="text-xs text-muted-foreground">
          {state.entry.period}º per. · {sections.length === 1 ? sectionSummary(sections[0]) : `${sections.length} turmas`}
          {state.unlocks.length ? ` · libera ${state.unlocks.length}` : ""}
        </span>
        {open === 0 ? (
          <WarnBadge className="mt-0.5">sem vagas</WarnBadge>
        ) : clash ? (
          <WarnBadge className="mt-0.5">choca com {clash} nesta opção</WarnBadge>
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
