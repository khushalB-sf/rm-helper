-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "projects" JSONB,
ADD COLUMN     "yearsOfExperience" INTEGER;
