/** Convert markdown-style text to simple HTML for email rendering. */
function markdownToHtml(md: string): string {
  let html = md
    // Escape HTML entities first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    // Italic: *text* or _text_ (but not inside words)
    .replace(/(?<!\w)\*(.+?)\*(?!\w)/g, "<em>$1</em>")
    .replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");

  // Convert bullet lines (- or *) into <ul> lists
  const lines = html.split("\n");
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    const bulletMatch = line.match(/^\s*[-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (!inList) {
        result.push("<ul>");
        inList = true;
      }
      result.push(`<li>${bulletMatch[1]}</li>`);
    } else {
      if (inList) {
        result.push("</ul>");
        inList = false;
      }
      result.push(line);
    }
  }
  if (inList) result.push("</ul>");

  // Wrap non-list, non-empty lines in <p> tags, join the rest
  const body = result
    .map((line) => {
      if (line.startsWith("<ul>") || line.startsWith("</ul>") || line.startsWith("<li>")) {
        return line;
      }
      const trimmed = line.trim();
      if (!trimmed) return "<br>";
      return `<p style="margin:0 0 8px 0">${trimmed}</p>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.5; color: #1a1a1a; max-width: 600px;">
${body}
</body>
</html>`;
}

/** Strip markdown syntax for the plain-text fallback. */
function stripMarkdown(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(?<!\w)\*(.+?)\*(?!\w)/g, "$1")
    .replace(/(?<!\w)_(.+?)_(?!\w)/g, "$1");
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY in env");
  if (!from) throw new Error("Missing RESEND_FROM_EMAIL in env");

  const html = markdownToHtml(body);
  const text = stripMarkdown(body);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const respBody = await res.text();
    console.error(`[Resend] Send failed (${res.status}):`, respBody);
    throw new Error(`Resend send failed: ${res.status}`);
  }

  const data = await res.json();
  console.log(`[Resend] sent to=${to} id=${data.id}`);
}
