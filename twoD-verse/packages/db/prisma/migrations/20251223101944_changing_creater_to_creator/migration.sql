/*
  Warnings:

  - You are about to drop the column `createrId` on the `Space` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `Space` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Space" DROP CONSTRAINT "Space_createrId_fkey";

-- AlterTable
ALTER TABLE "Space" DROP COLUMN "createrId",
ADD COLUMN     "creatorId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
