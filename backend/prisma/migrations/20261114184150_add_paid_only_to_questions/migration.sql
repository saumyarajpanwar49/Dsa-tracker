-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "paidOnly" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Question_paidOnly_idx" ON "Question"("paidOnly");
