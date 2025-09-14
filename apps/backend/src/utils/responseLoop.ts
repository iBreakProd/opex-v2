import { engineResponsePuller } from "@repo/redis/queue";

type PendingEntry = {
  resolve: (msg?: unknown) => void;
  reject: (msg?: string) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

export class ResponseLoop {
  private idResponseMap: Record<string, PendingEntry> = {};

  constructor() {}

  start(): void {
    this.runLoop();
  }

  private safeSettle(
    gotId: string,
    settle: (entry: PendingEntry) => void
  ): boolean {
    const entry = this.idResponseMap[gotId];
    if (!entry) return false;
    clearTimeout(entry.timeoutId);
    delete this.idResponseMap[gotId];
    settle(entry);
    return true;
  }

  async runLoop() {
    while (1) {
      try {
        const res = await engineResponsePuller.xRead(
          {
            key: "stream:engine:response",
            id: "$",
          },
          { BLOCK: 5000, COUNT: 1 }
        );

        if (!res?.[0]?.messages?.[0]?.message) continue;

        const msg = res[0].messages[0].message;
        const reqType = msg.type;
        const gotId = msg.reqId;

        if (!gotId) continue;

        switch (reqType) {
          case "user-signup/in-ack":
            this.safeSettle(gotId, (e) => e.resolve());
            break;
          case "request-failed":
          case "trade-open-err":
          case "trade-close-err":
          case "get-user-bal-err": {
            let message = "Request failed";
            try {
              const raw = msg.response;
              const parsed = raw
                ? (JSON.parse(raw as string) as { message?: string })
                : null;
              if (parsed?.message) message = parsed.message;
            } catch {}
            this.safeSettle(gotId, (e) => e.reject(message));
            break;
          }
          case "trade-open-ack": {
            try {
              const raw = res[0]?.messages[0]?.message.response;
              const parsed = raw
                ? (JSON.parse(raw as string) as {
                    order?: unknown;
                    orderId?: string;
                  })
                : null;
              if (parsed?.order !== undefined && parsed?.orderId !== undefined) {
                this.safeSettle(gotId, (e) =>
                  e.resolve(JSON.stringify({ order: parsed.order, orderId: parsed.orderId }))
                );
              } else {
                this.safeSettle(gotId, (e) => e.reject("Invalid response shape"));
              }
            } catch {
              this.safeSettle(gotId, (e) => e.reject("Invalid response"));
            }
            break;
          }
          case "trade-close-ack": {
            try {
              const raw = res[0]?.messages[0]?.message.response;
              const parsed = raw
                ? (JSON.parse(raw as string) as {
                    userBal?: unknown;
                    orderId?: string;
                  })
                : null;
              if (parsed !== null && parsed !== undefined) {
                this.safeSettle(gotId, (e) =>
                  e.resolve(
                    JSON.stringify({
                      userBal: parsed.userBal,
                      orderId: parsed.orderId,
                    })
                  )
                );
              } else {
                this.safeSettle(gotId, (e) => e.reject("Invalid response shape"));
              }
            } catch {
              this.safeSettle(gotId, (e) => e.reject("Invalid response"));
            }
            break;
          }
          case "get-asset-bal-ack": {
            try {
              const raw = res[0]?.messages[0]?.message.response;
              const parsed = raw
                ? (JSON.parse(raw as string) as { assetBal?: unknown })
                : null;
              if (parsed?.assetBal !== undefined) {
                this.safeSettle(gotId, (e) => e.resolve(parsed.assetBal));
              } else {
                this.safeSettle(gotId, (e) => e.reject("Invalid response shape"));
              }
            } catch {
              this.safeSettle(gotId, (e) => e.reject("Invalid response"));
            }
            break;
          }
          case "get-user-bal-ack": {
            try {
              const raw = res[0]?.messages[0]?.message.response;
              const parsed = raw
                ? (JSON.parse(raw as string) as { userBal?: unknown })
                : null;
              if (parsed?.userBal !== undefined) {
                this.safeSettle(gotId, (e) => e.resolve(parsed.userBal));
              } else {
                this.safeSettle(gotId, (e) => e.reject("Invalid response shape"));
              }
            } catch {
              this.safeSettle(gotId, (e) => e.reject("Invalid response"));
            }
            break;
          }
          case "open-trades-fetch-ack": {
            try {
              const raw = res[0]?.messages[0]?.message.response;
              const parsed = raw
                ? (JSON.parse(raw as string) as { trades?: unknown })
                : null;
              if (parsed?.trades !== undefined) {
                this.safeSettle(gotId, (e) => e.resolve(parsed.trades));
              } else {
                this.safeSettle(gotId, (e) => e.reject("Invalid response shape"));
              }
            } catch {
              this.safeSettle(gotId, (e) => e.reject("Invalid response"));
            }
            break;
          }
          default:
            console.error("ResponseLoop: unknown response type", reqType);
            this.safeSettle(gotId, (e) =>
              e.reject("Unknown response type")
            );
            break;
        }
      } catch (err) {
        console.error("ResponseLoop error", err);
      }
    }
  }

  async waitForResponse(id: string): Promise<unknown> {
    return new Promise<void | string | unknown>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const entry = this.idResponseMap[id];
        if (entry) {
          delete this.idResponseMap[id];
          reject("Response not got within time");
        }
      }, 3500);
      this.idResponseMap[id] = { resolve, reject, timeoutId };
    });
  }
}

export const responseLoopObj = new ResponseLoop();
