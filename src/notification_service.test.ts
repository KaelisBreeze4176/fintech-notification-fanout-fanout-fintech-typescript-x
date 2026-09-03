import assert from "node:assert/strict";
import { notificationPayload } from "./notification_service.js";

const event = { payment_id: "p1", account_id: "a1", amount_cents: 500, currency: "USD", risk: "high" as const, subscribers: ["https://example.com/hook"] };
const payload = notificationPayload(event, event.subscribers[0]);
assert.equal(payload.audit.action, "review");
assert.equal(payload.event_id, "p1:https://example.com/hook");
console.log("notification decision test passed");
