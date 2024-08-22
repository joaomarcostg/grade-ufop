/*
  Warnings:

  - You are about to drop the column `classType` on the `discipline_class_schedule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "discipline_class_schedule" DROP COLUMN "classType",
ADD COLUMN     "class_type" TEXT;
