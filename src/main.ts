import { fanOut, scheduleFanout } from "./notification_service.js";

const event = { payment_id: "pay_demo_01", account_id: "acct_42", amount_cents: 12500, currency: "USD", risk: "low", subscribers: ["https://example.com/hooks/ledger", "https://example.com/hooks/ops"] };
const taskUrl = process.env.FANOUT_TASK_URL;
if (!taskUrl) throw new Error("FANOUT_TASK_URL is required");
const schedule = await scheduleFanout(taskUrl);
const result = await fanOut(event);
console.log(JSON.stringify({ schedule, result }, null, 2));
