import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const jwtToken = req.cookies.jwt;

  if (!jwtToken) {
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
    const decodedToken = jwt.verify(jwtToken, secret) as string;

    if (!decodedToken) {
      res.status(401).json({
        message: "User not verified",
      });
      return;
    }

    (req as unknown as { userId: string }).userId = decodedToken;

    next();
  } catch {
    res.status(401).json({
      message: "User not verified",
    });
  }
};
