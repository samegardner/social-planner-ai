import { sendEmail } from "../email";

interface SendEmailInput {
  email: string;
  subject: string;
  message: string;
}

export async function sendEmailTool(input: SendEmailInput) {
  await sendEmail(input.email, input.subject, input.message);
  return { sent: true, email: input.email };
}
