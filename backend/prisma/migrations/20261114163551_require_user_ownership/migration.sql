/*
  Warnings:

  - Made the column `userId` on table `CustomTopic` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `DeletedTopic` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Problem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CustomTopic" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "DeletedTopic" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Problem" ALTER COLUMN "userId" SET NOT NULL;
