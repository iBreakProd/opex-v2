import rateLimit, { type Options } from "express-rate-limit";
import { Request } from "express";

export const guestTradeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  skip: (req: Request) => {
    return !(req as unknown as { isGuest: boolean }).isGuest;
  },
  message: { message: "Too many requests. Please sign up for unlimited trading." },
} as Partial<Options>);
