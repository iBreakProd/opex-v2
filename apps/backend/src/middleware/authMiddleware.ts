import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const jwtToken = req.cookies?.jwt;

  const decodedToken = jwt.verify(jwtToken, process.env.JWT_SECRET!) as string;

  if (!jwtToken || !decodedToken) {
    res.status(401).json({
      message: "User not verified",
    });
    return;
  }

  (req as unknown as { userId: string }).userId = decodedToken;

  next();
};
