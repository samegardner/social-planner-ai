import { sendMessage } from "../imessage";

interface SendMessageInput {
  message: string;
}

export async function sendTelegramMessage(input: SendMessageInput, chatId: string) {
  await sendMessage(chatId, input.message);
  return { sent: true, chat_id: chatId };
}
