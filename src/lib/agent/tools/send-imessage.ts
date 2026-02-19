import { sendMessage } from "../imessage";

interface SendIMessageInput {
  phone_number: string;
  message: string;
}

export async function sendIMessage(input: SendIMessageInput) {
  await sendMessage(input.phone_number, input.message);
  return { sent: true, phone_number: input.phone_number };
}
