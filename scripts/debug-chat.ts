import Database from "better-sqlite3";
import path from "path";

const chatDb = new Database(
  path.join(process.env.HOME || "~", "Library/Messages/chat.db"),
  { readonly: true },
);
chatDb.pragma("query_only = ON");

// Show all handles that contain "929"
console.log("=== Handles matching '929' ===");
const handles = chatDb
  .prepare("SELECT ROWID, id, service FROM handle WHERE id LIKE '%929%'")
  .all();
console.log(handles);

// Show recent chats
console.log("\n=== Recent chats (last 10) ===");
const chats = chatDb
  .prepare(
    `SELECT c.ROWID, c.chat_identifier, c.service_name, c.display_name
     FROM chat c ORDER BY c.ROWID DESC LIMIT 10`,
  )
  .all();
console.log(chats);

// Show last 10 messages in the 929-249-2238 conversation with attributedBody check
console.log("\n=== Recent messages in +19292492238 conversation ===");
const msgs = chatDb
  .prepare(
    `SELECT m.ROWID, m.text, m.is_from_me, h.id as handle_id, m.service,
            m.attributedBody IS NOT NULL as has_attributed_body,
            LENGTH(m.attributedBody) as attributed_body_len
     FROM message m
     JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
     JOIN chat c ON c.ROWID = cmj.chat_id
     JOIN chat_handle_join chj ON chj.chat_id = c.ROWID
     JOIN handle h ON h.ROWID = chj.handle_id
     WHERE h.id = '+19292492238'
     ORDER BY m.ROWID DESC LIMIT 10`,
  )
  .all();
console.log(msgs);

// Try to extract text from attributedBody for null-text messages
console.log("\n=== Extracting text from attributedBody ===");
const nullTextMsgs = chatDb
  .prepare(
    `SELECT m.ROWID, m.attributedBody
     FROM message m
     JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
     JOIN chat c ON c.ROWID = cmj.chat_id
     JOIN chat_handle_join chj ON chj.chat_id = c.ROWID
     JOIN handle h ON h.ROWID = chj.handle_id
     WHERE h.id = '+19292492238'
       AND m.text IS NULL
       AND m.attributedBody IS NOT NULL
     ORDER BY m.ROWID DESC LIMIT 5`,
  )
  .all() as Array<{ ROWID: number; attributedBody: Buffer }>;

for (const msg of nullTextMsgs) {
  // Extract readable text from the NSAttributedString blob
  const buf = msg.attributedBody;
  const str = buf.toString("utf-8");
  // The text is typically between "NSString" markers or at the start of the blob
  const match = str.match(/NSString[^\x00]*\x00+([\s\S]*?)(?:\x00|\x04|\x84)/);
  // Simpler: just grab any printable text runs
  const printable = str.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
  console.log(`rowId=${msg.ROWID}: "${printable.substring(0, 100)}"`);
}

chatDb.close();
