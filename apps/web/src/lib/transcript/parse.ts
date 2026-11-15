/**
 * Reads the course table of a UFOP "Histórico Escolar" (the PDF students
 * download from the academic system), from the text lines of the PDF.
 *
 * Only the course table, the program name and the hour summary are read; the
 * personal data at the top of the document is ignored.
 */

/** Situação na disciplina, from the legend printed on every transcript. */
export type Status =
  | "AP" // aprovado
  | "AE" // aproveitamento de estudos
  | "DP" // dispensado
  | "DE" // dispensa especial
  | "DJ" // dispensa judicial
  | "EA" // extraordinário aproveitamento
  | "PF" // proficiência
  | "CS" // cursando
  | "RN" // reprovado por nota
  | "RF" // reprovado por falta
  | "NF" // reprovado por nota e falta
  | "TR" // trancado
  | "X"; // cancelado

/** Statuses that count as having completed the subject. */
export const PASSED: ReadonlySet<Status> = new Set(["AP", "AE", "DP", "DE", "DJ", "EA", "PF"]);

export interface TranscriptRow {
  term: string;
  code: string;
  name: string;
  /** Marked "(E)" eletiva, "(F)" facultativa or "(P)" optativa on the transcript. */
  kind: "elective" | "facultative" | "optional" | null;
  workloadHours: number;
  grade: number | null;
  status: Status;
}

export interface Transcript {
  programName: string | null;
  rows: TranscriptRow[];
  /** Terms in order, including ones the student locked entirely. */
  terms: string[];
  /** "OBR: 3330 ELET: 300 ... TOTAL: 3630" when printed. */
  hours: { mandatory: number; elective: number; total: number } | null;
}

const ROW_RE =
  /^(\d{4}\/\d)\s+([A-Z]{3}\d{3})\s+-\s+(.+?)\s+(\d+)\/(\d+)(?:\s+(\d+(?:\.\d+)?))?(?:\s+\d+\/\d+)?\s+(AP|AE|DP|DE|DJ|EA|PF|CS|RN|RF|NF|TR|X)$/;
const TERM_ONLY_RE = /^(\d{4}\/\d)\s+\D/;
const KIND_RE = /\s*\((E|F|P)\)$/;
const KINDS = { E: "elective", F: "facultative", P: "optional" } as const;

export class TranscriptFormatError extends Error {}

export function parseTranscript(lines: string[]): Transcript {
  const rows: TranscriptRow[] = [];
  const terms = new Set<string>();
  let programName: string | null = null;
  let hours: Transcript["hours"] = null;

  for (const raw of lines) {
    const line = raw.replace(/\s+/g, " ").trim();
    const row = ROW_RE.exec(line);
    if (row) {
      const [, term, code, rawName, workload, , grade, status] = row;
      const kind = KIND_RE.exec(rawName);
      rows.push({
        term,
        code,
        name: rawName.replace(KIND_RE, ""),
        kind: kind ? KINDS[kind[1] as keyof typeof KINDS] : null,
        workloadHours: Number(workload),
        grade: grade === undefined ? null : Number(grade),
        status: status as Status,
      });
      terms.add(term);
      continue;
    }
    const termOnly = TERM_ONLY_RE.exec(line);
    if (termOnly) terms.add(termOnly[1]); // e.g. "2020/2 Trancamento Total de Periodo"

    const program = /^CURSO:\s*(.+)$/.exec(line);
    if (program) programName = program[1].trim();

    const summary = /OBR:\s*(\d+)\s+ELET:\s*(\d+).*?TOTAL:\s*(\d+)/.exec(line);
    if (summary) hours = { mandatory: Number(summary[1]), elective: Number(summary[2]), total: Number(summary[3]) };
  }

  if (rows.length === 0) {
    throw new TranscriptFormatError("Nenhuma disciplina encontrada. O arquivo é o histórico escolar da UFOP?");
  }
  return { programName, rows, terms: [...terms].sort(compareTerms), hours };
}

/** "2019/2" < "2020/1" */
export function compareTerms(a: string, b: string): number {
  return a.localeCompare(b);
}
