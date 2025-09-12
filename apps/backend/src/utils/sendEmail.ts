import { Resend } from "resend";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API!);

export const sendEmail = async (email: string, jwtToken: string) => {
  return await resend.emails.send({
    from: "Login <maessage@mail.hrsht.me>",
    to: [`${email}`],
    subject: "Here's your login link",
    html: `<h1>Here is your login magic link</h1>
    <a href="${process.env.API_BASE_URL}/auth/signin/post?token=${jwtToken}">click here</a>`,
  });
};
