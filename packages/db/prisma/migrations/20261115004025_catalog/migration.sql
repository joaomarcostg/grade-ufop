-- CreateEnum
CREATE TYPE "entry_category" AS ENUM ('mandatory', 'elective', 'optional', 'activity');

-- CreateEnum
CREATE TYPE "weekday" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "class_kind" AS ENUM ('theory', 'practice');

-- CreateTable
CREATE TABLE "institution" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,

    CONSTRAINT "institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "term" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "institution_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "synced_at" TIMESTAMPTZ,
    "dataset_sha256" TEXT,

    CONSTRAINT "term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "institution_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "institution_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department_id" UUID,
    "syllabus" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "institution_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "degree" TEXT,
    "campus" TEXT,

    CONSTRAINT "program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "program_id" UUID NOT NULL,
    "term_id" UUID NOT NULL,
    "version" TEXT,
    "required_hours" JSONB NOT NULL DEFAULT '{}',
    "source_url" TEXT,

    CONSTRAINT "curriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_track" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "curriculum_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required_hours" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "curriculum_track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_entry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "curriculum_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "category" "entry_category" NOT NULL,
    "track" TEXT,
    "period" INTEGER,
    "workload_hours" INTEGER,
    "extension_hours" INTEGER,
    "class_hours" INTEGER,
    "weekly_theory" INTEGER,
    "weekly_practice" INTEGER,

    CONSTRAINT "curriculum_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_requirement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entry_id" UUID NOT NULL,
    "subject_id" UUID,
    "hours" INTEGER,

    CONSTRAINT "entry_requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "term_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "delivery" TEXT,
    "modality" TEXT,
    "location" TEXT,
    "language" TEXT,
    "seats" INTEGER,
    "enrolled" INTEGER,
    "reservation" TEXT,
    "withdrawn_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_meeting" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "section_id" UUID NOT NULL,
    "day" "weekday" NOT NULL,
    "start_minute" SMALLINT NOT NULL,
    "end_minute" SMALLINT NOT NULL,
    "kind" "class_kind",

    CONSTRAINT "section_meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_instructor" (
    "section_id" UUID NOT NULL,
    "position" SMALLINT NOT NULL,
    "name" TEXT NOT NULL,
    "kinds" "class_kind"[],

    CONSTRAINT "section_instructor_pkey" PRIMARY KEY ("section_id","position")
);

-- CreateIndex
CREATE UNIQUE INDEX "institution_code_key" ON "institution"("code");

-- CreateIndex
CREATE UNIQUE INDEX "term_institution_id_code_key" ON "term"("institution_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "department_institution_id_code_key" ON "department"("institution_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "subject_institution_id_code_key" ON "subject"("institution_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "program_institution_id_code_key" ON "program"("institution_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_program_id_term_id_key" ON "curriculum"("program_id", "term_id");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_track_curriculum_id_kind_name_key" ON "curriculum_track"("curriculum_id", "kind", "name");

-- CreateIndex
CREATE INDEX "curriculum_entry_curriculum_id_idx" ON "curriculum_entry"("curriculum_id");

-- CreateIndex
CREATE INDEX "curriculum_entry_subject_id_idx" ON "curriculum_entry"("subject_id");

-- CreateIndex
CREATE INDEX "entry_requirement_entry_id_idx" ON "entry_requirement"("entry_id");

-- CreateIndex
CREATE INDEX "section_term_id_department_id_idx" ON "section"("term_id", "department_id");

-- CreateIndex
CREATE UNIQUE INDEX "section_term_id_subject_id_code_key" ON "section"("term_id", "subject_id", "code");

-- CreateIndex
CREATE INDEX "section_meeting_section_id_idx" ON "section_meeting"("section_id");

-- AddForeignKey
ALTER TABLE "term" ADD CONSTRAINT "term_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject" ADD CONSTRAINT "subject_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject" ADD CONSTRAINT "subject_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program" ADD CONSTRAINT "program_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum" ADD CONSTRAINT "curriculum_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum" ADD CONSTRAINT "curriculum_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_track" ADD CONSTRAINT "curriculum_track_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_entry" ADD CONSTRAINT "curriculum_entry_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_entry" ADD CONSTRAINT "curriculum_entry_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_requirement" ADD CONSTRAINT "entry_requirement_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "curriculum_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_requirement" ADD CONSTRAINT "entry_requirement_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section" ADD CONSTRAINT "section_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section" ADD CONSTRAINT "section_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section" ADD CONSTRAINT "section_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_meeting" ADD CONSTRAINT "section_meeting_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_instructor" ADD CONSTRAINT "section_instructor_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Constraints Prisma cannot express.

-- A requirement is either a subject or a number of hours, never both.
ALTER TABLE "entry_requirement"
  ADD CONSTRAINT "entry_requirement_subject_xor_hours"
  CHECK (("subject_id" IS NULL) <> ("hours" IS NULL)),
  ADD CONSTRAINT "entry_requirement_hours_positive" CHECK ("hours" IS NULL OR "hours" > 0);

ALTER TABLE "section_meeting"
  ADD CONSTRAINT "section_meeting_minutes_valid"
  CHECK ("start_minute" >= 0 AND "end_minute" <= 1440 AND "end_minute" > "start_minute");

-- At most one current term per institution.
CREATE UNIQUE INDEX "term_one_current_per_institution" ON "term" ("institution_id") WHERE "is_current";
