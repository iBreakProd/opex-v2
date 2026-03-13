import { Router } from "express";
import {
  signinController,
  emailGenController,
  whoamiController,
  logoutController,
  guestSessionController,
} from "../controller/authController";
import { authMiddleware } from "../middleware/authMiddleware";
import { guestAwareAuthMiddleware } from "../middleware/guestMiddleware";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../middleware/errorHandler";

const userRouter: Router = Router();

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
});

const guestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

userRouter.route("/signup").post(limiter, asyncHandler(emailGenController));
userRouter.route("/signin/post").get(asyncHandler(signinController));
userRouter.route("/whoami").get(guestAwareAuthMiddleware, asyncHandler(whoamiController));
userRouter.route("/logout").post(authMiddleware, asyncHandler(logoutController));
userRouter.route("/guest").post(guestLimiter, asyncHandler(guestSessionController));

export default userRouter;
