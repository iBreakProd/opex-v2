import { Request, Response } from "express";
import { authBodySchema } from "@repo/types/zodSchema";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail";
import { httpPusher } from "@repo/redis/queue";
import { responseLoopObj } from "../utils/responseLoop";
import prismaClient from "@repo/db/client";
import "dotenv/config";

(async () => {
  await httpPusher.connect();
})();

export const emailGenController = async (req: Request, res: Response) => {
  const validInput = authBodySchema.safeParse(req.body);

  if (!validInput.success) {
    res.status(404).json({
      message: "Invalid input",
    });
    return;
  }

  const email = validInput.data.email;

  try {
    const reqId = Date.now().toString() + crypto.randomUUID();

    const userFound = await prismaClient.users.findFirst({
      where: {
        email,
      },
    });

    let user = userFound;

    if (!userFound) {
      const dbRes = await prismaClient.users.create({
        data: {
          email: email,
          balance: 50000000,
          decimal: 4,
        },
      });

      user = dbRes;
    }
    const jwtToken = jwt.sign(user!.id, process.env.JWT_SECRET!);

    await httpPusher.xAdd("stream:app:info", "*", {
      type: "user-signup",
      user: JSON.stringify(user),
      reqId,
    });

    await responseLoopObj.waitForResponse(reqId);

    const { data, error } = await sendEmail(user!.email, jwtToken);

    if (error) {
      console.log("send email fails");
      res.status(400).json({ error });
      return;
    }

    res.json({
      message: "Email sent. Check your inbox and follow the link to log in.",
    });
    return;
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: "Could not sign up, request timed out",
    });
    return;
  }
};

export const signinController = async (req: Request, res: Response) => {
  const token = req.query.token?.toString();

  if (!token) {
    console.log("Token not found");
    res.status(411).json({
      message: "Token not found",
    });
    return;
  }

  const verifiedToken = jwt.verify(token, process.env.JWT_SECRET!) as string;

  try {
    const reqId = Date.now().toString() + crypto.randomUUID();

    const userFound = await prismaClient.users.findFirst({
      where: {
        id: verifiedToken,
      },
    });

    if (!userFound?.email) {
      res.status(401).json({
        message: "User not found",
      });
      return;
    }
    await httpPusher.xAdd("stream:app:info", "*", {
      type: "user-signin",
      user: JSON.stringify(userFound),
      reqId,
    });

    await responseLoopObj.waitForResponse(reqId);

    res.cookie("jwt", token, { httpOnly: true, secure: true, sameSite: 'strict' });
    console.log(process.env.CORS_ORIGIN);
    res.redirect(new URL("/#/trade", process.env.CORS_ORIGIN).toString());
    return;
  } catch (err) {
    res.status(400).json({
      message: "Could not sign in, request timed out",
    });
    return;
  }
};
