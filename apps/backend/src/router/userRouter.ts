import { Router } from "express";
import {
  signinController,
  emailGenController,
} from "../controller/authController";
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

export default userRouter;
