import "dotenv/config";
import http from "http";
import { createOAuth2Client, saveTokens } from "../src/lib/agent/google-tokens";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

async function main() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env");
    process.exit(1);
  }

  const client = createOAuth2Client();

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.log("\nOpen this URL in your browser to authorize Google Calendar:\n");
  console.log(authUrl);
  console.log("\nWaiting for callback on http://localhost:3333/callback ...\n");

  // Open browser automatically on macOS
  const { exec } = await import("child_process");
  exec(`open "${authUrl}"`);

  return new Promise<void>((resolve) => {
    const server = http.createServer(async (req, res) => {
      if (!req.url?.startsWith("/callback")) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const url = new URL(req.url, "http://localhost:3333");
      const code = url.searchParams.get("code");

      if (!code) {
        res.writeHead(400);
        res.end("Missing authorization code");
        return;
      }

      try {
        const { tokens } = await client.getToken(code);
        saveTokens(tokens as Record<string, unknown>);
        console.log("Tokens saved to data/google-tokens.json");

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Google Calendar authorized!</h1><p>You can close this tab.</p>");
      } catch (err) {
        console.error("Token exchange failed:", err);
        res.writeHead(500);
        res.end("Token exchange failed");
      }

      server.close();
      resolve();
    });

    server.listen(3333);
  });
}

main().catch(console.error);
