function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return phone;
}

export async function sendMessage(
  phoneNumber: string,
  text: string,
): Promise<void> {
  const apiKey = process.env.TELNYX_API_KEY;
  const fromNumber = process.env.TELNYX_PHONE_NUMBER;
  if (!apiKey) throw new Error("Missing TELNYX_API_KEY in env");
  if (!fromNumber) throw new Error("Missing TELNYX_PHONE_NUMBER in env");

  const normalized = normalizePhone(phoneNumber);

  const res = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: fromNumber,
      to: normalized,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[Telnyx] Send failed (${res.status}):`, body);
    throw new Error(`Telnyx send failed: ${res.status}`);
  }

  const data = await res.json();
  console.log(`[Telnyx] sent to=${normalized} id=${data.data?.id}`);
}
