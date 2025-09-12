import { Router } from "express";
import {
  closeTradeController,
  fetchClosedTrades,
  fetchOpenTrades,
  openTradeController,
} from "../controller/tradeController";
import { authMiddleware } from "../middleware/authMiddleware";
import { asyncHandler } from "../middleware/errorHandler";

const tradeRouter: Router = Router();

tradeRouter.use(authMiddleware);
tradeRouter.post("/open", asyncHandler(openTradeController));
tradeRouter.get("/open", asyncHandler(fetchOpenTrades));
tradeRouter.post("/close", asyncHandler(closeTradeController));
tradeRouter.get("/closed", asyncHandler(fetchClosedTrades));

export default tradeRouter;
