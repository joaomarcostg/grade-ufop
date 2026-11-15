"use client";

import { ArrowRight, FileUp, LockKeyhole, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Code } from "@/components/brand";
import { SubjectCombobox } from "@/components/subject-combobox";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProgramBundle } from "@/lib/catalog-types";
import { programKey, useHydrated, useStudentStore } from "@/lib/store";
import { readTranscriptFile } from "@/lib/transcript/read";
import { matchTranscript, nameKey, type RowMatch } from "@/lib/transcript/match";
import { PASSED, type Transcript } from "@/lib/transcript/parse";
import { formatHours } from "@/lib/use-program";

const NOT_COUNTED = "__none__";

export function ImportView({ bundle }: { bundle: ProgramBundle }) {
  const hydrated = useHydrated();
  const pending = useStudentStore((s) => s.pendingImport);
  const setPending = useStudentStore((s) => s.setPendingImport);
  const pendingHere =
    pending?.institution === bundle.institution.code && pending.program.toUpperCase() === bundle.program.code
      ? pending
      : null;

  if (!hydrated) return <Skeleton className="mx-auto mt-12 h-96 w-full max-w-3xl" />;
  return pendingHere ? (
    <Review
      key={pendingHere.fileName}
      bundle={bundle}
      transcript={pendingHere.transcript}
      fileName={pendingHere.fileName}
      onCancel={() => setPending(null)}
    />
  ) : (
    <Pick
      bundle={bundle}
      onRead={(transcript, fileName) =>
        setPending({ institution: bundle.institution.code, program: bundle.program.code, transcript, fileName })
      }
    />
  );
}

function Pick({
  bundle,
  onRead,
}: {
  bundle: ProgramBundle;
  onRead: (transcript: Transcript, fileName: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const read = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onRead(await readTranscriptFile(file), file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível ler o arquivo");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-12 pb-16 sm:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Importar histórico escolar</h1>
        <p className="text-ink-2">
          Use o PDF do histórico que você baixa no sistema acadêmico da UFOP. Marcamos as disciplinas em que você foi
          aprovado em {bundle.program.name}, e você confere tudo antes de salvar.
        </p>
      </div>
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void read(e.dataTransfer.files[0]);
        }}
        className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-foreground/20 bg-card px-6 py-12 text-center hover:border-foreground/35"
      >
        <FileUp className="size-6 text-ink-2" strokeWidth={1.5} aria-hidden="true" />
        <span className="text-sm text-ink-2">{busy ? "Lendo o arquivo…" : "Arraste o PDF do histórico para cá"}</span>
        <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
          Escolher arquivo
        </Button>
        <input
          ref={input}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => void read(e.target.files?.[0])}
        />
      </label>
      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-[#fef3f2] px-4 py-3 text-sm text-destructive">
          <TriangleAlert className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          {error}
        </p>
      )}
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <LockKeyhole className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />O arquivo é lido aqui no seu
        navegador e não é enviado para nenhum servidor.
      </p>
    </main>
  );
}

function Review({
  bundle,
  transcript,
  fileName,
  onCancel,
}: {
  bundle: ProgramBundle;
  transcript: Transcript;
  fileName: string;
  onCancel: () => void;
}) {
  const router = useRouter();
  const update = useStudentStore((s) => s.update);
  const setPending = useStudentStore((s) => s.setPendingImport);
  const base = `/${bundle.institution.code}/${bundle.program.code.toLowerCase()}`;

  const match = useMemo(() => matchTranscript(transcript, bundle), [transcript, bundle]);
  const byCode = match.passed.filter((m) => m.how === "code");
  const byName = match.passed.filter((m) => m.how === "name");
  const unresolved = match.passed.filter((m) => !m.how);

  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [chosen, setChosen] = useState<Record<string, string>>({});

  const nameOf = (code: string) => bundle.subjects[code]?.name ?? code;
  const otherProgram =
    transcript.programName && nameKey(transcript.programName) !== nameKey(bundle.program.name)
      ? transcript.programName
      : null;

  const mapping = useMemo(() => {
    const result: Record<string, string> = {};
    for (const m of [...match.passed, ...match.notPassed]) {
      if (m.subjectCode && !(m.how === "name" && rejected.has(m.row.code))) result[m.row.code] = m.subjectCode;
    }
    for (const [code, subject] of Object.entries(chosen)) {
      if (subject === NOT_COUNTED) delete result[code];
      else result[code] = subject;
    }
    return result;
  }, [match, rejected, chosen]);

  const passedCodes = [...new Set(match.passed.map((m) => mapping[m.row.code]).filter(Boolean))];
  const mandatoryHours = bundle.entries
    .filter((e) => e.category === "mandatory" && passedCodes.includes(e.subjectCode))
    .reduce((sum, e) => sum + (e.workloadHours ?? 0), 0);
  const pendingHelp = unresolved.filter((m) => !chosen[m.row.code]).length;

  const options = bundle.entries
    .map((e) => ({ code: e.subjectCode, name: nameOf(e.subjectCode), hint: e.period ? `${e.period}º` : "eletiva" }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const confirm = () => {
    update(programKey(bundle.institution.code, bundle.program.code), (s) => ({
      completed: [...new Set([...passedCodes])].sort(),
      planned: s.planned.filter((c) => !passedCodes.includes(c)),
      simulateAt: null,
      history: {
        importedAt: new Date().toISOString(),
        fileName,
        rows: transcript.rows.map(({ term, code, name, status, workloadHours }) => ({ term, code, name, status, workloadHours })),
        terms: transcript.terms,
        mapping,
      },
    }));
    setPending(null);
    toast.success(`${passedCodes.length} disciplinas marcadas como aprovadas`);
    router.push(`${base}/progresso`);
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pt-10 pb-16 sm:px-8">
      <p role="status" className="flex items-center gap-2 rounded-lg bg-done-bg px-4 py-3 text-sm text-done">
        <LockKeyhole className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span className="min-w-0 break-all">{fileName} foi lido aqui no navegador. Nada foi enviado.</span>
      </p>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Confira o que encontramos</h1>
        <p className="text-ink-2">Desmarque o que estiver errado. Dá para mudar depois, em Progresso.</p>
        {otherProgram && (
          <p className="text-sm text-warn">
            Este histórico é de {otherProgram.toLowerCase()}, e você está em {bundle.program.name}.{" "}
            <Link href="/" className="link">
              Escolher outro curso
            </Link>
          </p>
        )}
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <Stat value={String(passedCodes.length)} label="aprovadas, reconhecidas no currículo" />
        <Stat value={formatHours(mandatoryHours)} label={`de ${formatHours(bundle.program.requiredHours.mandatory ?? 0)} obrigatórias`} />
        <Stat
          value={String(pendingHelp)}
          label={pendingHelp === 1 ? "precisa da sua ajuda" : "precisam da sua ajuda"}
          warn={pendingHelp > 0}
        />
      </dl>

      {unresolved.length > 0 && (
        <section aria-labelledby="help" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="help" className="text-lg font-medium">
              Precisa da sua ajuda
            </h2>
            <p className="text-sm text-ink-2">
              Aprovadas que não existem no currículo atual. Se uma delas equivale a uma disciplina de hoje, escolha qual.
            </p>
          </div>
          <ul className="flex flex-col divide-y rounded-xl border bg-card">
            {unresolved.map((m) => (
              <li key={m.row.code} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm">
                    <Code className="mr-2">{m.row.code}</Code>
                    {m.row.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {m.row.term} · {formatHours(m.row.workloadHours)}
                  </span>
                </div>
                <SubjectCombobox
                  options={options}
                  value={chosen[m.row.code] ?? null}
                  onChange={(code) => setChosen((c) => ({ ...c, [m.row.code]: code ?? NOT_COUNTED }))}
                  placeholder="Equivale a…"
                  extra={{ value: NOT_COUNTED, label: "Não equivale a nenhuma" }}
                  className="w-full sm:w-72"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {byName.length > 0 && (
        <section aria-labelledby="by-name" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="by-name" className="text-lg font-medium">
              Reconhecidas pelo nome
            </h2>
            <p className="text-sm text-ink-2">
              O código mudou desde que você cursou. Confira se a correspondência faz sentido.
            </p>
          </div>
          <ul className="flex flex-col divide-y rounded-xl border bg-card">
            {byName.map((m) => (
              <MatchRow
                key={m.row.code}
                match={m}
                name={nameOf(m.subjectCode!)}
                checked={!rejected.has(m.row.code)}
                onChange={(checked) =>
                  setRejected((r) => {
                    const next = new Set(r);
                    if (checked) next.delete(m.row.code);
                    else next.add(m.row.code);
                    return next;
                  })
                }
              />
            ))}
          </ul>
        </section>
      )}

      <Collapsible className="flex flex-col gap-3">
        <CollapsibleTrigger className="self-start text-sm font-medium text-ink-2 hover:text-foreground">
          {byCode.length} com o mesmo código no currículo atual
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="flex flex-col divide-y rounded-xl border bg-card text-sm">
            {byCode.map((m) => (
              <li key={m.row.code} className="flex items-center gap-2 px-4 py-2">
                <Code className="w-14">{m.row.code}</Code>
                {nameOf(m.row.code)}
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>

      {match.notPassed.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {match.notPassed.length === 1
            ? "1 disciplina sem aprovação no histórico (reprovação ou trancamento) não conta, mas fica guardada para a simulação semestre a semestre."
            : `${match.notPassed.length} disciplinas sem aprovação no histórico (reprovações, trancamentos) não contam, mas ficam guardadas para a simulação semestre a semestre.`}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t pt-6">
        <Button variant="outline" size="lg" onClick={onCancel}>
          Usar outro arquivo
        </Button>
        <Button size="lg" onClick={confirm}>
          Confirmar {passedCodes.length} disciplinas
          <ArrowRight strokeWidth={1.5} />
        </Button>
      </div>
    </main>
  );
}

function Stat({ value, label, warn = false }: { value: string; label: string; warn?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 rounded-xl border p-4 ${warn ? "border-warn-line bg-warn-bg text-warn" : "bg-card"}`}>
      <dd className="text-2xl font-medium">{value}</dd>
      <dt className={`text-sm ${warn ? "" : "text-muted-foreground"}`}>{label}</dt>
    </div>
  );
}

function MatchRow({
  match,
  name,
  checked,
  onChange,
}: {
  match: RowMatch;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = `match-${match.row.code}`;
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <Checkbox id={id} checked={checked} onCheckedChange={(c) => onChange(c === true)} className="mt-0.5" />
      <label htmlFor={id} className="grid min-w-0 flex-1 gap-x-3 gap-y-1 text-sm sm:grid-cols-[1fr_auto_1fr]">
        <span>
          <Code className="mr-2">{match.row.code}</Code>
          {match.row.name}
          {PASSED.has(match.row.status) && <span className="text-muted-foreground"> · {match.row.term}</span>}
        </span>
        <ArrowRight className="hidden size-4 text-muted-foreground sm:block" strokeWidth={1.5} aria-hidden="true" />
        <span>
          <Code className="mr-2">{match.subjectCode}</Code>
          {name}
        </span>
      </label>
    </li>
  );
}
