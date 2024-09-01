import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { AutocompleteOption } from "@/app/components/InputAutocomplete";
import type { DisciplineClassSchedule } from "@prisma/client";
import { convertDateToMinutes } from "@/app/utils/converters";
import {
  SelectedDiscipline,
  RequestResponse,
} from "@/lib/fetch-api/fetch-buildGrades";

type SelectedOption = AutocompleteOption & {
  professor: string;
  disciplineId: string;
};

type RequestBody = {
  [slotId: string]: SelectedOption[];
};

type ScheduleType = Pick<
  DisciplineClassSchedule,
  "startTime" | "endTime" | "dayOfWeek" | "classType"
>;

export async function POST(request: NextRequest) {
  const body: RequestBody = await request.json();
  const conflictFreeOptions = await getScheduleForSelectedDisciplines(body);
  return NextResponse.json({ data: conflictFreeOptions });
}

async function getScheduleForSelectedDisciplines(
  selectedDisciplines: RequestBody
) {
  const slotsSchedules: {
    [slotId: string]: {
      [disciplineClassId: string]: ScheduleType[];
    };
  } = {};

  for (const [slotId, selectedOptions] of Object.entries(selectedDisciplines)) {
    for (const selectedOption of selectedOptions) {
      const disciplineClassSchedules =
        await prisma.disciplineClassSchedule.findMany({
          where: {
            disciplineClassId: selectedOption.value,
          },
          select: {
            classType: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        });

      if (!(slotId in slotsSchedules)) {
        slotsSchedules[slotId] = {};
      }
      slotsSchedules[slotId][selectedOption.value] = disciplineClassSchedules;
    }
  }

  const conflictingDisciplines: {
    [slotId: string]: {
      [disciplineClassId: string]: string[];
    };
  } = {};

  for (const [slotId, disciplinesObj] of Object.entries(slotsSchedules)) {
    const otherSlots = Object.fromEntries(
      Object.entries(slotsSchedules).filter((entry) => entry[0] !== slotId)
    );
    conflictingDisciplines[slotId] = {};

    for (const disciplineId of Object.keys(disciplinesObj)) {
      conflictingDisciplines[slotId][disciplineId] = [];
      const scheduleList = slotsSchedules[slotId][disciplineId];
      scheduleList.forEach((schedule) => {
        for (const [otherSlotid, otherDisciplinesObj] of Object.entries(
          otherSlots
        )) {
          for (const otherDisciplineId of Object.keys(otherDisciplinesObj)) {
            const otherScheduleList =
              otherSlots[otherSlotid][otherDisciplineId];

            const hasConflict = otherScheduleList.some((otherSchedule) =>
              hasTimeConflict(schedule, otherSchedule)
            );

            if (
              hasConflict &&
              !conflictingDisciplines[slotId][disciplineId].includes(
                otherDisciplineId
              )
            ) {
              conflictingDisciplines[slotId][disciplineId].push(
                otherDisciplineId
              );
              break;
            }
          }
        }
      });
    }
  }

  // Generate all possible combinations of classes from the slots
  const allCombinations: Array<{ [slotId: string]: string }> = [];
  const slotIds = Object.keys(slotsSchedules);

  function generateCombinations(
    combination: { [slotId: string]: string },
    index: number
  ) {
    if (index === slotIds.length) {
      allCombinations.push({ ...combination });
      return;
    }

    const slotId = slotIds[index];
    const disciplines = Object.keys(slotsSchedules[slotId]);

    for (const discipline of disciplines) {
      if (
        Object.values(combination).every(
          (disciplineId) =>
            !conflictingDisciplines[slotId]?.[discipline]?.includes(
              disciplineId
            )
        )
      ) {
        combination[slotId] = discipline;
      }
      generateCombinations({ ...combination }, index + 1);
    }
  }

  generateCombinations({}, 0);

  // Rank the valid combinations
  allCombinations.sort((a, b) => {
    return Object.keys(b).length - Object.keys(a).length;
  });

  // Convert objects to arrays (assuming values are arrays)
  const bestCombinations = allCombinations.slice(
    0,
    Math.min(5, allCombinations.length)
  );

  const disciplineIds = new Set(
    bestCombinations.map((obj) => Object.values(obj).flat()).flat()
  );

  const disciplineClasses: { [id: string]: SelectedDiscipline } = {};

  for (const disciplineClassId of Array.from(disciplineIds)) {
    const disciplineData = await prisma.disciplineClass.findUnique({
      where: {
        id: disciplineClassId,
      },
      include: {
        schedules: {
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
        discipline: {
          select: {
            code: true,
            description: true,
            name: true,
          },
        },
      },
    });

    if (disciplineData) {
      disciplineClasses[disciplineClassId] = {
        classNumber: disciplineData?.classNumber ?? "",
        code: disciplineData.discipline?.code ?? "",
        name: disciplineData.discipline?.name ?? "",
        professor: disciplineData.professor ?? "",
        schedule: formatSchedules(disciplineData.schedules),
      };
    }
  }

  // Return first 5 or all if fewer than 5
  const responseObj: RequestResponse = {};

  bestCombinations.forEach((combination, index) => {
    responseObj[index] = {};
    for (const disciplineClassId of Object.values(combination)) {
      responseObj[index][disciplineClassId] =
        disciplineClasses[disciplineClassId];
    }
  });

  return responseObj;
}

function hasTimeConflict(
  schedule1: ScheduleType,
  schedule2: ScheduleType
): boolean {
  // Step 1: Check if days of the week match
  if (schedule1.dayOfWeek !== schedule2.dayOfWeek) {
    return false;
  }

  const schedule1Start = convertDateToMinutes(schedule1.startTime);
  const schedule1End = convertDateToMinutes(schedule1.endTime);
  const schedule2Start = convertDateToMinutes(schedule2.startTime);
  const schedule2End = convertDateToMinutes(schedule2.endTime);

  // If any of the times are null, they cannot be compared
  if (
    schedule1Start === -1 ||
    schedule1End === -1 ||
    schedule2Start === -1 ||
    schedule2End === -1
  ) {
    return false;
  }

  // Check for time overlap
  if (schedule1End <= schedule2Start || schedule1Start >= schedule2End) {
    return false;
  }

  return true; // Time overlap exists, hence a conflict
}

function getFormatedTime({
  startTime,
  endTime,
}: Partial<ScheduleType>): string {
  const _startTime = startTime
    ? `${startTime.getUTCHours()}:${
        startTime.getUTCMinutes() ? startTime.getUTCMinutes() : "00"
      }`
    : "";

  const _endTime = endTime
    ? `${endTime.getUTCHours()}:${
        endTime.getUTCMinutes() ? endTime.getUTCMinutes() : "00"
      }`
    : "";

  return `${_startTime} - ${_endTime}`;
}

function formatSchedules(rawSchedules: Array<Partial<ScheduleType>>) {
  const groupedSchedules: Record<string, Partial<ScheduleType>[]> = {};

  // Group schedules by day_of_week
  rawSchedules.forEach((schedule) => {
    const day = schedule.dayOfWeek ?? "";
    if (!groupedSchedules[day]) {
      groupedSchedules[day] = [];
    }
    groupedSchedules[day].push(schedule);
  });

  const reducedSchedules = Object.keys(groupedSchedules).map((day) => {
    const schedulesForDay = groupedSchedules[day];

    let lowestStartTime: Date | null = null;
    let highestEndTime: Date | null = null;

    schedulesForDay.forEach((schedule) => {
      if (
        schedule.startTime &&
        (lowestStartTime === null || schedule.startTime < lowestStartTime)
      ) {
        lowestStartTime = schedule.startTime;
      }

      if (
        schedule.endTime &&
        (highestEndTime === null || schedule.endTime > highestEndTime)
      ) {
        highestEndTime = schedule.endTime;
      }
    });

    return {
      dayOfWeek: day,
      startTime: getFormatedTime({
        startTime: lowestStartTime,
        endTime: highestEndTime,
      }),
    };
  });
  return reducedSchedules;
}
