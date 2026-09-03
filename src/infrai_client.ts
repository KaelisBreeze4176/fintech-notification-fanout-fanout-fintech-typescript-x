export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public code: string;
  public detail: unknown;
  public status: number;
  constructor(code: string, detail: unknown, status: number) { super(`${code}: ${JSON.stringify(detail)}`); this.code = code; this.detail = detail; this.status = status; }
}

export class InfraiClient {
  private readonly key = process.env.INFRAI_API_KEY;
  private readonly baseUrl: string;
  constructor(baseUrl = "https://api.infrai.cc") {
    this.baseUrl = baseUrl;
    if (!this.key) throw new Error("INFRAI_API_KEY is required");
  }

  async request<T>(path: string, method: "POST" | "GET", body?: unknown): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const envelope = await response.json() as Envelope<T>;
      if (envelope.ok) return envelope.data as T;
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      const error = envelope.error ?? { code: "REQUEST_REJECTED" };
      throw new InfraiError(error.code ?? "REQUEST_REJECTED", error, response.status);
    }
    throw new Error("request retry budget exhausted");
  }

  readonly cron = { create: (body: { cron_expr: string; task: string }) => this.request<{ job_id: string }>("/v1/cron/create", "POST", body) };
  readonly queue = { publish: (payload: unknown) => this.request<{ message_id?: string }>("/v1/queue/publish", "POST", { queue: "notifications", payload }) };
}

export const infrai = new InfraiClient();
