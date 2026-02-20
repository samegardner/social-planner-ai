export async function sendEmail(
  to: string,
  subject: string,
  text: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY in env");
  if (!from) throw new Error("Missing RESEND_FROM_EMAIL in env");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to, subject, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[Resend] Send failed (${res.status}):`, body);
    throw new Error(`Resend send failed: ${res.status}`);
  }

  const data = await res.json();
  console.log(`[Resend] sent to=${to} id=${data.id}`);
}
