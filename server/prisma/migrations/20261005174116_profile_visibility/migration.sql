-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'FRIENDS', 'PRIVATE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'FRIENDS';
