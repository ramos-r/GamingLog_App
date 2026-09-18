export interface IgdbSuggestion {
  title: string;
  genre: string | null;
  coverUrl: string | null;
  platforms: string[];
}

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
}

interface IgdbGameResult {
  name: string;
  cover?: { image_id: string };
  genres?: { name: string }[];
  platforms?: { name: string }[];
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

// Cached in memory across requests within the same server process — IGDB
// tokens last ~60 days, so re-authenticating on every call would be wasteful
// and would burn into the 4 req/s rate limit for no reason.
let cachedToken: CachedToken | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("IGDB_CLIENT_ID / IGDB_CLIENT_SECRET are not set");
  }

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Twitch OAuth failed: ${res.status}`);
  }

  const data = (await res.json()) as TwitchTokenResponse;
  // Renew a day before actual expiry rather than cutting it exactly at the edge.
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60 * 60 * 24) * 1000,
  };
  return cachedToken.accessToken;
}

function toCoverUrl(imageId: string): string {
  return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
}

// IGDB is a convenience for pre-filling the add-game form, never a hard
// dependency — any failure (missing credentials, network error, bad
// response) degrades to an empty suggestion list instead of throwing.
export async function searchIgdbGames(query: string): Promise<IgdbSuggestion[]> {
  const clientId = process.env.IGDB_CLIENT_ID;
  if (!clientId || !query) {
    return [];
  }

  try {
    const token = await getAccessToken();
    const sanitizedQuery = query.replace(/"/g, "");
    const res = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: `search "${sanitizedQuery}"; fields name,cover.image_id,genres.name,platforms.name; limit 10;`,
    });

    if (!res.ok) {
      return [];
    }

    const results = (await res.json()) as IgdbGameResult[];
    return results.map((game) => ({
      title: game.name,
      genre: game.genres?.[0]?.name ?? null,
      coverUrl: game.cover ? toCoverUrl(game.cover.image_id) : null,
      platforms: game.platforms?.map((platform) => platform.name) ?? [],
    }));
  } catch {
    return [];
  }
}
