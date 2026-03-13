import { Router } from "express";
import {
  closeTradeController,
  fetchClosedTrades,
  fetchOpenTrades,
  openTradeController,
} from "../controller/tradeController";
import { guestAwareAuthMiddleware } from "../middleware/guestMiddleware";
import { guestTradeLimiter } from "../middleware/guestRateLimiter";
import { asyncHandler } from "../middleware/errorHandler";

const tradeRouter: Router = Router();

tradeRouter.use(guestAwareAuthMiddleware);
tradeRouter.post("/open", guestTradeLimiter, asyncHandler(openTradeController));
tradeRouter.get("/open", asyncHandler(fetchOpenTrades));
tradeRouter.post("/close", guestTradeLimiter, asyncHandler(closeTradeController));
tradeRouter.get("/closed", asyncHandler(fetchClosedTrades));

export default tradeRouter;
