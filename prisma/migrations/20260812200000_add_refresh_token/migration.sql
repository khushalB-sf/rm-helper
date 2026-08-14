-- AlterTable
ALTER TABLE "User" ADD COLUMN "refreshTokenHash" TEXT,
ADD COLUMN "refreshTokenExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_refreshTokenHash_key" ON "User"("refreshTokenHash");
