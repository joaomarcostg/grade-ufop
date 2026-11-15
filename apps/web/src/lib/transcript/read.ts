import { pdfLines } from "./extract";
import { parseTranscript, type Transcript, TranscriptFormatError } from "./parse";

const MAX_BYTES = 10 * 1024 * 1024;

/** Reads a transcript PDF chosen by the student. Errors carry a message to show them. */
export async function readTranscriptFile(file: File): Promise<Transcript> {
  if (file.type && file.type !== "application/pdf") {
    throw new Error("O arquivo precisa ser um PDF");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("O arquivo é grande demais para um histórico escolar");
  }
  let lines: string[];
  try {
    lines = await pdfLines(await file.arrayBuffer());
  } catch {
    throw new Error("Não foi possível abrir o PDF. Ele está protegido ou corrompido?");
  }
  try {
    return parseTranscript(lines);
  } catch (error) {
    if (error instanceof TranscriptFormatError) throw new Error(error.message);
    throw error;
  }
}
