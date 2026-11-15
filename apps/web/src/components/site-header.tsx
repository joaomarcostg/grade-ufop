import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "./brand";

const AUTHOR_URL = "https://github.com/joaomarcostg";
const REPO_URL = "https://github.com/joaomarcostg/grade-ufop";

/** GitHub's mark (Octicons, MIT). */
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}

export function SiteHeader({ children, term, aside }: { children?: ReactNode; term?: string; aside?: ReactNode }) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" aria-label="grade, página inicial">
            <Logo />
          </Link>
          {children}
        </div>
        <div className="flex items-center gap-3">
          {aside}
          {term && <span className="hidden text-sm text-muted-foreground sm:inline">UFOP · {term}</span>}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Código do projeto no GitHub"
            title="Código do projeto no GitHub"
            className="inline-flex size-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-secondary/70 hover:text-foreground"
          >
            <GitHubMark className="size-[18px]" />
          </a>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ syncedAt }: { syncedAt?: string | null }) {
  const date = syncedAt
    ? new Date(syncedAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : null;
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-6 text-sm leading-relaxed sm:px-8">
        <p className="flex flex-wrap items-center gap-x-1.5 text-ink-2">
          <GitHubMark className="size-4 shrink-0" />
          <span>
            Feito por{" "}
            <a href={AUTHOR_URL} target="_blank" rel="noreferrer" className="link">
              João Marcos
            </a>{" "}
            como Trabalho de Conclusão de Curso na UFOP. O código é aberto e está no{" "}
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="link">
              GitHub
            </a>
            .
          </span>
        </p>
        <p className="text-muted-foreground">
          Dados públicos do Horário de Aulas e das matrizes curriculares da UFOP
          {date ? `, atualizados em ${date}` : ""}. Não é um serviço oficial da universidade: confira sempre no sistema
          acadêmico antes de se matricular.
        </p>
      </div>
    </footer>
  );
}
