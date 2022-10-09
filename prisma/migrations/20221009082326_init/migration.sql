/*
  Warnings:

  - You are about to alter the column `type` on the `Lecture` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum("Lecture_type")`.

*/
-- AlterTable
ALTER TABLE `Lecture` MODIFY `type` ENUM('Lecture', 'Seminar', 'Internship', 'Exercise') NOT NULL;
