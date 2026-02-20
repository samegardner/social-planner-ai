export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAgent } = await import("@/lib/agent");
    try {
      await startAgent();
    } catch (err) {
      console.error("Agent startup failed (will retry on first webhook):", err);
    }
  }
}
