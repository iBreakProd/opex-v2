import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";

export const guestAwareAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const jwtToken = req.cookies.jwt;
  const guestToken = req.cookies.guest_session;
  const token = jwtToken || guestToken;

  if (!token) {
    res.status(401).json({
      message: "User not verified",
    });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({
      message: "Server configuration error",
    });
    return;
  }

  try {
    const decodedToken = jwt.verify(token, secret) as string;

    if (!decodedToken) {
      res.status(401).json({
        message: "User not verified",
      });
      return;
    }

    (req as unknown as { userId: string; isGuest: boolean }).userId =
      decodedToken;
    (req as unknown as { userId: string; isGuest: boolean }).isGuest =
      !jwtToken || decodedToken.startsWith("guest:");

    next();
  } catch {
    res.status(401).json({
      message: "User not verified",
    });
  }
};
