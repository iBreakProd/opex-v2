import {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);

  if (res.headersSent) {
    return;
  }

  res.status(500).json({
    message: "An unexpected error occurred",
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
