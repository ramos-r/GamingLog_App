-- AlterTable
ALTER TABLE "UserGame" ADD COLUMN     "favoritePosition" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- Keep today's order: newest first inside each category and inside Favorites.
UPDATE "UserGame" AS ug
SET "position" = ranked.pos
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "userId", "category" ORDER BY "addedAt" DESC, "id") - 1 AS pos
  FROM "UserGame"
) AS ranked
WHERE ug."id" = ranked."id";

UPDATE "UserGame" AS ug
SET "favoritePosition" = ranked.pos
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "addedAt" DESC, "id") - 1 AS pos
  FROM "UserGame"
  WHERE "isFavorite"
) AS ranked
WHERE ug."id" = ranked."id";
