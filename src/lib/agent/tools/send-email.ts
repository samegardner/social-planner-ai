import { sendEmail } from "../email";

interface SendEmailInput {
  subject: string;
  message: string;
}

export async function sendEmailTool(
  input: SendEmailInput,
  userEmail: string,
) {
  await sendEmail(userEmail, input.subject, input.message);
  return { sent: true, email: userEmail };
}
