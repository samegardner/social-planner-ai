import { google } from "googleapis";
import fs from "fs";
import path from "path";

const TOKENS_PATH = path.join(process.cwd(), "data", "google-tokens.json");
const REDIRECT_URI = "http://localhost:3333/callback";

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  );
}

export function loadTokens(): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(TOKENS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    // Fall back to env var (for Railway where the token file doesn't exist)
    const envTokens = process.env.GOOGLE_TOKENS;
    if (envTokens) {
      const tokens = JSON.parse(envTokens);
      fs.mkdirSync(path.dirname(TOKENS_PATH), { recursive: true });
      fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
      console.log("Seeded Google tokens from GOOGLE_TOKENS env var.");
      return tokens;
    }
    return null;
  }
}

export function saveTokens(tokens: Record<string, unknown>): void {
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

export function getAuthenticatedClient() {
  const client = createOAuth2Client();
  const tokens = loadTokens();
  if (!tokens) {
    throw new Error(
      "No Google tokens found. Run `npx tsx scripts/google-auth.ts` first.",
    );
  }
  client.setCredentials(tokens);

  // Auto-refresh: save new tokens when refreshed
  client.on("tokens", (newTokens) => {
    const existing = loadTokens() || {};
    saveTokens({ ...existing, ...newTokens });
    console.log("Google OAuth tokens refreshed and saved.");
  });

  return client;
}
