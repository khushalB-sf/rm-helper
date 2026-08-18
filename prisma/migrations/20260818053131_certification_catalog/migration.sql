/*
  Warnings:

  - You are about to drop the column `resourceUrl` on the `InternalSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InternalSession" DROP COLUMN "resourceUrl";

-- CreateTable
CREATE TABLE "CertificationCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificationCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CertificationCatalog_name_key" ON "CertificationCatalog"("name");

-- AddForeignKey
ALTER TABLE "CertificationCatalog" ADD CONSTRAINT "CertificationCatalog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
