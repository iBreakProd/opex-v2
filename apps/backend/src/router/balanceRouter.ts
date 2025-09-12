import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getAssetBalanceController, getUsdBalanceController } from "../controller/balanceController";
import { asyncHandler } from "../middleware/errorHandler";

const balanceRouter: Router = Router();

balanceRouter.use(authMiddleware);
balanceRouter.get("/", asyncHandler(getAssetBalanceController));
balanceRouter.get("/usd", asyncHandler(getUsdBalanceController));

export default balanceRouter;
