-- AlterTable
ALTER TABLE "_MajorModerators" ADD CONSTRAINT "_MajorModerators_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_MajorModerators_AB_unique";

-- AlterTable
ALTER TABLE "_ScholarshipModerators" ADD CONSTRAINT "_ScholarshipModerators_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ScholarshipModerators_AB_unique";
