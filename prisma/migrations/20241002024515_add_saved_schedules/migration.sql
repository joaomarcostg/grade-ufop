-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "course" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equivalency_group" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "equivalency_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "department_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,
    "equivalency_group_id" UUID,

    CONSTRAINT "discipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "completed_discipline" (
    "userId" TEXT NOT NULL,
    "disciplineId" UUID NOT NULL,

    CONSTRAINT "completed_discipline_pkey" PRIMARY KEY ("userId","disciplineId")
);

-- CreateTable
CREATE TABLE "discipline_class" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "class_number" TEXT,
    "discipline_id" UUID NOT NULL,
    "semester" TEXT NOT NULL,
    "professor" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "discipline_class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_class_schedule" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "discipline_class_id" UUID NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "class_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "discipline_class_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_course" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "discipline_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "mandatory" BOOLEAN NOT NULL,
    "period" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "discipline_course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prerequisite" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "discipline_course_id" UUID NOT NULL,
    "prerequisite_discipline_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "prerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "schedule" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_class" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "scheduleId" UUID NOT NULL,
    "disciplineClassId" UUID NOT NULL,

    CONSTRAINT "schedule_class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "courseId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_token" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_token_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_sessionToken_key" ON "session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_token_key" ON "verification_token"("token");

-- AddForeignKey
ALTER TABLE "discipline" ADD CONSTRAINT "discipline_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discipline" ADD CONSTRAINT "discipline_equivalency_group_id_fkey" FOREIGN KEY ("equivalency_group_id") REFERENCES "equivalency_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completed_discipline" ADD CONSTRAINT "completed_discipline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completed_discipline" ADD CONSTRAINT "completed_discipline_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_class" ADD CONSTRAINT "schedule_class_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_class" ADD CONSTRAINT "schedule_class_disciplineClassId_fkey" FOREIGN KEY ("disciplineClassId") REFERENCES "discipline_class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
