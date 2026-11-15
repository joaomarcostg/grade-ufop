"use client";

import { useState } from "react";

import type { Meeting, Section, Weekday } from "@/lib/catalog-types";
import type { SUBJECT_COLORS } from "@/lib/format";
import type { PlanOption } from "@/lib/scheduler";
import { formatMinutes, WEEKDAY_LONG, WEEKDAY_SHORT, WEEKDAYS } from "@/lib/time";

type Color = (typeof SUBJECT_COLORS)[number];
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

export function WeekCalendar({
  option,
  colors,
  name,
}: {
  option: PlanOption;
  colors: Record<string, Color>;
  name: (code: string) => string;
}) {
  const items = placed(option);
  const days = visibleDays(items);
  const first = items.length ? Math.floor(Math.min(...items.map((i) => i.meeting.start)) / 60) : 7;
  const last = items.length ? Math.ceil(Math.max(...items.map((i) => i.meeting.end)) / 60) : 18;
  const startHour = Math.max(0, Math.min(first, last - 6));
  const endHour = Math.max(last, startHour + 6);
  const height = (endHour - startHour) * PX_PER_HOUR;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  return (
    <section aria-label="Semana" className="overflow-x-auto rounded-2xl border border-line bg-surface px-4 pb-3 pt-4">
      <div
        className="grid min-w-[680px]"
        style={{ gridTemplateColumns: `52px repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div />
        {days.map((d) => (
          <div key={d} className="pb-2.5 pl-2 text-[13px] font-semibold text-ink-2">
            {WEEKDAY_SHORT[d]}
          </div>
        ))}
        <div className="relative" style={{ height }}>
          {hours.map((h) => (
            <span
              key={h}
              className="absolute right-2 text-xs text-muted"
              style={{ top: (h - startHour) * PX_PER_HOUR - 7 }}
            >
              {String(h).padStart(2, "0")}h
            </span>
          ))}
        </div>
        {days.map((day) => (
          <div
            key={day}
            className="relative border-l border-line"
            style={{
              height,
              backgroundImage: `repeating-linear-gradient(to bottom, #efede7 0, #efede7 1px, transparent 1px, transparent ${PX_PER_HOUR}px)`,
            }}
          >
            {items
              .filter((i) => i.meeting.day === day)
              .map(({ code, section, meeting }) => {
                const top = ((meeting.start - startHour * 60) / 60) * PX_PER_HOUR;
                const blockHeight = ((meeting.end - meeting.start) / 60) * PX_PER_HOUR - 2;
                const color = colors[code];
                const roomy = blockHeight >= 56;
                return (
                  <div
                    key={`${code}-${meeting.day}-${meeting.start}`}
                    className="absolute inset-x-1 flex flex-col gap-px overflow-hidden rounded-lg border px-2 py-1"
                    style={{ top: top + 1, height: blockHeight, background: color?.bg, borderColor: color?.border, color: color?.text }}
                  >
                    <span className="text-xs font-bold">
                      {code} · t{section.code}
                    </span>
                    {roomy && <span className="text-xs leading-tight">{name(code)}</span>}
                    <span className="text-[11px]">
                      {formatMinutes(meeting.start)}–{formatMinutes(meeting.end)}
                      {meeting.kind ? ` · ${KIND_LABEL[meeting.kind]}` : ""}
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

export function DayAgenda({
  option,
  colors,
  name,
}: {
  option: PlanOption;
  colors: Record<string, Color>;
  name: (code: string) => string;
}) {
  const items = placed(option);
  const days = WEEKDAYS.filter((d) => items.some((i) => i.meeting.day === d));
  const [picked, setPicked] = useState<Weekday | null>(null);
  const day = picked && days.includes(picked) ? picked : days[0];
  const today = items.filter((i) => i.meeting.day === day).sort((a, b) => a.meeting.start - b.meeting.start);

  if (!day) return null;
  return (
    <section aria-label="Agenda por dia" className="flex flex-col gap-3">
      <div role="tablist" aria-label="Dia da semana" className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={d === day}
            onClick={() => setPicked(d)}
            className={`min-h-11 rounded-xl border text-sm font-semibold ${
              d === day ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2"
            }`}
          >
            {WEEKDAY_SHORT[d]}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="flex flex-col gap-2.5">
        <h2 className="font-display text-xl font-semibold">{WEEKDAY_LONG[day]}</h2>
        {today.map(({ code, section, meeting }, i) => {
          const color = colors[code];
          const gap = i > 0 ? meeting.start - today[i - 1].meeting.end : 0;
          return (
            <div key={`${code}-${meeting.start}`} className="flex flex-col gap-2">
              {gap > 0 && <span className="pl-15 text-xs text-muted">intervalo de {gap} min</span>}
              <div className="flex gap-3">
                <div className="flex w-12 flex-none flex-col pt-3">
                  <span className="text-sm font-semibold">{formatMinutes(meeting.start)}</span>
                  <span className="text-xs text-muted">{formatMinutes(meeting.end)}</span>
                </div>
                <div
                  className="flex min-w-0 flex-1 flex-col gap-1 rounded-xl border px-3.5 py-3"
                  style={{ background: color?.bg, borderColor: color?.border, color: color?.text }}
                >
                  <span className="text-[13px] font-bold">
                    {code} · turma {section.code}
                    {meeting.kind ? ` · ${KIND_LABEL[meeting.kind]}` : ""}
                  </span>
                  <span className="text-[15px] font-semibold">{name(code)}</span>
                  {section.location && <span className="text-[13px]">{section.location}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
