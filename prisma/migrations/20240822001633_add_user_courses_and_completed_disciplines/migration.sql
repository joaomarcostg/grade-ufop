-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'WITHDRAWN', 'ON_LEAVE');

-- CreateTable
CREATE TABLE "user_course_enrollment" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" TEXT NOT NULL,
    "courseId" UUID NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "status" "EnrollmentStatus" NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_course_enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_completed_discipline" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" TEXT NOT NULL,
    "disciplineId" UUID NOT NULL,
    "completedAt" DATE NOT NULL,
    "grade" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_completed_discipline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_course_enrollment_userId_courseId_key" ON "user_course_enrollment"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "user_completed_discipline_userId_disciplineId_key" ON "user_completed_discipline"("userId", "disciplineId");

-- AddForeignKey
ALTER TABLE "user_course_enrollment" ADD CONSTRAINT "user_course_enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_course_enrollment" ADD CONSTRAINT "user_course_enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_completed_discipline" ADD CONSTRAINT "user_completed_discipline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_completed_discipline" ADD CONSTRAINT "user_completed_discipline_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
