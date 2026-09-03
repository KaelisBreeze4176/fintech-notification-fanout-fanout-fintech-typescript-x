import { z } from "zod";
import { infrai } from "./infrai_client.js";

export const PaymentEvent = z.object({ payment_id: z.string().min(1), account_id: z.string().min(1), amount_cents: z.number().int().positive(), currency: z.string().length(3), risk: z.enum(["low", "high"]), subscribers: z.array(z.string().url()).min(1) });
export type PaymentEvent = z.infer<typeof PaymentEvent>;

export function notificationPayload(event: PaymentEvent, subscriber: string) {
  return { event_id: `${event.payment_id}:${subscriber}`, payment_id: event.payment_id, account_id: event.account_id, amount_cents: event.amount_cents, currency: event.currency, subscriber, audit: { risk: event.risk, action: event.risk === "high" ? "review" : "deliver" } };
}

export async function fanOut(raw: unknown) {
  const event = PaymentEvent.parse(raw);
  const published = [] as string[];
  for (const subscriber of event.subscribers) {
    const result = await infrai.queue.publish(notificationPayload(event, subscriber));
    if (result.message_id) published.push(result.message_id);
  }
  return { payment_id: event.payment_id, published: published.length, action: event.risk === "high" ? "review" : "deliver" };
}

export async function scheduleFanout(taskUrl: string) {
  return infrai.cron.create({ cron_expr: "*/5 * * * *", task: taskUrl });
}
