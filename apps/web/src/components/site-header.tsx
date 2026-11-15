import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "./brand";

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
      <p className="mx-auto max-w-[1440px] px-4 py-6 text-sm leading-relaxed text-muted-foreground sm:px-8">
        Dados públicos do Horário de Aulas e das matrizes curriculares da UFOP
        {date ? `, atualizados em ${date}` : ""}. Projeto independente, sem vínculo oficial com a universidade.
        Confira sempre no sistema acadêmico antes de se matricular.
      </p>
    </footer>
  );
}
