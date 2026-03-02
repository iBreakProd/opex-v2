import { Router } from "express";
import {
  signinController,
  emailGenController,
  whoamiController,
  logoutController,
} from "../controller/authController";
import { authMiddleware } from "../middleware/authMiddleware";
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

userRouter.route("/signup").post(limiter, asyncHandler(emailGenController));
userRouter.route("/signin/post").get(asyncHandler(signinController));
userRouter.route("/whoami").get(authMiddleware, asyncHandler(whoamiController));
userRouter.route("/logout").post(authMiddleware, asyncHandler(logoutController));

export default userRouter;
