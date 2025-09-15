import { Resend } from "resend";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API!);

export const sendEmail = async (email: string, jwtToken: string) => {
  return await resend.emails.send({
    from: "Login <maessage@mail.hrsht.me>",
    to: [`${email}`],
    subject: "Here's your login link",
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login to Opex</title>
    <style>
        body { margin: 0; padding: 0; background-color: #F3EFDE; font-family: 'Courier New', Courier, monospace; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; padding-bottom: 30px; border-bottom: 2px solid #171707; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: bold; color: #171707; letter-spacing: -1px; text-decoration: none; }
        .content { background-color: #ffffff; padding: 40px; border: 2px solid #171707; box-shadow: 8px 8px 0px 0px #171707; }
        .title { color: #171707; font-size: 24px; margin-bottom: 20px; font-weight: bold; }
        .text { color: #171707; line-height: 1.6; margin-bottom: 30px; font-size: 16px; }
        .button { display: inline-block; background-color: #1B8C88; color: #ffffff !important; padding: 15px 30px; text-decoration: none; font-weight: bold; font-size: 16px; border: 2px solid #171707; transition: all 0.2s; box-shadow: 4px 4px 0px 0px #171707; }
        .button:hover { transform: translate(2px, 2px); box-shadow: 2px 2px 0px 0px #171707; }
        .footer { text-align: center; margin-top: 40px; color: #171707; opacity: 0.6; font-size: 12px; }
    </style>
</head>
<body style="background-color: #F3EFDE;">
    <div class="container">
        <div class="header">
            <h1 class="logo">OPEX</h1>
        </div>
        
        <div class="content">
            <h1 class="title">Secure Access Request</h1>
            <p class="text">We received a request to access your Opex trading account. Click the button below to sign in securely.</p>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.API_BASE_URL}/auth/signin/post?token=${jwtToken}" class="button">AUTHENTICATE_SESSION</a>
            </div>
            
            <p class="text" style="font-size: 14px; color: #666;">If you did not request this link, please ignore this email.</p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Opex Ltd. All rights reserved.</p>
            <p>Brutal execution. Minimalist design.</p>
        </div>
    </div>
</body>
</html>
    `,
  });
};
