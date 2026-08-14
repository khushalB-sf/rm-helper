-- AlterTable
ALTER TABLE "Certification" ADD COLUMN     "assignedById" TEXT,
ALTER COLUMN "appliedDate" DROP NOT NULL,
ALTER COLUMN "appliedDate" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
