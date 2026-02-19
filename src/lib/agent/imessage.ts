import Twilio from "twilio";
import Database from "better-sqlite3";
import path from "path";

// Apple epoch offset: seconds between Unix epoch (1970) and Apple epoch (2001)
const APPLE_EPOCH_OFFSET = 978307200;

let twilioClient: ReturnType<typeof Twilio> | null = null;

function getTwilioClient() {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in .env");
    }
    twilioClient = Twilio(sid, token);
  }
  return twilioClient;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return phone; // already formatted or international
}

// Send SMS via Twilio API
export async function sendMessage(
  phoneNumber: string,
  text: string,
): Promise<void> {
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) {
    throw new Error("Missing TWILIO_PHONE_NUMBER in .env");
  }

  const normalized = normalizePhone(phoneNumber);
  const client = getTwilioClient();

  const msg = await client.messages.create({
    body: text,
    from: fromNumber,
    to: normalized,
  });

  console.log(`[Twilio] sid=${msg.sid} status=${msg.status} to=${msg.to}`);
}

export function getLatestRowId(phoneNumber: string): number {
  const chatDbPath = path.join(
    process.env.HOME || "~",
    "Library/Messages/chat.db",
  );
  const chatDb = new Database(chatDbPath, { readonly: true });
  chatDb.pragma("query_only = ON");

  try {
    const normalized = normalizePhone(phoneNumber);
    const row = chatDb
      .prepare(
        `
      SELECT MAX(m.ROWID) as maxRowId
      FROM message m
      JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
      JOIN chat c ON c.ROWID = cmj.chat_id
      JOIN chat_handle_join chj ON chj.chat_id = c.ROWID
      JOIN handle h ON h.ROWID = chj.handle_id
      WHERE h.id = ?
    `,
      )
      .get(normalized) as { maxRowId: number | null } | undefined;

    return row?.maxRowId ?? 0;
  } finally {
    chatDb.close();
  }
}

// Extract text from NSAttributedString blob (used when text column is null, common for SMS)
function extractTextFromAttributedBody(buf: Buffer): string | null {
  try {
    const str = buf.toString("utf-8");

    const nsStringIdx = str.indexOf("NSString");
    if (nsStringIdx === -1) return null;

    // Jump past "NSString" header
    const searchStart = nsStringIdx + 8;
    const endMarker = str.indexOf("NSDictionary", searchStart);
    const searchEnd = endMarker > 0 ? endMarker : Math.min(searchStart + 500, str.length);

    const region = str.substring(searchStart, searchEnd);

    // Extract the longest run of printable characters (the actual message text)
    const runs: string[] = [];
    let current = "";
    for (const char of region) {
      const code = char.charCodeAt(0);
      if (code >= 0x20 && code <= 0x7e) {
        current += char;
      } else if (code >= 0x80 && code <= 0xffff) {
        current += char;
      } else {
        if (current.length > 0) {
          runs.push(current);
          current = "";
        }
      }
    }
    if (current.length > 0) runs.push(current);

    if (runs.length === 0) return null;
    const longest = runs.reduce((a, b) => (a.length >= b.length ? a : b));
    return longest.trim() || null;
  } catch {
    return null;
  }
}

export interface IncomingMessage {
  rowId: number;
  text: string;
  isFromMe: boolean;
  date: Date;
}

export function getNewMessages(
  phoneNumber: string,
  sinceRowId: number,
): IncomingMessage[] {
  const chatDbPath = path.join(
    process.env.HOME || "~",
    "Library/Messages/chat.db",
  );

  const chatDb = new Database(chatDbPath, { readonly: true });
  chatDb.pragma("query_only = ON");

  try {
    const normalized = normalizePhone(phoneNumber);

    const rows = chatDb
      .prepare(
        `
      SELECT
        m.ROWID as rowId,
        m.text,
        m.attributedBody,
        m.is_from_me as isFromMe,
        m.date as appleDate
      FROM message m
      JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
      JOIN chat c ON c.ROWID = cmj.chat_id
      JOIN chat_handle_join chj ON chj.chat_id = c.ROWID
      JOIN handle h ON h.ROWID = chj.handle_id
      WHERE h.id = ?
        AND m.ROWID > ?
        AND m.associated_message_type = 0
        AND (m.text IS NOT NULL OR m.attributedBody IS NOT NULL)
      ORDER BY m.ROWID ASC
    `,
      )
      .all(normalized, sinceRowId) as Array<{
      rowId: number;
      text: string | null;
      attributedBody: Buffer | null;
      isFromMe: number;
      appleDate: number;
    }>;

    return rows
      .map((row) => {
        const text =
          row.text ??
          (row.attributedBody
            ? extractTextFromAttributedBody(row.attributedBody)
            : null);
        if (!text) return null;
        return {
          rowId: row.rowId,
          text,
          isFromMe: row.isFromMe === 1,
          date: new Date((row.appleDate / 1e9 + APPLE_EPOCH_OFFSET) * 1000),
        };
      })
      .filter((msg): msg is IncomingMessage => msg !== null);
  } finally {
    chatDb.close();
  }
}
