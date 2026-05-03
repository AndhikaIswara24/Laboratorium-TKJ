/*
  Warnings:

  - The values [FEASIBLE,UNFEASIBLE] on the enum `EvaluationResult` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `ageInMonths` on the `NaiveBayesEvaluation` table. All the data in the column will be lost.
  - You are about to drop the column `frequencyOfUse` on the `NaiveBayesEvaluation` table. All the data in the column will be lost.
  - You are about to drop the column `previousCondition` on the `NaiveBayesEvaluation` table. All the data in the column will be lost.
  - Added the required column `ageInYears` to the `NaiveBayesEvaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conditionScore` to the `NaiveBayesEvaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frequencyPerMonth` to the `NaiveBayesEvaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `needsRepairProbability` to the `NaiveBayesEvaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notUsableProbability` to the `NaiveBayesEvaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `repairsCount` to the `NaiveBayesEvaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usableProbability` to the `NaiveBayesEvaluation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EvaluationResult_new" AS ENUM ('USABLE', 'NEEDS_REPAIR', 'NOT_USABLE');
ALTER TABLE "NaiveBayesEvaluation" ALTER COLUMN "result" TYPE "EvaluationResult_new" USING ("result"::text::"EvaluationResult_new");
ALTER TYPE "EvaluationResult" RENAME TO "EvaluationResult_old";
ALTER TYPE "EvaluationResult_new" RENAME TO "EvaluationResult";
DROP TYPE "EvaluationResult_old";
COMMIT;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "conditionScore" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "repairsCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "NaiveBayesEvaluation" DROP COLUMN "ageInMonths",
DROP COLUMN "frequencyOfUse",
DROP COLUMN "previousCondition",
ADD COLUMN     "ageInYears" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "conditionScore" INTEGER NOT NULL,
ADD COLUMN     "frequencyPerMonth" INTEGER NOT NULL,
ADD COLUMN     "needsRepairProbability" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "notUsableProbability" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "repairsCount" INTEGER NOT NULL,
ADD COLUMN     "usableProbability" DOUBLE PRECISION NOT NULL;
