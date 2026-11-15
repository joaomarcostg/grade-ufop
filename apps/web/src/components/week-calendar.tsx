"use client";

import { useState } from "react";

import type { Meeting, Section, Weekday } from "@/lib/catalog-types";
import { colorFor } from "@/lib/format";
import type { PlanOption } from "@/lib/scheduler";
import { formatMinutes, WEEKDAY_LONG, WEEKDAY_SHORT, WEEKDAYS } from "@/lib/time";
import { cn } from "@/lib/utils";

type Placed = { code: string; section: Section; meeting: Meeting };

const PX_PER_HOUR = 48;
const KIND_LABEL = { theory: "teórica", practice: "prática" } as const;

function placed(option: PlanOption): Placed[] {
  return Object.entries(option.sections).flatMap(([code, section]) =>
    section.meetings.map((meeting) => ({ code, section, meeting })),
  );
}

function visibleDays(items: Placed[]): Weekday[] {
  const used = new Set(items.map((i) => i.meeting.day));
  return WEEKDAYS.filter((d) => used.has(d) || !["SAT", "SUN"].includes(d));
}

/** The week of one timetable option. ``order`` fixes each subject's colour. */
export function WeekCalendar({
  option,
  order,
  names,
  className,
}: {
  option: PlanOption;
  order: string[];
  names: Record<string, string>;
  className?: string;
}) {
  const items = placed(option);
  const days = visibleDays(items);
  const first = items.length ? Math.floor(Math.min(...items.map((i) => i.meeting.start)) / 60) : 7;
  const last = items.length ? Math.ceil(Math.max(...items.map((i) => i.meeting.end)) / 60) : 18;
  // Start at the first class; keep at least four hours so short days still read as a week.
  const startHour = first;
  const endHour = Math.max(last, startHour + 4);
  const height = (endHour - startHour) * PX_PER_HOUR;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  return (
    <section aria-label="Semana" className={cn("overflow-x-auto rounded-xl border bg-card p-4", className)}>
      <div className="grid min-w-[640px]" style={{ gridTemplateColumns: `48px repeat(${days.length}, minmax(0, 1fr))` }}>
        <div />
        {days.map((d) => (
          <div key={d} className="pb-2 pl-2 text-xs text-muted-foreground">
            {WEEKDAY_SHORT[d]}
          </div>
        ))}
        <div className="relative" style={{ height }}>
          {hours.map((h) => (
            <span
              key={h}
              className="absolute right-2 font-mono text-[11px] text-muted-foreground"
              style={{ top: (h - startHour) * PX_PER_HOUR - 7 }}
            >
              {String(h).padStart(2, "0")}h
            </span>
          ))}
        </div>
        {days.map((day) => (
          <div
            key={day}
            className="relative border-l"
            style={{
              height,
              backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0, var(--border) 1px, transparent 1px, transparent ${PX_PER_HOUR}px)`,
            }}
          >
            {items
              .filter((i) => i.meeting.day === day)
              .map(({ code, section, meeting }) => {
                const top = ((meeting.start - startHour * 60) / 60) * PX_PER_HOUR;
                const blockHeight = ((meeting.end - meeting.start) / 60) * PX_PER_HOUR - 2;
                const color = colorFor(code, order);
                return (
                  <div
                    key={`${code}-${meeting.day}-${meeting.start}`}
                    className="absolute inset-x-1 flex flex-col gap-0.5 overflow-hidden rounded-md border px-2 py-1"
                    style={{ top: top + 1, height: blockHeight, background: color.bg, borderColor: color.border, color: color.text }}
                  >
                    <span className="font-mono text-[11px] font-medium">
                      {code} · t{section.code}
                    </span>
                    {blockHeight >= 56 && <span className="text-xs leading-tight">{names[code] ?? code}</span>}
                    <span className="font-mono text-[11px] opacity-80">
                      {formatMinutes(meeting.start)}–{formatMinutes(meeting.end)}
                      {meeting.kind ? ` ${meeting.kind === "theory" ? "T" : "P"}` : ""}
                    </span>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </section>
  );
}

/** One day at a time, for phones. */
export function DayAgenda({
  option,
  order,
  names,
}: {
  option: PlanOption;
  order: string[];
  names: Record<string, string>;
}) {
  const items = placed(option);
  const days = WEEKDAYS.filter((d) => items.some((i) => i.meeting.day === d));
  const [picked, setPicked] = useState<Weekday | null>(null);
  const day = picked && days.includes(picked) ? picked : days[0];
  const today = items.filter((i) => i.meeting.day === day).sort((a, b) => a.meeting.start - b.meeting.start);

  if (!day) return null;
  return (
    <section aria-label="Agenda por dia" className="flex flex-col gap-3">
      <div role="tablist" aria-label="Dia da semana" className="grid gap-1 rounded-lg bg-muted p-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={d === day}
            onClick={() => setPicked(d)}
            className={cn(
              "h-9 rounded-md text-sm transition-colors",
              d === day ? "bg-card font-medium text-foreground shadow-sm" : "text-ink-2",
            )}
          >
            {WEEKDAY_SHORT[d]}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">{WEEKDAY_LONG[day]}</h2>
        {today.map(({ code, section, meeting }, i) => {
          const color = colorFor(code, order);
          const gap = i > 0 ? meeting.start - today[i - 1].meeting.end : 0;
          return (
            <div key={`${code}-${meeting.start}`} className="flex flex-col gap-2">
              {gap > 0 && <span className="pl-15 text-xs text-muted-foreground">intervalo de {gap} min</span>}
              <div className="flex gap-3">
                <div className="flex w-12 flex-none flex-col pt-2.5 font-mono text-xs">
                  <span>{formatMinutes(meeting.start)}</span>
                  <span className="text-muted-foreground">{formatMinutes(meeting.end)}</span>
                </div>
                <div
                  className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg border px-3 py-2.5"
                  style={{ background: color.bg, borderColor: color.border, color: color.text }}
                >
                  <span className="font-mono text-[11px] font-medium">
                    {code} · turma {section.code}
                    {meeting.kind ? ` · ${KIND_LABEL[meeting.kind]}` : ""}
                  </span>
                  <span className="text-sm font-medium">{names[code] ?? code}</span>
                  {section.location && <span className="text-xs opacity-80">{section.location}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
