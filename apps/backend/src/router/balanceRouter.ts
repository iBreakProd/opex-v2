import { Router } from "express";
import { guestAwareAuthMiddleware } from "../middleware/guestMiddleware";
import { getAssetBalanceController, getUsdBalanceController } from "../controller/balanceController";
import { asyncHandler } from "../middleware/errorHandler";

const balanceRouter: Router = Router();

balanceRouter.use(guestAwareAuthMiddleware);
balanceRouter.get("/", asyncHandler(getAssetBalanceController));
balanceRouter.get("/usd", asyncHandler(getUsdBalanceController));

export default balanceRouter;
