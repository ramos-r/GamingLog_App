import { randomBytes } from "node:crypto";
import { PrismaClient, Category } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const GAMES: { title: string; genre: string }[] = [
  { title: "Final Fantasy XIV Online", genre: "MMORPG" },
  { title: "Stardew Valley", genre: "Simulation/Farming" },
  { title: "Genshin Impact", genre: "Action RPG" },
  { title: "Fields of Mistria", genre: "Simulation/Farming" },
  { title: "Palworld", genre: "Survival/Adventure" },
  { title: "Monster Hunter World", genre: "Action RPG" },
];

async function seedGames() {
  const games = new Map<string, string>();
  for (const { title, genre } of GAMES) {
    const existing = await prisma.game.findFirst({ where: { title } });
    const game = existing ?? (await prisma.game.create({ data: { title, genre, coverUrl: null } }));
    games.set(title, game.id);
  }
  return games;
}

async function seedDemoUser() {
  const existing = await prisma.user.findUnique({ where: { username: "demo" } });
  if (existing) {
    return existing.id;
  }

  const password = randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username: "demo",
      passwordHash,
      bio: "Cataloging every game I play. Currently deep in Eorzea.",
    },
  });

  console.log("\nCreated demo user:");
  console.log("  username: demo");
  console.log(`  password: ${password}\n`);

  return user.id;
}

async function seedLibrary(userId: string, games: Map<string, string>) {
  const entries: {
    title: string;
    category: Category;
    platform: string | null;
    rating: number | null;
    isFavorite: boolean;
  }[] = [
    { title: "Final Fantasy XIV Online", category: Category.PLAYING, platform: "PC", rating: 5, isFavorite: true },
    { title: "Stardew Valley", category: Category.PLAYING, platform: "Switch", rating: 4, isFavorite: false },
    { title: "Genshin Impact", category: Category.PLAYED_BEFORE, platform: "PC", rating: 3, isFavorite: false },
    { title: "Palworld", category: Category.PLAYED_BEFORE, platform: "PC", rating: 4, isFavorite: true },
    { title: "Fields of Mistria", category: Category.WANT_TO_PLAY, platform: null, rating: null, isFavorite: false },
    { title: "Monster Hunter World", category: Category.WANT_TO_PLAY, platform: null, rating: null, isFavorite: false },
  ];

  for (const entry of entries) {
    const gameId = games.get(entry.title);
    if (!gameId) continue;

    await prisma.userGame.upsert({
      where: { userId_gameId: { userId, gameId } },
      update: {},
      create: {
        userId,
        gameId,
        category: entry.category,
        platform: entry.platform,
        rating: entry.rating,
        isFavorite: entry.isFavorite,
      },
    });
  }
}

async function main() {
  const games = await seedGames();
  const userId = await seedDemoUser();
  await seedLibrary(userId, games);
  console.log("Seed complete.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
