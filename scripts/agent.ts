import "dotenv/config";
import { startAgent } from "../src/lib/agent/index";

// Keep process alive on uncaught errors (log but don't crash)
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

startAgent().catch((err) => {
  console.error("Agent failed to start:", err.message);
  process.exit(1);
});
