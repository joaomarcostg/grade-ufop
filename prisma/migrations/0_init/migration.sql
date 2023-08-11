-- CreateTable
CREATE TABLE "course" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" VARCHAR,
    "name" VARCHAR,
    "created_at" TIMESTAMP(6),

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" VARCHAR,
    "name" VARCHAR,
    "created_at" TIMESTAMP(6),

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" VARCHAR,
    "name" VARCHAR,
    "description" VARCHAR,
    "department_id" UUID,
    "created_at" TIMESTAMP(6),

    CONSTRAINT "discipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_class" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "class_number" VARCHAR,
    "discipline_id" UUID,
    "semester" VARCHAR,
    "professor" VARCHAR,
    "created_at" TIMESTAMP(6),

    CONSTRAINT "discipline_class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_class_schedule" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "discipline_class_id" UUID,
    "day_of_week" VARCHAR,
    "start_time" TIME(6),
    "end_time" TIME(6),
    "class_type" VARCHAR,
    "created_at" TIMESTAMP(6),

    CONSTRAINT "discipline_class_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_course" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "discipline_id" UUID,
    "course_id" UUID,
    "mandatory" BOOLEAN,
    "period" INTEGER,
    "created_at" TIMESTAMP(6),

    CONSTRAINT "discipline_course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prerequisite" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "discipline_course_id" UUID,
    "prerequisite_discipline_id" UUID,
    "created_at" TIMESTAMP(6),

    CONSTRAINT "prerequisite_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "discipline" ADD CONSTRAINT "discipline_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discipline_class" ADD CONSTRAINT "discipline_class_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "discipline"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discipline_class_schedule" ADD CONSTRAINT "discipline_class_schedule_discipline_class_id_fkey" FOREIGN KEY ("discipline_class_id") REFERENCES "discipline_class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discipline_course" ADD CONSTRAINT "discipline_course_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discipline_course" ADD CONSTRAINT "discipline_course_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "discipline"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prerequisite" ADD CONSTRAINT "prerequisite_discipline_course_id_fkey" FOREIGN KEY ("discipline_course_id") REFERENCES "discipline_course"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prerequisite" ADD CONSTRAINT "prerequisite_prerequisite_discipline_id_fkey" FOREIGN KEY ("prerequisite_discipline_id") REFERENCES "discipline"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

