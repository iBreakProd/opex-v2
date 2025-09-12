function normalizeReason(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return "";
}

export function mapTradeErrorToUserMessage(err: unknown): string {
  const reason = normalizeReason(err).trim();
  const lower = reason.toLowerCase();

  if (lower.includes("response not got within time")) {
    return "Trade is taking longer than expected. Please try again.";
  }

  if (lower.includes("slippage")) {
    return "Price moved too quickly. Please retry (or increase slippage).";
  }
  if (lower.includes("enough balance")) {
    return "Insufficient balance to open this trade.";
  }
  if (lower.includes("asset") && lower.includes("not")) {
    return "This asset is not supported.";
  }
  if (lower.includes("order does")) {
    return "Trade not found or already closed.";
  }
  if (lower.includes("user does")) {
    return "Please sign in again and retry.";
  }
  if (lower.includes("failed to save trade")) {
    return "We couldn’t complete that trade right now. Please try again.";
  }

  if (lower.includes("request failed")) {
    return "Trade failed. Please try again.";
  }

  return "Trade failed. Please try again.";
}

export function logTradeFailure(context: string, err: unknown) {
  const reason = normalizeReason(err);
  if (reason) {
    console.warn(`[trade] ${context} failed: ${reason}`);
  } else {
    console.warn(`[trade] ${context} failed`, err);
  }
}

